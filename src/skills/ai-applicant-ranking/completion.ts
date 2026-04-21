import type { AICompletionParams, AICompletionResponse } from "./types";

export async function callAICompletion(params: AICompletionParams): Promise<AICompletionResponse> {
  switch (params.provider) {
    case "openai":
      return callOpenAI(params);
    case "gemini":
      return callGemini(params);
    case "ollama":
      return callOllama(params);
    default:
      throw new Error(`Unknown provider: ${params.provider}`);
  }
}

async function callOpenAI(params: AICompletionParams): Promise<AICompletionResponse> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: params.model,
      messages: [{ role: "user", content: params.prompt }],
      stream: false,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `OpenAI error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content ?? "";
  const tokensUsed = data.usage?.total_tokens;
  return { text, tokensUsed };
}

async function callGemini(params: AICompletionParams): Promise<AICompletionResponse> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${params.model}:generateContent?key=${params.apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: params.prompt }] }],
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Gemini error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const tokensUsed = data.usageMetadata?.totalTokenCount;
  return { text, tokensUsed };
}

async function callOllama(params: AICompletionParams): Promise<AICompletionResponse> {
  const response = await fetch(`${params.baseUrl || "http://localhost:11434"}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: params.model,
      prompt: params.prompt,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status}`);
  }

  const data = await response.json();
  const text = typeof data.response === "string" ? data.response : "";
  return { text };
}
