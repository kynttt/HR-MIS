import { NextRequest, NextResponse } from "next/server";
import { getAIConfiguration } from "@/features/ai/service";

/**
 * Creates a TransformStream that reads NDJSON and converts each chunk to SSE.
 */
function createTextExtractorTransform(
  extractText: (parsed: unknown) => string | null
): TransformStream<Uint8Array, Uint8Array> {
  let buffer = "";

  return new TransformStream({
    transform(chunk, controller) {
      buffer += new TextDecoder().decode(chunk, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        try {
          const parsed = JSON.parse(trimmed);
          const text = extractText(parsed);
          if (text) {
            const sse = `data: ${JSON.stringify({ delta: text })}\n\n`;
            controller.enqueue(new TextEncoder().encode(sse));
          }
        } catch {
          // Skip malformed lines
        }
      }
    },
    flush(controller) {
      if (buffer.trim()) {
        try {
          const parsed = JSON.parse(buffer.trim());
          const text = extractText(parsed);
          if (text) {
            const sse = `data: ${JSON.stringify({ delta: text })}\n\n`;
            controller.enqueue(new TextEncoder().encode(sse));
          }
        } catch {
          // Skip malformed final buffer
        }
      }
      controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
    },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { messages } = body;

  console.log("[Chat API] Received request with messages:", messages.length);

  try {
    const config = await getAIConfiguration();

    if (!config) {
      return NextResponse.json(
        { error: "AI configuration not found" },
        { status: 400 }
      );
    }

    if (!config.apiKey && config.provider !== "ollama") {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 400 }
      );
    }

    // Filter out empty assistant messages before sending to provider
    const cleanMessages = messages.filter(
      (m: { role: string; content: string }) =>
        m.role !== "assistant" || m.content.trim().length > 0
    );

    console.log("[Chat API] Provider:", config.provider, "Model:", config.model);
    console.log("[Chat API] Clean messages count:", cleanMessages.length);

    switch (config.provider) {
      case "openai": {
        const response = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${config.apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: config.model,
              messages: cleanMessages,
              stream: true,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          return NextResponse.json(
            {
              error:
                errorData.error?.message ||
                `OpenAI API error: ${response.status}`,
            },
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
        const geminiMessages = cleanMessages.map(
          (m: { role: string; content: string }) => ({
            role: m.role === "user" ? "user" : "model",
            parts: [{ text: m.content }],
          })
        );

        console.log("[Chat API] Calling Gemini streamGenerateContent...");

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:streamGenerateContent?key=${config.apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: geminiMessages }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("[Chat API] Gemini error:", errorData);
          return NextResponse.json(
            {
              error:
                errorData.error?.message ||
                `Gemini API error: ${response.status}`,
            },
            { status: response.status }
          );
        }

        if (!response.body) {
          return NextResponse.json(
            { error: "No response body" },
            { status: 500 }
          );
        }

        // Transform Gemini NDJSON into SSE
        const transform = createTextExtractorTransform((parsed) => {
          const obj = parsed as {
            candidates?: Array<{
              content?: { parts?: Array<{ text?: string }> };
            }>;
          };
          const text = obj.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
          if (text) {
            console.log("[Chat API] Gemini extracted text:", text.substring(0, 50));
          }
          return text;
        });

        return new Response(response.body.pipeThrough(transform), {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      }

      case "ollama": {
        const prompt = cleanMessages
          .map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
          .join("\n");

        const response = await fetch(
          `${config.ollamaBaseUrl || "http://localhost:11434"}/api/generate`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: config.model,
              prompt,
              stream: true,
            }),
          }
        );

        if (!response.ok) {
          return NextResponse.json(
            { error: `Ollama error: ${response.status}` },
            { status: response.status }
          );
        }

        if (!response.body) {
          return NextResponse.json(
            { error: "No response body" },
            { status: 500 }
          );
        }

        const transform = createTextExtractorTransform((parsed) => {
          const obj = parsed as { response?: string };
          return obj.response ?? null;
        });

        return new Response(response.body.pipeThrough(transform), {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      }

      default:
        return NextResponse.json(
          { error: "Unknown provider" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[Chat API] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to process chat request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
