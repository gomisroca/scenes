import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Client, R2_BUCKET } from "./client";
import { randomUUID } from "crypto";

/**
 * Generates a short-lived signed URL the browser can PUT a file to
 * directly
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
    expiresIn: 60 * 5,
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

/**
 * Deletes an object from R2
 */
export async function deleteObjectFromR2(key: string): Promise<void> {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    }),
  );
}
