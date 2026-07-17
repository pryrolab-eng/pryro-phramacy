import { NextResponse } from "next/server";
import { zodToJsonSchema } from "zod-to-json-schema";
import { Prisma } from "@prisma/client";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { requireUserPharmacyId } from "@/lib/pharmacy/get-session-pharmacy";
import { resolveIsAppPlatformAdmin } from "@/lib/platform-admin";
import { resolvePharmacyEntitlements } from "@/lib/subscription/lifecycle/entitlements";
import { isEntitlementsEnforced } from "@/lib/subscription/feature-catalog";
import { getAiClient, AI_MODEL, AI_DEFAULTS } from "@/lib/ai/client";
import { getSystemPrompt, type PageContext, buildPageContextBlock } from "@/lib/ai/chat-system-prompt";
import { pharmacyTools } from "@/lib/ai/pharmacy-tools";
import { adminTools } from "@/lib/ai/admin-tools";
import { settingsTools, type SettingsToolContext } from "@/lib/ai/settings-tools";
import { prisma } from "@/lib/db/prisma";
import { createTraceId, recordAiTrace, extractTokenUsage, addTokenUsage, AI_STREAM_USAGE_OPTIONS, type TokenUsage } from "@/lib/ai/observability";

export const maxDuration = 60;

type AiScope = "pharmacy" | "platform_admin";

export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { threadId, messages, scope, pageContext } = body as {
      threadId?: string;
      messages: { role: string; content: string }[];
      scope: AiScope;
      pageContext?: PageContext;
    };

    // ── Resolve scope and entitlements ─────────────────────────
    let pharmacyId: string | null = null;
    let branchId: string | null = null;
    let isPlatformAdmin = false;

    if (scope === "platform_admin") {
      isPlatformAdmin = await resolveIsAppPlatformAdmin(user.id);
      if (!isPlatformAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else {
      pharmacyId = await requireUserPharmacyId(user.id);

      if (isEntitlementsEnforced()) {
        const ent = await resolvePharmacyEntitlements(pharmacyId);
        if (!ent.can("ai.chat")) {
          return NextResponse.json(
            { error: "AI Assistant requires a plan that includes this feature" },
            { status: 403 },
          );
        }
      }
    }

    // ── Get or create thread ───────────────────────────────────
    let activeThreadId = threadId;
    try {
      if (!activeThreadId) {
        const thread = await prisma.ai_threads.create({
          data: {
            user_id: user.id,
            pharmacy_id: pharmacyId,
            branch_id: branchId,
            scope,
            title: messages[0]?.content?.slice(0, 80) ?? "New conversation",
          },
        });
        activeThreadId = thread.id;
      }

      const lastUserMessage = messages[messages.length - 1];
      if (lastUserMessage?.role === "user") {
        await prisma.ai_messages.create({
          data: {
            thread_id: activeThreadId,
            role: "user",
            content: lastUserMessage.content,
          },
        });
      }
    } catch (dbError) {
      if (
        dbError instanceof Prisma.PrismaClientKnownRequestError &&
        dbError.code === "P2021"
      ) {
        return NextResponse.json(
          {
            error:
              "AI database tables not yet created. Run `npx prisma db push` to set up the required tables.",
          },
          { status: 503 },
        );
      }
      throw dbError;
    }

    // ── Build tools ────────────────────────────────────────────
    const baseTools = scope === "pharmacy" ? pharmacyTools : adminTools;
    const toolContext = scope === "pharmacy" ? { pharmacyId: pharmacyId!, branchId } : undefined;

    const settingsContext: SettingsToolContext = {
      userId: user.id,
      userEmail: user.email ?? "",
      pharmacyId,
    };
    const boundSettingsTools = Object.fromEntries(
      Object.entries(settingsTools).map(([name, tool]) => [
        name,
        {
          ...tool,
          execute: (_ctx: unknown, params: unknown) =>
            tool.execute(settingsContext, params as never),
        },
      ]),
    );
    const tools = { ...baseTools, ...boundSettingsTools };

    const client = getAiClient();
    const traceId = createTraceId();

    if (!client) {
      const fallbackResponse =
        "I'm currently unavailable. The AI service is not configured. Please contact your administrator.";
      await prisma.ai_messages.create({
        data: { thread_id: activeThreadId, role: "assistant", content: fallbackResponse },
      });
      return NextResponse.json({
        threadId: activeThreadId,
        message: {
          id: crypto.randomUUID(),
          threadId: activeThreadId,
          role: "assistant",
          content: fallbackResponse,
          toolCalls: null,
          a2uiData: null,
          tokens: 0,
          createdAt: new Date().toISOString(),
        },
      });
    }

    // Build tool definitions
    type ToolEntry = [string, { description: string; parameters: any; execute: Function }];
    const toolEntries = Object.entries(tools) as ToolEntry[];
    const toolDefinitions = toolEntries.map(([name, tool]) => {
      const jsonSchema = zodToJsonSchema(tool.parameters) as any;
      const { $schema, additionalProperties, ...cleanSchema } = jsonSchema;
      return {
        type: "function" as const,
        function: {
          name,
          description: tool.description,
          parameters: {
            type: "object" as const,
            properties: cleanSchema.properties ?? {},
            required: cleanSchema.required ?? [],
          },
        },
      };
    });

    const systemMessage = {
      role: "system" as const,
      content: getSystemPrompt(scope, pageContext),
    };

    const pageContextBlock = pageContext ? buildPageContextBlock(pageContext) : null;

    const apiMessages = [
      systemMessage,
      ...(pageContextBlock
        ? [{ role: "system" as const, content: `Current page context:\n${pageContextBlock}` }]
        : []),
      ...messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    // ── Streaming SSE ──────────────────────────────────────────
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    const sendEvent = async (data: Record<string, unknown>) => {
      await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    };

    // Run the streaming pipeline in the background
    (async () => {
      try {
        const response = await client.chat.completions.create({
          model: AI_MODEL,
          messages: apiMessages,
          tools: toolDefinitions.length > 0 ? toolDefinitions : undefined,
          tool_choice: toolDefinitions.length > 0 ? "auto" : undefined,
          temperature: AI_DEFAULTS.temperature,
          top_p: AI_DEFAULTS.top_p,
          max_tokens: AI_DEFAULTS.max_tokens,
          ...AI_STREAM_USAGE_OPTIONS,
        });

        let fullContent = "";
        let tokenUsage: TokenUsage = { inputTokens: 0, outputTokens: 0 };
        const toolCallMap = new Map<
          number,
          { id: string; name: string; arguments: string }
        >();

        for await (const chunk of response) {
          if (chunk.usage) {
            tokenUsage = addTokenUsage(tokenUsage, extractTokenUsage(chunk));
          }

          const delta = chunk.choices[0]?.delta;
          if (!delta) continue;

          // Stream text deltas
          if (delta.content) {
            fullContent += delta.content;
            await sendEvent({ type: "text", delta: delta.content });
          }

          // Accumulate tool call deltas
          if (delta.tool_calls) {
            for (const tc of delta.tool_calls) {
              const idx = tc.index ?? 0;
              const existing = toolCallMap.get(idx);
              if (existing) {
                if (tc.id) existing.id = tc.id;
                if (tc.function?.name) existing.name = tc.function.name;
                if (tc.function?.arguments) existing.arguments += tc.function.arguments;
              } else {
                toolCallMap.set(idx, {
                  id: tc.id ?? "",
                  name: tc.function?.name ?? "",
                  arguments: tc.function?.arguments ?? "",
                });
              }
            }
          }
        }

        // ── Execute tool calls ──────────────────────────────────
        const executedToolCalls: {
          id: string;
          name: string;
          args?: unknown;
          result?: unknown;
          error?: string;
        }[] = [];

        if (toolCallMap.size > 0) {
          const toolCallsArray = Array.from(toolCallMap.values());

          // Send tool call status to client
          await sendEvent({
            type: "tool_calls",
            calls: toolCallsArray.map((tc) => ({
              id: tc.id,
              name: tc.name,
            })),
          });

          for (const tc of toolCallsArray) {
            const toolDef = tools[tc.name as keyof typeof tools];
            if (toolDef) {
              try {
                const args = JSON.parse(tc.arguments);
                const result =
                  scope === "pharmacy"
                    ? await (toolDef as any).execute(toolContext, args)
                    : await (toolDef as any).execute(args);
                executedToolCalls.push({ id: tc.id, name: tc.name, args, result });
              } catch (error) {
                executedToolCalls.push({
                  id: tc.id,
                  name: tc.name,
                  error: String(error),
                });
              }
            }
          }

          // ── Follow-up streaming call ──────────────────────────
          if (executedToolCalls.length > 0) {
            const assistantToolMessage = {
              role: "assistant" as const,
              content: fullContent || null,
              tool_calls: toolCallsArray.map((tc) => ({
                id: tc.id,
                type: "function" as const,
                function: { name: tc.name, arguments: tc.arguments },
              })),
            };

            const followUpMessages = [
              systemMessage,
              ...messages.map((m) => ({
                role: m.role as "user" | "assistant",
                content: m.content,
              })),
              assistantToolMessage,
              ...executedToolCalls.map((tc) => ({
                role: "tool" as const,
                tool_call_id: tc.id,
                content: JSON.stringify(tc.result ?? tc.error ?? tc),
              })),
            ];

            const followUp = await client.chat.completions.create({
              model: AI_MODEL,
              messages: followUpMessages,
              temperature: AI_DEFAULTS.temperature,
              top_p: AI_DEFAULTS.top_p,
              max_tokens: AI_DEFAULTS.max_tokens,
              tools: toolDefinitions,
              ...AI_STREAM_USAGE_OPTIONS,
            });

            let followUpContent = "";
            for await (const chunk of followUp) {
              if (chunk.usage) {
                tokenUsage = addTokenUsage(tokenUsage, extractTokenUsage(chunk));
              }
              const delta = chunk.choices[0]?.delta;
              if (delta?.content) {
                followUpContent += delta.content;
                await sendEvent({ type: "text", delta: delta.content });
              }
            }
            fullContent = followUpContent || fullContent;
          }
        }

        // ── Save assistant message ─────────────────────────────
        let savedMessage;
        try {
          savedMessage = await prisma.ai_messages.create({
            data: {
              thread_id: activeThreadId,
              role: "assistant",
              content: fullContent,
              tool_calls:
                executedToolCalls.length > 0
                  ? JSON.parse(JSON.stringify(executedToolCalls))
                  : null,
            },
          });
        } catch (dbError) {
          if (
            dbError instanceof Prisma.PrismaClientKnownRequestError &&
            dbError.code === "P2021"
          ) {
            await sendEvent({
              type: "error",
              error: "AI database tables not yet created.",
            });
            await writer.close();
            return;
          }
          throw dbError;
        }

        // ── Record trace ───────────────────────────────────────
        await recordAiTrace({
          traceId,
          tenantId: pharmacyId,
          feature: scope === "pharmacy" ? "ai_chat" : "ai_admin_chat",
          model: AI_MODEL,
          inputTokens: tokenUsage.inputTokens,
          outputTokens: tokenUsage.outputTokens,
          latencyMs: Date.now() - startTime,
          success: true,
          fallback: false,
          timestamp: new Date().toISOString(),
        });

        // ── Done event ─────────────────────────────────────────
        await sendEvent({
          type: "done",
          threadId: activeThreadId,
          messageId: savedMessage.id,
          content: fullContent,
          toolCalls:
            executedToolCalls.length > 0 ? executedToolCalls : null,
        });
      } catch (error) {
        console.error("[AI Chat] Stream error:", error);
        await sendEvent({ type: "error", error: "Stream failed" });
      } finally {
        await writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    console.error("AI chat error:", error);

    await recordAiTrace({
      traceId: createTraceId(),
      tenantId: null,
      feature: "ai_chat",
      model: AI_MODEL,
      inputTokens: 0,
      outputTokens: 0,
      latencyMs,
      success: false,
      fallback: false,
      error: String(error),
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
