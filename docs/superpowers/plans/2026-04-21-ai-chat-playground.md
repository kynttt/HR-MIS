# AI Chat Playground Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a ChatGPT-style playground page at `/ai-playground` for testing the configured AI provider with streaming responses.

**Architecture:** A new protected page with a chat UI component. A new API route proxies chat completions to the configured provider (OpenAI, Gemini, or Ollama) with streaming. The sidebar is updated to include navigation to the playground.

**Tech Stack:** Next.js App Router, React Server Components/Client Components, native `fetch` with `ReadableStream`, existing shadcn UI components.

---

## Task 1: Create chat completions API route

**Files:**
- Create: `src/app/api/ai/chat/route.ts`

- [ ] **Step 1: Create the POST handler**

```typescript
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
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages,
            stream: true,
          }),
        });
        return new Response(response.body, {
          headers: { "Content-Type": "text/event-stream" },
        });
      }
      case "gemini": {
        // Gemini uses a different streaming format
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: messages.map((m: { role: string; content: string }) => ({
                role: m.role === "user" ? "user" : "model",
                parts: [{ text: m.content }],
              })),
            }),
          }
        );
        return new Response(response.body, {
          headers: { "Content-Type": "text/event-stream" },
        });
      }
      case "ollama": {
        const response = await fetch(`${ollamaBaseUrl}/api/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            prompt: messages[messages.length - 1].content,
            stream: true,
          }),
        });
        return new Response(response.body, {
          headers: { "Content-Type": "application/json" },
        });
      }
      default:
        return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
    }
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/ai/chat/route.ts
git commit -m "feat(ai): add chat completions API route with streaming support"
```

## Task 2: Create chat playground UI component

**Files:**
- Create: `src/components/ai/chat-playground.tsx`

- [ ] **Step 1: Create the chat playground component**

Build a client component with:
- State: `messages` array, `input` string, `isLoading` boolean, `error` string|null
- UI: header with provider badge, message list (user right/assistant left), sticky input bar, send button, clear chat button
- Streaming: read `response.body` as `ReadableStream`, parse SSE chunks for OpenAI, JSON chunks for Ollama
- Empty state with suggested prompts

```typescript
"use client";

import { useState, useRef } from "react";
import { Send, Trash2, Bot, User, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { AIConfiguration } from "@/features/jobs/types";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatPlaygroundProps {
  config: AIConfiguration;
}

const SUGGESTED_PROMPTS = [
  "Explain quantum computing in simple terms",
  "Write a Python function to reverse a string",
  "What are the benefits of a university HR system?",
];

export function ChatPlayground({ config }: ChatPlaygroundProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    if (!config.isEnabled) {
      setError("AI is not enabled. Please configure it first.");
      return;
    }

    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          provider: config.provider,
          apiKey: config.apiKey,
          model: config.model,
          ollamaBaseUrl: config.ollamaBaseUrl,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to get response");
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const assistantMessage: Message = { role: "assistant", content: "" };
      setMessages((prev) => [...prev, assistantMessage]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        if (config.provider === "openai") {
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) {
                  assistantMessage.content += delta;
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { ...assistantMessage };
                    return updated;
                  });
                }
              } catch {
                // Ignore parse errors for partial chunks
              }
            }
          }
        } else if (config.provider === "gemini") {
          // Gemini streaming: JSON chunks
          const chunks = buffer.split("\n").filter(Boolean);
          buffer = "";
          for (const chunk of chunks) {
            try {
              const parsed = JSON.parse(chunk);
              const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                assistantMessage.content += text;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { ...assistantMessage };
                  return updated;
                });
              }
            } catch {
              buffer = chunk;
            }
          }
        } else if (config.provider === "ollama") {
          // Ollama streaming: JSON lines
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const parsed = JSON.parse(line);
              if (parsed.response) {
                assistantMessage.content += parsed.response;
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { ...assistantMessage };
                  return updated;
                });
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#e5edf5] pb-4">
        <div>
          <h2 className="text-lg font-semibold text-[#061b31]">AI Playground</h2>
          <p className="text-sm text-[#64748d]">
            Test your AI configuration with real prompts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="capitalize">
            {config.provider}
          </Badge>
          <Badge variant="muted">{config.model}</Badge>
          <Button variant="ghost" size="sm" onClick={clearChat}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center">
            <Bot className="mb-4 h-12 w-12 text-[#d6d9fc]" />
            <p className="mb-2 text-sm font-medium text-[#061b31]">
              Start a conversation
            </p>
            <p className="mb-6 text-xs text-[#64748d]">
              Send a message to test your AI configuration
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => {
                    setInput(prompt);
                  }}
                  className="rounded-full border border-[#e5edf5] bg-white px-3 py-1.5 text-xs text-[#64748d] transition-colors hover:border-[#533afd] hover:text-[#533afd]"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    message.role === "user"
                      ? "bg-[#533afd] text-white"
                      : "bg-[#f6f9fc] text-[#64748d]"
                  }`}
                >
                  {message.role === "user" ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                <Card
                  className={`max-w-[80%] px-4 py-3 ${
                    message.role === "user"
                      ? "border-[#533afd] bg-[#533afd] text-white"
                      : "border-[#e5edf5] bg-white text-[#061b31]"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                </Card>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f6f9fc] text-[#64748d]">
                  <Bot className="h-4 w-4" />
                </div>
                <Card className="border-[#e5edf5] bg-white px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#64748d]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#64748d] [animation-delay:0.2s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-[#64748d] [animation-delay:0.4s]" />
                  </div>
                </Card>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 border-t border-[#e5edf5] pt-4">
        <Input
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          className="flex-1"
        />
        <Button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ai/chat-playground.tsx
git commit -m "feat(ai): add chat playground component with streaming support"
```

## Task 3: Create playground page

**Files:**
- Create: `src/app/(protected)/ai-playground/page.tsx`

- [ ] **Step 1: Create the page**

```typescript
import { Bot, ShieldAlert } from "lucide-react";
import { ChatPlayground } from "@/components/ai/chat-playground";
import { Badge } from "@/components/ui/badge";
import type { AIConfiguration } from "@/features/jobs/types";

export default function AIPlaygroundPage() {
  // TODO: Load from database/storage
  const config: AIConfiguration = {
    provider: "openai",
    apiKey: "",
    model: "gpt-4o-mini",
    isEnabled: false,
  };

  if (!config.isEnabled) {
    return (
      <div className="flex h-[calc(100vh-8rem)] flex-col items-center justify-center">
        <Bot className="mb-4 h-16 w-16 text-[#d6d9fc]" />
        <h2 className="mb-2 text-xl font-semibold text-[#061b31]">
          AI Playground
        </h2>
        <p className="mb-6 max-w-md text-center text-sm text-[#64748d]">
          The AI playground lets you test your configured AI provider. Enable AI
          configuration first to get started.
        </p>
        <a
          href="/ai-config"
          className="rounded-md bg-[#533afd] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4338ca]"
        >
          Go to AI Configuration
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-xl border border-[#d6d9fc] bg-gradient-to-br from-white via-[#f8f9ff] to-[#eef2ff] p-5 shadow-[0_18px_45px_-34px_rgba(83,58,253,0.35)] lg:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="code-label text-[11px] uppercase tracking-[0.12em] text-[#64748d]">
              Testing &amp; Development
            </p>
            <h2 className="mt-1 flex items-center gap-2 text-2xl font-semibold tracking-tight text-[#061b31]">
              <Bot className="h-6 w-6 text-[#533afd]" />
              AI Playground
            </h2>
            <p className="mt-1 text-sm text-[#273951]">
              Test your AI provider configuration with real prompts.
            </p>
          </div>
          <Badge variant="warning" className="flex items-center gap-1">
            <ShieldAlert className="h-3 w-3" />
            Admin Only
          </Badge>
        </div>
      </section>

      <ChatPlayground config={config} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/\(protected\)/ai-playground/page.tsx
git commit -m "feat(ai): add AI playground page"
```

## Task 4: Add sidebar navigation

**Files:**
- Modify: `src/components/layout/app-shell.tsx`

- [ ] **Step 1: Add playground nav item**

Add `{ href: "/ai-playground", label: "AI Playground", icon: Bot }` to `privilegedItems` in `app-shell.tsx` (after `ai-config`).

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/app-shell.tsx
git commit -m "feat(ai): add AI playground to sidebar navigation"
```

## Task 5: Verify and typecheck

- [ ] **Step 1: Run typecheck**

```bash
npm run typecheck
```

Expected: Passes with no errors.

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: Passes with no errors.

- [ ] **Step 3: Final commit**

```bash
git commit -m "chore: verify chat playground implementation"
```
