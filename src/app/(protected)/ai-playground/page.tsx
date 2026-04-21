import { Bot, ShieldAlert } from "lucide-react";

import { ChatPlayground } from "@/components/ai/chat-playground";
import { Badge } from "@/components/ui/badge";
import { getAIConfiguration } from "@/features/ai/service";

export default async function AIPlaygroundPage() {
  const config = await getAIConfiguration();

  if (!config) {
    return (
      <div className="flex h-[calc(100vh-12rem)] flex-col items-center justify-center">
        <Bot className="mb-4 h-16 w-16 text-[#e5edf5]" />
        <h2 className="mb-2 text-xl font-semibold text-[#061b31]">
          AI Playground
        </h2>
        <p className="mb-6 max-w-md text-center text-sm text-[#64748d]">
          No AI configuration found. Set up your AI provider first to start testing.
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
          <div className="flex items-center gap-2">
            {!config.isEnabled && (
              <Badge variant="warning" className="text-xs">
                AI Ranking Disabled
              </Badge>
            )}
            <Badge variant="warning" className="flex items-center gap-1">
              <ShieldAlert className="h-3 w-3" />
              Admin Only
            </Badge>
          </div>
        </div>
      </section>

      <ChatPlayground config={config} />
    </div>
  );
}
