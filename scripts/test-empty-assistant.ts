import OpenAI from "openai";
import { zodToJsonSchema } from "zod-to-json-schema";
import { z } from "zod";

async function run() {
  const apiKey = process.env.NVIDIA_API_KEY;
  const baseURL = process.env.NVIDIA_BASE_URL ?? "https://integrate.api.nvidia.com/v1";

  const client = new OpenAI({ apiKey, baseURL });

  const followUpMessages = [
    { role: "system", content: "You are Pryrox AI..." },
    { role: "assistant", content: "" }, // EMPTY ASSISTANT MESSAGE
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
        ]
      })
    }
  ];

  try {
    const followUp = await client.chat.completions.create({
      model: process.env.NVIDIA_MODEL ?? "nvidia/nemotron-3-ultra-550b-a55b",
      messages: followUpMessages as any,
    });
    console.log("Follow up content:", followUp.choices[0]?.message?.content);
  } catch (err) {
    console.error("Error calling AI:", err);
  }
}

run().catch(console.error);
