import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Client, R2_BUCKET } from "./client";
import { randomUUID } from "crypto";

/**
 * Generates a short-lived signed URL the browser can PUT a file to
 * directly. This keeps large image uploads off our server entirely —
 * the Next.js API route only ever handles small JSON payloads
 * (the request for a URL, and later the metadata to save once the
 * upload succeeds), never the file bytes themselves.
 */
export async function createPresignedUploadUrl(params: {
  gameSlug: string;
  contentType: string;
}): Promise<{ uploadUrl: string; key: string }> {
  const extension = extensionFromContentType(params.contentType);
  const key = `screenshots/${params.gameSlug}/${randomUUID()}${extension}`;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    ContentType: params.contentType,
  });

  const uploadUrl = await getSignedUrl(r2Client, command, {
    expiresIn: 60 * 5, // 5 minutes is plenty for a direct browser upload
  });

  return { uploadUrl, key };
}

function extensionFromContentType(contentType: string): string {
  switch (contentType) {
    case "image/png":
      return ".png";
    case "image/jpeg":
      return ".jpg";
    case "image/webp":
      return ".webp";
    default:
      throw new Error(`Unsupported content type: ${contentType}`);
  }
}
