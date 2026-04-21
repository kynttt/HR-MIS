"use client";

import { useState, useRef, useCallback } from "react";
import { Send, Trash2, Bot, User, AlertCircle, Sparkles, RefreshCw } from "lucide-react";
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
  const abortRef = useRef<AbortController | null>(null);
  // Use a ref to track the latest assistant content for streaming updates
  const assistantContentRef = useRef("");

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
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
    assistantContentRef.current = "";

    // Add empty assistant message placeholder
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
    scrollToBottom();

    abortRef.current = new AbortController();

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status}`;
        try {
          const data = await response.json();
          errorMessage = data.error || data.details || errorMessage;
        } catch {
          // Non-JSON error response
        }
        throw new Error(errorMessage);
      }

      if (!response.body) {
        throw new Error("No response body received from server");
      }

      const contentType = response.headers.get("content-type") || "";
      const isStreaming = contentType.includes("stream") || contentType.includes("ndjson");

      if (!isStreaming) {
        // Non-streaming fallback: read the full response as JSON
        const data = await response.json();
        const content = data.content || data.text || data.response || data.message || JSON.stringify(data);
        assistantContentRef.current = content;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content };
          return updated;
        });
        scrollToBottom();
        return;
      }

      // Streaming mode
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          // Flush any remaining buffer
          if (buffer.trim()) {
            processBuffer(buffer, true);
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        buffer = processBuffer(buffer, false);
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      console.error("[Chat] Error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");

      // Remove empty assistant message on error
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

  function processBuffer(buffer: string, isFinal: boolean): string {
    if (config.provider === "openai") {
      return processOpenAIBuffer(buffer, isFinal);
    } else if (config.provider === "gemini") {
      return processGeminiBuffer(buffer, isFinal);
    } else if (config.provider === "ollama") {
      return processOllamaBuffer(buffer, isFinal);
    }
    return buffer;
  }

  function processOpenAIBuffer(buffer: string, isFinal: boolean): string {
    const lines = buffer.split("\n");
    // Keep the last line if it's incomplete (no trailing newline)
    const keep = isFinal ? "" : (lines.pop() || "");

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || !line.startsWith("data: ")) continue;

      const data = line.slice(6).trim();
      if (data === "[DONE]") continue;

      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (typeof delta === "string") {
          appendAssistantContent(delta);
        }
      } catch (e) {
        console.warn("[Chat] Failed to parse SSE chunk:", data.substring(0, 100), e);
      }
    }

    return keep;
  }

  function processGeminiBuffer(buffer: string, isFinal: boolean): string {
    const chunks = buffer.split("\n").filter((l) => l.trim());
    const incomplete: string[] = [];

    for (const chunk of chunks) {
      try {
        const parsed = JSON.parse(chunk);
        const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
        if (typeof text === "string") {
          appendAssistantContent(text);
        }
      } catch {
        incomplete.push(chunk);
      }
    }

    return incomplete.join("\n");
  }

  function processOllamaBuffer(buffer: string, isFinal: boolean): string {
    const lines = buffer.split("\n");
    const keep = isFinal ? "" : (lines.pop() || "");

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line);
        if (typeof parsed.response === "string") {
          appendAssistantContent(parsed.response);
        }
      } catch (e) {
        console.warn("[Chat] Failed to parse Ollama chunk:", line.substring(0, 100), e);
      }
    }

    return keep;
  }

  function appendAssistantContent(delta: string) {
    assistantContentRef.current += delta;
    const currentContent = assistantContentRef.current;
    setMessages((prev) => {
      const updated = [...prev];
      updated[updated.length - 1] = { role: "assistant", content: currentContent };
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
    assistantContentRef.current = "";
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  };

  const retryLastMessage = () => {
    if (messages.length === 0) return;
    // Remove the last assistant message if it's empty
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role === "assistant" && last.content === "") {
        return prev.slice(0, -1);
      }
      return prev;
    });
    setError(null);
    // Put the last user message back in the input
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
