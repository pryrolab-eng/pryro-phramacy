import OpenAI from "openai";

let client: OpenAI | null = null;

export function getAiClient(): OpenAI | null {
  const apiKey = process.env.NVIDIA_API_KEY;
  const baseURL = process.env.NVIDIA_BASE_URL ?? "https://integrate.api.nvidia.com/v1";

  if (!apiKey) return null;

  if (!client) {
    client = new OpenAI({ apiKey, baseURL });
  }
  return client;
}

export const AI_MODEL = process.env.NVIDIA_MODEL ?? "nvidia/nemotron-3-ultra-550b-a55b";

export const AI_DEFAULTS = {
  temperature: 1,
  top_p: 0.95,
  max_tokens: 8192,
  reasoning_budget: 16384,
} as const;
