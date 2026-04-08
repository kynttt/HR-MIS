const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp"
]);

const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png", ".webp"];

export function validateDocumentFile(file: File): { ok: true } | { ok: false; error: string } {
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "File is required." };
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "File size exceeds 10MB." };
  }

  const mime = file.type.toLowerCase();
  const hasAllowedMime = mime && ALLOWED_MIME_TYPES.has(mime);

  const lowerName = file.name.toLowerCase();
  const hasAllowedExtension = ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));

  if (!hasAllowedMime && !hasAllowedExtension) {
    return { ok: false, error: "Unsupported file type. Allowed: PDF, DOC, DOCX, JPG, PNG, WEBP." };
  }

  return { ok: true };
}
