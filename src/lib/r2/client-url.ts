export function publicUrlForClient(key: string): string {
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL;
  if (!base) {
    throw new Error("NEXT_PUBLIC_R2_PUBLIC_BASE_URL is not set in .env.local");
  }
  return `${base.replace(/\/$/, "")}/${key}`;
}
