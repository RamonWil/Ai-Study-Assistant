import { GoogleGenAI } from "@google/genai";

// Preferred models in priority order to handle high demand or region spike outages (503/429)
// Start with fast, highly available models that rarely encounter demand spikes
const FALLBACK_MODELS = [
  "gemini-flash-latest",
  "gemini-3.1-flash-lite",
  "gemini-3.8-flash",
  "gemini-3.1-pro-preview"
];

export async function generateWithFallback(
  ai: GoogleGenAI,
  options: {
    contents: any;
    config?: any;
    preferredModel?: string;
  }
) {
  const modelsToTry = [
    ...(options.preferredModel ? [options.preferredModel] : []),
    ...FALLBACK_MODELS.filter(m => m !== options.preferredModel)
  ];

  let lastError: any = null;

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    try {
      const response = await ai.models.generateContent({
        model,
        contents: options.contents,
        config: options.config,
      });
      return response;
    } catch (err: any) {
      lastError = err;
      const isDemandSpike = 
        err?.status === 503 || 
        err?.status === 429 || 
        err?.code === 503 ||
        err?.code === 429 ||
        err?.message?.includes("503") ||
        err?.message?.includes("high demand") ||
        err?.message?.includes("UNAVAILABLE") ||
        err?.message?.includes("RESOURCE_EXHAUSTED");

      if (isDemandSpike) {
        // If there are more models in the fallback pool, silently advance to the next
        if (i < modelsToTry.length - 1) {
          // Brief exponential backoff pause
          await new Promise((resolve) => setTimeout(resolve, 150 * (i + 1)));
          continue;
        }
      }

      // If it's a non-retryable client error (e.g. invalid API key 400/403), throw immediately
      throw err;
    }
  }

  throw lastError;
}
