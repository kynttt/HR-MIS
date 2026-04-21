import mammoth from "mammoth";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse") as (buffer: Buffer) => Promise<{ text: string }>;

function getFileType(contentType: string | null, url: string): "pdf" | "docx" | "unknown" {
  if (contentType) {
    if (contentType.includes("pdf")) return "pdf";
    if (contentType.includes("officedocument.wordprocessingml") || contentType.includes("msword")) return "docx";
  }
  const lower = url.split("?")[0].toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".docx")) return "docx";
  return "unknown";
}

export async function extractResumeText(fileUrl: string): Promise<string | null> {
  try {
    const response = await fetch(fileUrl, { redirect: "follow" });
    if (!response.ok) {
      console.error("[Extractor] Failed to download resume:", response.status, fileUrl);
      return null;
    }

    const contentType = response.headers.get("content-type");
    const type = getFileType(contentType, fileUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (type === "pdf") {
      const parsed = await pdfParse(buffer);
      return parsed.text?.trim() || null;
    }

    if (type === "docx") {
      const result = await mammoth.extractRawText({ buffer });
      return result.value?.trim() || null;
    }

    console.error("[Extractor] Unsupported file type:", type, fileUrl);
    return null;
  } catch (error) {
    console.error("[Extractor] Error extracting resume text:", error);
    return null;
  }
}
