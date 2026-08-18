import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import MessagesInbox from "@/app/components/MessagesInbox";

export default async function MessagesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-blue-600 text-sm">
          &larr; Back to FindAI
        </Link>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Messages</h1>
        <MessagesInbox currentUserId={session.user.id} />
      </div>
    </main>
  );
}