import { cookies } from "next/headers";
import { COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";
import { PasswordGate } from "@/components/PasswordGate";
import { AddGameForm } from "@/components/admin/AddGameForm";

export default async function NewGamePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const isAuthenticated = verifySessionToken(token);

  return (
    <main className="max-w-2xl mx-auto px-6 py-16">
      {isAuthenticated ? <AddGameForm /> : <PasswordGate />}
    </main>
  );
}
