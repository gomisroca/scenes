import { S3Client } from "@aws-sdk/client-s3";

/**
 * R2 is S3-compatible, so the regular AWS SDK works against it —
 * we just point endpoint at the Cloudflare account-specific URL.
 * Region is required by the SDK type but R2 ignores its value;
 * "auto" is Cloudflare's documented convention.
 */
function getR2Client() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2 credentials are not set. Add R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY to .env.local",
    );
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export const r2Client = getR2Client();

export const R2_BUCKET = process.env.R2_BUCKET_NAME!;

/**
 * R2 buckets can be exposed via a public bucket URL (r2.dev domain
 * or a custom domain mapped via Cloudflare). We never store this
 * base URL in the DB — only the object key — so swapping domains
 * later doesn't require a data migration.
 */
export function publicUrlFor(key: string): string {
  const base = process.env.R2_PUBLIC_BASE_URL;
  if (!base) {
    throw new Error("R2_PUBLIC_BASE_URL is not set in .env.local");
  }
  return `${base.replace(/\/$/, "")}/${key}`;
}
