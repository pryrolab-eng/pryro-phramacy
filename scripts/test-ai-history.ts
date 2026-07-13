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

  const followUpMessages = [
    { role: "system", content: "You are Pryrox AI..." },
    { role: "assistant", content: "Hi! I'm Pryrox AI..." },
    { role: "user", content: "how many active pharmacy?" },
    { role: "assistant", content: "**Active Pharmacies: 2**..." },
    { role: "user", content: "yes give more details" },
    {
      role: "assistant",
      content: null,
      tool_calls: [
        {
          id: "call-123",
          type: "function",
          function: { name: "list_all_pharmacies", arguments: "{}" }
        }
      ]
    },
    {
      role: "tool",
      tool_call_id: "call-123",
      content: JSON.stringify({
        success: true,
        data: [
          { name: "Pharmacy 1", status: "active" },
          { name: "Pharmacy 2", status: "active" }
        ]
      })
    }
  ];

  try {
    const followUp = await client.chat.completions.create({
      model: process.env.NVIDIA_MODEL ?? "nvidia/nemotron-3-ultra-550b-a55b",
      messages: followUpMessages as any,
      tools: toolDefinitions,
    });
    console.log("Follow up content:", followUp.choices[0]?.message?.content);
  } catch (err) {
    console.error("Error calling AI:", err);
  }
}

run().catch(console.error);
