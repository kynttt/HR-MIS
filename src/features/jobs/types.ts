export interface RankedApplicant {
  id: string;
  applicantId: string;
  name: string;
  email: string;
  aiScore: number;
  status: "submitted" | "under_review" | "shortlisted" | "interview_scheduled" | "interviewed" | "for_requirements" | "accepted" | "rejected" | "withdrawn";
  appliedAt: string;
  highlights: string[];
  resumeUrl?: string;
}

export type AIProvider = "openai" | "gemini" | "ollama";

export interface AIModel {
  id: string;
  name: string;
  isFreeTier: boolean;
  description?: string;
}

export const OPENAI_MODELS: AIModel[] = [
  { id: "gpt-4o-mini", name: "GPT-4o Mini", isFreeTier: true, description: "Fast and affordable for simple tasks" },
  { id: "gpt-4o", name: "GPT-4o", isFreeTier: false, description: "Most capable multimodal model" },
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", isFreeTier: false, description: "Fast and cost-effective" }
];

export const GEMINI_MODELS: AIModel[] = [
  { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", isFreeTier: true, description: "Fast and efficient for high volume" },
  { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", isFreeTier: false, description: "Most capable Gemini model" },
  { id: "gemini-pro", name: "Gemini Pro", isFreeTier: false, description: "Balanced performance" }
];

export const OLLAMA_MODELS: AIModel[] = [
  { id: "llama3.2", name: "Llama 3.2", isFreeTier: true, description: "Meta's latest open model" },
  { id: "mistral", name: "Mistral", isFreeTier: true, description: "High performance open model" },
  { id: "phi3", name: "Phi-3", isFreeTier: true, description: "Microsoft's compact model" },
  { id: "gemma2", name: "Gemma 2", isFreeTier: true, description: "Google's open model" }
];

export interface AIConfiguration {
  provider: AIProvider;
  apiKey?: string;
  model: string;
  isEnabled: boolean;
  ollamaBaseUrl?: string;
}
