import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider");
  const baseUrl = searchParams.get("baseUrl") || "http://localhost:11434";
  const apiKey = searchParams.get("apiKey");

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
        // If no API key, return predefined models
        if (!apiKey) {
          return NextResponse.json({
            models: [
              { id: "gpt-4o-mini", name: "GPT-4o Mini", isFreeTier: true, description: "Fast and affordable" },
              { id: "gpt-4o", name: "GPT-4o", isFreeTier: false, description: "Most capable multimodal" },
              { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", isFreeTier: false, description: "Fast and cost-effective" },
              { id: "gpt-4-turbo", name: "GPT-4 Turbo", isFreeTier: false, description: "Legacy GPT-4" },
              { id: "gpt-4", name: "GPT-4", isFreeTier: false, description: "Original GPT-4" },
            ]
          });
        }

        // Fetch actual models from OpenAI API
        const response = await fetch("https://api.openai.com/v1/models", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`);
        }

        const data = await response.json();

        // Filter for GPT models and transform to our format
        const gptModels = data.data
          ?.filter((model: { id: string }) => {
            const id = model.id.toLowerCase();
            // Include GPT models, exclude embeddings, audio, etc.
            return id.startsWith("gpt-") &&
                   !id.includes("embedding") &&
                   !id.includes("tts") &&
                   !id.includes("whisper") &&
                   !id.includes("dall-e") &&
                   !id.includes("davinci");
          })
          .map((model: { id: string; owned_by?: string }) => {
            const id = model.id;
            // Determine if free tier based on model
            const isFreeTier = id.includes("mini") || id.includes("3.5");

            // Generate description based on model name
            let description = "GPT model";
            if (id.includes("4o")) {
              description = id === "gpt-4o-mini" ? "Fast and affordable" : "Most capable multimodal";
            } else if (id.includes("3.5")) {
              description = "Fast and cost-effective";
            } else if (id.includes("4-turbo")) {
              description = "GPT-4 Turbo";
            } else if (id.startsWith("gpt-4")) {
              description = "Powerful GPT-4 model";
            }

            return {
              id: id,
              name: id,
              isFreeTier,
              description,
            };
          })
          .sort((a: { isFreeTier: boolean }, b: { isFreeTier: boolean }) => {
            // Sort free tier first
            if (a.isFreeTier && !b.isFreeTier) return -1;
            if (!a.isFreeTier && b.isFreeTier) return 1;
            return 0;
          }) || [];

        // If no GPT models found or error, return defaults
        if (gptModels.length === 0) {
          return NextResponse.json({
            models: [
              { id: "gpt-4o-mini", name: "GPT-4o Mini", isFreeTier: true, description: "Fast and affordable" },
              { id: "gpt-4o", name: "GPT-4o", isFreeTier: false, description: "Most capable multimodal" },
              { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", isFreeTier: false, description: "Fast and cost-effective" },
            ]
          });
        }

        return NextResponse.json({ models: gptModels });
      }

      case "gemini": {
        // If no API key, return predefined models
        if (!apiKey) {
          return NextResponse.json({
            models: [
              { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", isFreeTier: true, description: "Fast and efficient" },
              { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", isFreeTier: false, description: "Most capable Gemini" },
              { id: "gemini-pro", name: "Gemini Pro", isFreeTier: false, description: "Balanced performance" },
            ]
          });
        }

        // Fetch actual models from Gemini API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `Gemini API error: ${response.status}`);
        }

        const data = await response.json();

        // Filter for Gemini models
        const geminiModels = data.models
          ?.filter((model: { name: string }) => {
            const name = model.name.toLowerCase();
            // Include gemini models, exclude embeddings and other types
            return name.includes("gemini") &&
                   !name.includes("embedding") &&
                   !name.includes("aqa");
          })
          .map((model: { name: string; displayName?: string; description?: string }) => {
            const name = model.name.split("/").pop() || model.name; // Remove "models/" prefix
            const isFreeTier = name.includes("flash") || name.includes("-pro") === false;

            return {
              id: name,
              name: model.displayName || name,
              isFreeTier,
              description: model.description || "Google Gemini model",
            };
          })
          .sort((a: { isFreeTier: boolean }, b: { isFreeTier: boolean }) => {
            // Sort free tier first
            if (a.isFreeTier && !b.isFreeTier) return -1;
            if (!a.isFreeTier && b.isFreeTier) return 1;
            return 0;
          }) || [];

        // If no models found, return defaults
        if (geminiModels.length === 0) {
          return NextResponse.json({
            models: [
              { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", isFreeTier: true, description: "Fast and efficient" },
              { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", isFreeTier: false, description: "Most capable Gemini" },
            ]
          });
        }

        return NextResponse.json({ models: geminiModels });
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
