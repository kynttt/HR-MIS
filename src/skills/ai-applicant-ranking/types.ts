export interface RankResult {
  applicationId: string;
  score: number;
  highlights: string[];
  rationale: string;
  provider: string;
  model: string;
}

export interface RankOptions {
  forceRecompute?: boolean;
}

export interface AICompletionParams {
  provider: "openai" | "gemini" | "ollama";
  apiKey?: string;
  model: string;
  baseUrl?: string;
  prompt: string;
}

export interface AICompletionResponse {
  text: string;
  tokensUsed?: number;
}
