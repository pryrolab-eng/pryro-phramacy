import OpenAI from "openai";
import { zodToJsonSchema } from "zod-to-json-schema";
import { z } from "zod";

async function run() {
  const apiKey = process.env.NVIDIA_API_KEY;
  const baseURL = process.env.NVIDIA_BASE_URL ?? "https://integrate.api.nvidia.com/v1";

  const client = new OpenAI({ apiKey, baseURL });

  const listPharmaciesParams = z.object({
    status: z.string().optional().describe("Filter by status (active, inactive, suspended)"),
    limit: z.number().optional().describe("Maximum number of results (default 20)"),
  });

  const toolDefinitions = [
    {
      type: "function" as const,
      function: {
        name: "list_all_pharmacies",
        description: "List all pharmacies on the platform with optional status filter.",
        parameters: {
          type: "object" as const,
          properties: (zodToJsonSchema(listPharmaciesParams) as any).properties ?? {},
          required: (zodToJsonSchema(listPharmaciesParams) as any).required ?? [],
        },
      },
    }
  ];

  const systemMsg = "You are Pryrox AI, a platform administration assistant. Help users by using tools.";
  const userMsg = "yes give more details";
  const assistantMsg = {
    role: "assistant",
    content: null,
    tool_calls: [
      {
        id: "call-12345",
        type: "function",
        function: { name: "list_all_pharmacies", arguments: "{}" }
      }
    ]
  };
  const toolMsg = {
    role: "tool",
    tool_call_id: "call-12345",
    content: JSON.stringify({ success: true, data: [{ name: "Pharmacy A" }] })
  };

  const followUp = await client.chat.completions.create({
    model: process.env.NVIDIA_MODEL ?? "nvidia/nemotron-3-ultra-550b-a55b",
    messages: [
      { role: "system", content: systemMsg },
      { role: "user", content: "how many active pharmacy?" },
      { role: "assistant", content: "There are 2 active pharmacies. Would you like more details?" },
      { role: "user", content: userMsg },
      assistantMsg as any,
      toolMsg as any
    ],
    tools: toolDefinitions,
  });

  console.log("Follow up response WITHOUT reasoning_content:", followUp.choices[0].message.content);
}

run().catch(console.error);
