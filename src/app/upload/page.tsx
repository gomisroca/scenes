import { cookies } from "next/headers";
import { COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";
import { UploadDashboard } from "@/components/upload/UploadDashboard";
import { PasswordGate } from "@/components/PasswordGate";

export default async function UploadPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const isAuthenticated = verifySessionToken(token);

  return (
    <main className="max-w-2xl mx-auto px-6 py-16">
      {isAuthenticated ? <UploadDashboard /> : <PasswordGate />}
    </main>
  );
}
