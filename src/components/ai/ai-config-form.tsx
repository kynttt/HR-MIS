"use client";

import { useState } from "react";
import { Save, Key, Server, Sparkles, Check, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type {
  AIProvider,
  AIModel,
  AIConfiguration,
} from "@/features/jobs/types";
import {
  OPENAI_MODELS,
  GEMINI_MODELS,
  OLLAMA_MODELS,
} from "@/features/jobs/types";

interface AIConfigFormProps {
  initialConfig?: AIConfiguration;
  onSave?: (config: AIConfiguration) => void;
}

const PROVIDER_INFO: Record<
  AIProvider,
  { name: string; icon: React.ReactNode; description: string; requiresApiKey: boolean }
> = {
  openai: {
    name: "OpenAI",
    icon: <Sparkles className="h-5 w-5" />,
    description: "Use OpenAI GPT models for AI-powered applicant ranking",
    requiresApiKey: true,
  },
  gemini: {
    name: "Google Gemini",
    icon: <Sparkles className="h-5 w-5" />,
    description: "Use Google Gemini models for AI-powered applicant ranking",
    requiresApiKey: true,
  },
  ollama: {
    name: "Ollama (Local)",
    icon: <Server className="h-5 w-5" />,
    description: "Run AI models locally using Ollama - no API key required",
    requiresApiKey: false,
  },
};

export function AIConfigForm({ initialConfig, onSave }: AIConfigFormProps) {
  const [config, setConfig] = useState<AIConfiguration>(
    initialConfig ?? {
      provider: "openai",
      apiKey: "",
      model: OPENAI_MODELS[0].id,
      isEnabled: false,
      ollamaBaseUrl: "http://localhost:11434",
    }
  );
  const [isSaved, setIsSaved] = useState(false);

  const getModelsForProvider = (provider: AIProvider): AIModel[] => {
    switch (provider) {
      case "openai":
        return OPENAI_MODELS;
      case "gemini":
        return GEMINI_MODELS;
      case "ollama":
        return OLLAMA_MODELS;
      default:
        return [];
    }
  };

  const handleProviderChange = (provider: AIProvider) => {
    const models = getModelsForProvider(provider);
    setConfig((prev) => ({
      ...prev,
      provider,
      model: models[0]?.id ?? "",
      apiKey: provider === "ollama" ? "" : prev.apiKey,
    }));
    setIsSaved(false);
  };

  const handleSave = () => {
    onSave?.(config);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const currentModels = getModelsForProvider(config.provider);
  const providerInfo = PROVIDER_INFO[config.provider];

  return (
    <div className="space-y-6">
      {/* Provider Selection Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {(Object.keys(PROVIDER_INFO) as AIProvider[]).map((provider) => {
          const info = PROVIDER_INFO[provider];
          const isSelected = config.provider === provider;

          return (
            <div
              key={provider}
              onClick={() => handleProviderChange(provider)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleProviderChange(provider);
                }
              }}
              className={`relative cursor-pointer rounded-xl border p-5 text-left transition-all ${
                isSelected
                  ? "border-[#533afd] bg-[#f4f6ff] shadow-[0_18px_38px_-30px_rgba(83,58,253,0.45)]"
                  : "border-[#e5edf5] bg-white hover:border-[#d6d9fc] hover:shadow-md"
              }`}
            >
              <div className="flex items-start justify-between">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    isSelected
                      ? "bg-[#533afd] text-white"
                      : "bg-[#f6f9fc] text-[#64748d]"
                  }`}
                >
                  {info.icon}
                </div>
                {isSelected && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#533afd] text-white">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </div>
              <h3 className="mt-3 font-medium text-[#061b31]">{info.name}</h3>
              <p className="mt-1 text-xs text-[#64748d]">{info.description}</p>
              {!info.requiresApiKey && (
                <Badge variant="success" className="mt-2">
                  No API Key
                </Badge>
              )}
            </div>
          );
        })}
      </div>

      {/* Configuration Form */}
      <Card className="rounded-xl border border-[#e5edf5] bg-white p-6 shadow-[0_15px_32px_-34px_rgba(6,27,49,0.55)]">
        <div className="space-y-6">
          {/* API Key Input (for OpenAI and Gemini) */}
          {providerInfo.requiresApiKey && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-[#061b31]">
                <Key className="h-4 w-4 text-[#64748d]" />
                API Key
              </label>
              <Input
                type="password"
                placeholder={`Enter your ${providerInfo.name} API key`}
                value={config.apiKey ?? ""}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, apiKey: e.target.value }))
                }
                className="max-w-md"
              />
              <p className="text-xs text-[#64748d]">
                Your API key is stored securely and never shared.
              </p>
            </div>
          )}

          {/* Ollama Base URL (for Ollama only) */}
          {config.provider === "ollama" && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-[#061b31]">
                <Server className="h-4 w-4 text-[#64748d]" />
                Ollama Base URL
              </label>
              <Input
                type="url"
                placeholder="http://localhost:11434"
                value={config.ollamaBaseUrl ?? "http://localhost:11434"}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, ollamaBaseUrl: e.target.value }))
                }
                className="max-w-md"
              />
              <p className="text-xs text-[#64748d]">
                Make sure Ollama is running locally on this URL.
              </p>
            </div>
          )}

          {/* Model Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#061b31]">
              Model
            </label>
            <Select
              value={config.model}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, model: e.target.value }))
              }
              className="max-w-md"
            >
              {currentModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                  {model.isFreeTier ? " (Free tier)" : ""}
                </option>
              ))}
            </Select>

            {/* Model Cards */}
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {currentModels.map((model) => (
                <div
                  key={model.id}
                  onClick={() =>
                    setConfig((prev) => ({ ...prev, model: model.id }))
                  }
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setConfig((prev) => ({ ...prev, model: model.id }));
                    }
                  }}
                  className={`relative cursor-pointer rounded-lg border p-4 text-left transition-all ${
                    config.model === model.id
                      ? "border-[#533afd] bg-[#f4f6ff]"
                      : "border-[#e5edf5] hover:border-[#d6d9fc]"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-[#061b31]">{model.name}</p>
                      <p className="mt-1 text-xs text-[#64748d]">
                        {model.description}
                      </p>
                    </div>
                    {model.isFreeTier && (
                      <Badge variant="success" className="shrink-0">
                        Free
                      </Badge>
                    )}
                  </div>
                  {config.model === model.id && (
                    <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#533afd] text-white">
                      <Check className="h-2.5 w-2.5" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Enable Toggle */}
          <div className="flex items-center gap-3 rounded-lg border border-[#e5edf5] bg-[#f6f9fc] p-4">
            <input
              type="checkbox"
              id="ai-enabled"
              checked={config.isEnabled}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, isEnabled: e.target.checked }))
              }
              className="h-4 w-4 rounded border-[#d6d9fc] text-[#533afd] focus:ring-[#533afd]"
            />
            <label htmlFor="ai-enabled" className="text-sm text-[#061b31]">
              Enable AI-powered applicant ranking
            </label>
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={handleSave}
              className="flex items-center gap-2"
              disabled={
                providerInfo.requiresApiKey && !config.apiKey && !config.isEnabled
              }
            >
              <Save className="h-4 w-4" />
              Save Configuration
            </Button>

            {isSaved && (
              <div className="flex items-center gap-1.5 text-sm text-emerald-600">
                <Check className="h-4 w-4" />
                Configuration saved successfully
              </div>
            )}

            {providerInfo.requiresApiKey && !config.apiKey && config.isEnabled && (
              <div className="flex items-center gap-1.5 text-sm text-amber-600">
                <AlertCircle className="h-4 w-4" />
                API key required to enable
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Info Section */}
      <div className="rounded-lg border border-[#d6d9fc] bg-[#f4f6ff] p-4">
        <h4 className="flex items-center gap-2 text-sm font-medium text-[#4434d4]">
          <Sparkles className="h-4 w-4" />
          About AI Configuration
        </h4>
        <p className="mt-2 text-xs text-[#64748d]">
          AI-powered applicant ranking compares job requirements with candidate
          resumes to generate match scores. OpenAI and Gemini require API keys,
          while Ollama runs locally without any external API calls. Free tier
          models are recommended for testing.
        </p>
      </div>
    </div>
  );
}
