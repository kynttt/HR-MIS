import { headers } from "next/headers";

export async function getRequestFingerprint(scope: string): Promise<string> {
  const requestHeaders = await headers();

  const xForwardedFor = requestHeaders.get("x-forwarded-for");
  const xRealIp = requestHeaders.get("x-real-ip");
  const userAgent = requestHeaders.get("user-agent")?.slice(0, 120) ?? "unknown";

  const ip = xForwardedFor?.split(",")[0]?.trim() || xRealIp?.trim() || "unknown";

  return `${scope}:${ip}:${userAgent}`;
}
