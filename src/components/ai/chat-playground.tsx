"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Send, Trash2, Bot, User, AlertCircle, Sparkles, RefreshCw, Bug } from "lucide-react";
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
  const [mounted, setMounted] = useState(false);
  const [debug, setDebug] = useState(false);
  const [rawChunks, setRawChunks] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const assistantContentRef = useRef("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const trimmedInput = input.trim();
    const userMessage: Message = { role: "user", content: trimmedInput };
    const newMessages = [...messages, userMessage];

    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    setError(null);
    setRawChunks([]);
    assistantContentRef.current = "";

    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
    scrollToBottom();

    abortRef.current = new AbortController();

    try {
      console.log("[Chat] Sending request...");
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
        signal: abortRef.current.signal,
      });

      console.log("[Chat] Response status:", response.status);
      console.log("[Chat] Content-Type:", response.headers.get("content-type"));

      if (!response.ok) {
        const text = await response.text();
        console.error("[Chat] Error response:", text);
        let errorMessage = `Server error: ${response.status}`;
        try {
          const data = JSON.parse(text);
          errorMessage = data.error || data.details || errorMessage;
        } catch {
          errorMessage = text || errorMessage;
        }
        throw new Error(errorMessage);
      }

      if (!response.body) {
        throw new Error("No response body received from server");
      }

      // Stream the response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          // Flush remaining buffer
          if (buffer.trim()) {
            const content = parseStreamChunk(buffer);
            if (content) {
              appendAssistantContent(content);
            }
          }
          console.log("[Chat] Stream done. Final content:", assistantContentRef.current);
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        if (debug) {
          setRawChunks((prev) => [...prev.slice(-20), chunk.replace(/\n/g, "\\n").substring(0, 200)]);
        }

        // Try to extract complete SSE lines
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          const content = parseStreamChunk(trimmed);
          if (content) {
            appendAssistantContent(content);
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        console.log("[Chat] Aborted by user");
        return;
      }
      console.error("[Chat] Error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");

      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.content === "") {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      setIsLoading(false);
      abortRef.current = null;
      scrollToBottom();
    }
  };

  /**
   * Parse a unified SSE line from the API.
   * Format: data: {"delta": "text content"}
   * All providers (OpenAI, Gemini, Ollama) are normalized to this format.
   */
  function parseStreamChunk(line: string): string | null {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data: ")) return null;

    const data = trimmed.slice(6).trim();
    if (data === "[DONE]") return null;

    try {
      const parsed = JSON.parse(data);
      if (typeof parsed.delta === "string") {
        return parsed.delta;
      }
    } catch {
      // Not valid JSON — might be a plain text SSE line
      console.warn("[Chat] Failed to parse SSE data:", data.substring(0, 100));
    }
    return null;
  }

  function appendAssistantContent(delta: string) {
    assistantContentRef.current += delta;
    const content = assistantContentRef.current;
    setMessages((prev) => {
      const updated = [...prev];
      updated[updated.length - 1] = { role: "assistant", content };
      return updated;
    });
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
    setRawChunks([]);
    assistantContentRef.current = "";
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  };

  const retryLastMessage = () => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role === "assistant") {
        return prev.slice(0, -1);
      }
      return prev;
    });
    setError(null);
    const lastUserMsg = messages.filter((m) => m.role === "user").pop();
    if (lastUserMsg) {
      setInput(lastUserMsg.content);
    }
  };

  return (
    <div className="flex h-[calc(100vh-16rem)] flex-col rounded-xl border border-[#e5edf5] bg-white shadow-[0_15px_32px_-34px_rgba(6,27,49,0.55)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#e5edf5] px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f4f6ff] text-[#533afd]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#061b31]">AI Playground</h3>
            <p className="text-xs text-[#64748d]">Test your AI configuration</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="capitalize text-xs">
            {config.provider}
          </Badge>
          <Badge variant="muted" className="text-xs">
            {config.model}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDebug((d) => !d)}
            className="text-[#64748d] hover:text-[#061b31]"
            title="Toggle debug"
          >
            <Bug className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearChat}
            className="text-[#64748d] hover:text-[#061b31]"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center">
            <Bot className="mb-4 h-14 w-14 text-[#e5edf5]" />
            <p className="mb-2 text-sm font-medium text-[#061b31]">
              Start a conversation
            </p>
            <p className="mb-6 text-xs text-[#64748d]">
              Send a message to test your AI configuration
            </p>
            {mounted && (
              <div className="flex max-w-md flex-wrap justify-center gap-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <div
                    key={prompt}
                    role="button"
                    tabIndex={0}
                    onClick={() => setInput(prompt)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setInput(prompt);
                      }
                    }}
                    className="cursor-pointer rounded-full border border-[#e5edf5] bg-[#f6f9fc] px-3 py-1.5 text-xs text-[#64748d] transition-colors hover:border-[#533afd] hover:text-[#533afd]"
                  >
                    {prompt}
                  </div>
                ))}
              </div>
            )}
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
                  className={`max-w-[80%] px-4 py-3 shadow-none ${
                    message.role === "user"
                      ? "border-[#533afd] bg-[#533afd] text-white"
                      : "border-[#e5edf5] bg-[#f6f9fc] text-[#061b31]"
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content || (message.role === "assistant" && isLoading ? (
                      <span className="inline-flex gap-1">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#64748d]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#64748d] [animation-delay:0.2s]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#64748d] [animation-delay:0.4s]" />
                      </span>
                    ) : null)}
                  </p>
                </Card>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
        )}
      </div>

      {/* Debug Panel */}
      {debug && rawChunks.length > 0 && (
        <div className="mx-5 mb-3 max-h-32 overflow-auto rounded border border-amber-200 bg-amber-50 p-2">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-amber-700">
            Debug — Raw Chunks
          </p>
          {rawChunks.map((chunk, i) => (
            <pre key={i} className="mb-1 text-[10px] text-amber-800 break-all">
              {chunk}
            </pre>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mx-5 mb-3 space-y-2">
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="flex-1">{error}</span>
          </div>
          <button
            onClick={retryLastMessage}
            className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800"
          >
            <RefreshCw className="h-3 w-3" />
            Retry last message
          </button>
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 border-t border-[#e5edf5] px-5 py-4">
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
