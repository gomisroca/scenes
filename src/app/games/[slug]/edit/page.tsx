import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";
import { getGameBySlug } from "@/db/queries";
import { PasswordGate } from "@/components/PasswordGate";
import { EditGameForm } from "@/components/admin/EditGameForm";

export default async function EditGamePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const isAuthenticated = verifySessionToken(token);

  // Check auth before fetching the game
  if (!isAuthenticated) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-16">
        <PasswordGate />
      </main>
    );
  }

  const entry = await getGameBySlug(slug);
  if (!entry) notFound();

  return (
    <main className="max-w-2xl mx-auto px-6 py-16">
      <EditGameForm game={entry.game} />
    </main>
  );
}
