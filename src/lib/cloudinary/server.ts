import "server-only";

import { v2 as cloudinary } from "cloudinary";

type CloudinaryUploadResult = {
  secureUrl: string;
  publicId: string;
};

function requireEnv(name: "CLOUDINARY_CLOUD_NAME" | "CLOUDINARY_API_KEY" | "CLOUDINARY_API_SECRET") {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }
  return value;
}

let configured = false;

function getCloudinary() {
  if (!configured) {
    cloudinary.config({
      cloud_name: requireEnv("CLOUDINARY_CLOUD_NAME"),
      api_key: requireEnv("CLOUDINARY_API_KEY"),
      api_secret: requireEnv("CLOUDINARY_API_SECRET"),
      secure: true
    });
    configured = true;
  }

  return cloudinary;
}

export async function uploadFileToCloudinary(file: File, folder: string): Promise<CloudinaryUploadResult> {
  const instance = getCloudinary();
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  return new Promise((resolve, reject) => {
    const stream = instance.uploader.upload_stream(
      {
        folder,
        resource_type: "auto"
      },
      (error, result) => {
        if (error || !result?.secure_url || !result.public_id) {
          reject(error ?? new Error("Cloudinary upload failed."));
          return;
        }

        resolve({
          secureUrl: result.secure_url,
          publicId: result.public_id
        });
      }
    );

    stream.end(buffer);
  });
}

function parseCloudinaryAsset(url: string): { resourceType: "image" | "raw" | "video"; publicId: string } | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("res.cloudinary.com")) {
      return null;
    }

    const segments = parsed.pathname.split("/").filter(Boolean);
    const uploadIndex = segments.findIndex((segment) => segment === "upload");
    if (uploadIndex < 1) {
      return null;
    }

    const resourceType = segments[uploadIndex - 1];
    if (resourceType !== "image" && resourceType !== "raw" && resourceType !== "video") {
      return null;
    }

    let publicIdSegments = segments.slice(uploadIndex + 1);
    if (publicIdSegments.length > 0 && /^v\d+$/.test(publicIdSegments[0])) {
      publicIdSegments = publicIdSegments.slice(1);
    }

    if (publicIdSegments.length === 0) {
      return null;
    }

    const publicIdWithExt = publicIdSegments.join("/");
    const publicId =
      resourceType === "raw" ? publicIdWithExt : publicIdWithExt.replace(/\.[^.\/]+$/, "");

    if (!publicId) {
      return null;
    }

    return {
      resourceType,
      publicId
    };
  } catch {
    return null;
  }
}

export async function deleteFileFromCloudinary(fileUrl: string): Promise<void> {
  const parsed = parseCloudinaryAsset(fileUrl);
  if (!parsed) {
    return;
  }

  const instance = getCloudinary();
  await instance.uploader.destroy(parsed.publicId, {
    resource_type: parsed.resourceType,
    invalidate: true
  });
}

export async function uploadImageToCloudinary(file: File, folder: string): Promise<CloudinaryUploadResult> {
  return uploadFileToCloudinary(file, folder);
}

export function isImageFile(file: File): boolean {
  return file.type.toLowerCase().startsWith("image/");
}
