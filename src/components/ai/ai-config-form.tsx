"use client";

import { useState, useEffect, useCallback } from "react";
import { Save, Key, Server, Sparkles, Check, AlertCircle, RefreshCw, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  AIProvider,
  AIModel,
  AIConfiguration,
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

// Default fallback models
const DEFAULT_MODELS: Record<AIProvider, AIModel[]> = {
  openai: [
    { id: "gpt-4o-mini", name: "GPT-4o Mini", isFreeTier: true, description: "Fast and affordable" },
    { id: "gpt-4o", name: "GPT-4o", isFreeTier: false, description: "Most capable multimodal" },
    { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", isFreeTier: false, description: "Fast and cost-effective" },
  ],
  gemini: [
    { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", isFreeTier: true, description: "Fast and efficient" },
    { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", isFreeTier: false, description: "Most capable Gemini" },
    { id: "gemini-pro", name: "Gemini Pro", isFreeTier: false, description: "Balanced performance" },
  ],
  ollama: [
    { id: "llama3.2", name: "Llama 3.2", isFreeTier: true, description: "Meta's latest open model" },
    { id: "mistral", name: "Mistral", isFreeTier: true, description: "High performance open" },
    { id: "phi3", name: "Phi-3", isFreeTier: true, description: "Microsoft's compact" },
    { id: "gemma2", name: "Gemma 2", isFreeTier: true, description: "Google's open model" },
  ],
};

export function AIConfigForm({ initialConfig, onSave }: AIConfigFormProps) {
  const [config, setConfig] = useState<AIConfiguration>(
    initialConfig ?? {
      provider: "openai",
      apiKey: "",
      model: "",
      isEnabled: false,
      ollamaBaseUrl: "http://localhost:11434",
    }
  );
  const [isSaved, setIsSaved] = useState(false);
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch models when provider or ollama URL changes
  const fetchModels = useCallback(async () => {
    setIsLoadingModels(true);
    setFetchError(null);

    try {
      const params = new URLSearchParams();
      params.set("provider", config.provider);
      if (config.provider === "ollama") {
        params.set("baseUrl", config.ollamaBaseUrl || "http://localhost:11434");
      }

      const response = await fetch(`/api/ai/models?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch models");
      }

      if (data.models && data.models.length > 0) {
        setAvailableModels(data.models);
        // Auto-select first model if none selected
        setConfig((prev) => ({
          ...prev,
          model: prev.model || data.models[0].id,
        }));
      } else {
        // Fallback to defaults if no models returned
        setAvailableModels(DEFAULT_MODELS[config.provider]);
        setConfig((prev) => ({
          ...prev,
          model: prev.model || DEFAULT_MODELS[config.provider][0]?.id || "",
        }));
      }
    } catch (error) {
      console.error("Failed to fetch models:", error);
      setFetchError(error instanceof Error ? error.message : "Failed to fetch models");
      // Use defaults on error
      setAvailableModels(DEFAULT_MODELS[config.provider]);
    } finally {
      setIsLoadingModels(false);
    }
  }, [config.provider, config.ollamaBaseUrl]);

  // Fetch models on initial load and when provider changes
  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const handleProviderChange = (provider: AIProvider) => {
    setConfig((prev) => ({
      ...prev,
      provider,
      model: "", // Reset model when changing provider
      apiKey: provider === "ollama" ? "" : prev.apiKey,
    }));
    setFetchError(null);
  };

  const handleSave = () => {
    onSave?.(config);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

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
          {/* Ollama Base URL (for Ollama only) */}
          {config.provider === "ollama" && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-[#061b31]">
                <Server className="h-4 w-4 text-[#64748d]" />
                Ollama Base URL
              </label>
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="http://localhost:11434"
                  value={config.ollamaBaseUrl ?? "http://localhost:11434"}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, ollamaBaseUrl: e.target.value }))
                  }
                  className="flex-1 max-w-md"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={fetchModels}
                  disabled={isLoadingModels}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoadingModels ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>
              <p className="text-xs text-[#64748d]">
                Make sure Ollama is running locally on this URL.
              </p>
            </div>
          )}

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

          {/* Model Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-[#061b31]">
                Available Models
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchModels}
                disabled={isLoadingModels}
                className="flex items-center gap-1 text-xs"
              >
                <RefreshCw className={`h-3 w-3 ${isLoadingModels ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>

            {isLoadingModels ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 rounded-lg" />
                ))}
              </div>
            ) : fetchError ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-sm text-amber-800">
                      Could not fetch models from {config.provider}
                    </p>
                    <p className="mt-1 text-xs text-amber-600">{fetchError}</p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={fetchModels}
                      className="mt-2"
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Model Dropdown */}
                <Select
                  value={config.model}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, model: e.target.value }))
                  }
                  className="max-w-md"
                >
                  <option value="">Select a model...</option>
                  {availableModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                      {model.isFreeTier ? " (Free tier)" : ""}
                    </option>
                  ))}
                </Select>

                {/* Model Cards */}
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {availableModels.map((model) => (
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
                            {model.description || "AI language model"}
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
              </>
            )}
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
          while Ollama runs locally without any external API calls. Models are
          fetched dynamically - make sure your Ollama instance is running.
        </p>
      </div>
    </div>
  );
}
