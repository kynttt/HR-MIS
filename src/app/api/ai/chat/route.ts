import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { messages, provider, apiKey, model, ollamaBaseUrl } = body;

  try {
    switch (provider) {
      case "openai": {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages,
            stream: true,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          return NextResponse.json(
            { error: errorData.error?.message || `OpenAI API error: ${response.status}` },
            { status: response.status }
          );
        }

        return new Response(response.body, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      }

      case "gemini": {
        const geminiMessages = messages.map(
          (m: { role: string; content: string }) => ({
            role: m.role === "user" ? "user" : "model",
            parts: [{ text: m.content }],
          })
        );

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: geminiMessages }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          return NextResponse.json(
            { error: errorData.error?.message || `Gemini API error: ${response.status}` },
            { status: response.status }
          );
        }

        return new Response(response.body, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      }

      case "ollama": {
        // Ollama expects a single prompt, so we concatenate messages
        const prompt = messages
          .map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
          .join("\n");

        const response = await fetch(`${ollamaBaseUrl || "http://localhost:11434"}/api/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            prompt,
            stream: true,
          }),
        });

        if (!response.ok) {
          return NextResponse.json(
            { error: `Ollama error: ${response.status}` },
            { status: response.status }
          );
        }

        return new Response(response.body, {
          headers: {
            "Content-Type": "application/x-ndjson",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      }

      default:
        return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
    }
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        error: "Failed to process chat request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
