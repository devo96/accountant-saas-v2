type ModelPricing = {
  inputPer1M: number;
  outputPer1M: number;
};

const MODEL_PRICING: Record<string, ModelPricing> = {
  "gpt-4o-mini": { inputPer1M: 0.15, outputPer1M: 0.60 },
  "gpt-4o": { inputPer1M: 2.50, outputPer1M: 10.00 },
  "gpt-4": { inputPer1M: 30.00, outputPer1M: 60.00 },
  "claude-3-5-sonnet": { inputPer1M: 3.00, outputPer1M: 15.00 },
  "deepseek-v3": { inputPer1M: 0.27, outputPer1M: 1.10 },
};

export function getPricing(model: string): ModelPricing {
  return MODEL_PRICING[model] ?? MODEL_PRICING["gpt-4o-mini"];
}

export function calculateCost(model: string, promptTokens: number, completionTokens: number): number {
  const pricing = getPricing(model);
  const inputCost = (promptTokens / 1_000_000) * pricing.inputPer1M;
  const outputCost = (completionTokens / 1_000_000) * pricing.outputPer1M;
  return Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000;
}

export function detectOperationType(messages: { role: string; content: any }[]): string {
  for (const msg of messages) {
    if (msg.role !== "user") continue;
    if (Array.isArray(msg.content)) {
      for (const part of msg.content) {
        if (part.type === "image") return "image_processing";
      }
    }
  }
  return "text_query";
}
