import { Sparkles, ShieldAlert } from "lucide-react";

import { AIConfigForm } from "@/components/ai/ai-config-form";
import { Badge } from "@/components/ui/badge";
import type { AIConfiguration } from "@/features/jobs/types";

export default function AIConfigPage() {
  // TODO: Load from database/storage
  const savedConfig: AIConfiguration | undefined = undefined;

  const handleSave = async (config: AIConfiguration) => {
    "use server";
    // TODO: Save to database
    console.log("AI Configuration saved:", config);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-xl border border-[#d6d9fc] bg-gradient-to-br from-white via-[#f8f9ff] to-[#eef2ff] p-5 shadow-[0_18px_45px_-34px_rgba(83,58,253,0.35)] lg:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="code-label text-[11px] uppercase tracking-[0.12em] text-[#64748d]">
              System Configuration
            </p>
            <h2 className="mt-1 flex items-center gap-2 text-2xl font-semibold tracking-tight text-[#061b31]">
              <Sparkles className="h-6 w-6 text-[#533afd]" />
              AI Configuration
            </h2>
            <p className="mt-1 text-sm text-[#273951]">
              Configure AI providers for applicant ranking and matching.
            </p>
          </div>
          <Badge
            variant="warning"
            className="flex items-center gap-1"
          >
            <ShieldAlert className="h-3 w-3" />
            Admin Only
          </Badge>
        </div>
      </section>

      {/* Configuration Form */}
      <AIConfigForm initialConfig={savedConfig} onSave={handleSave} />
    </div>
  );
}
