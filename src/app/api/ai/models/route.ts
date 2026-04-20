import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider");
  const baseUrl = searchParams.get("baseUrl") || "http://localhost:11434";

  try {
    switch (provider) {
      case "ollama": {
        // Fetch models from local Ollama instance
        const response = await fetch(`${baseUrl}/api/tags`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Ollama responded with status: ${response.status}`);
        }

        const data = await response.json();

        // Transform Ollama response to our model format
        const models = data.models?.map((model: { name: string; size?: number; modified_at?: string }) => ({
          id: model.name,
          name: model.name,
          isFreeTier: true, // Local models are always free
          description: model.size ? `Size: ${(model.size / 1024 / 1024 / 1024).toFixed(2)} GB` : "Local model",
        })) || [];

        return NextResponse.json({ models });
      }

      case "openai": {
        // For OpenAI, we'd typically fetch from their API
        // This requires an API key and proper error handling
        // For now, return the predefined list
        return NextResponse.json({
          models: [
            { id: "gpt-4o-mini", name: "GPT-4o Mini", isFreeTier: true },
            { id: "gpt-4o", name: "GPT-4o", isFreeTier: false },
            { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", isFreeTier: false },
          ]
        });
      }

      case "gemini": {
        // For Gemini, return predefined list
        // In production, you'd fetch from Gemini API
        return NextResponse.json({
          models: [
            { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", isFreeTier: true },
            { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", isFreeTier: false },
            { id: "gemini-pro", name: "Gemini Pro", isFreeTier: false },
          ]
        });
      }

      default:
        return NextResponse.json(
          { error: "Unknown provider" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error(`Failed to fetch ${provider} models:`, error);
    return NextResponse.json(
      {
        error: `Failed to fetch models from ${provider}`,
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
