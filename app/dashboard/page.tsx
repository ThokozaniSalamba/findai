import { prisma } from "@/app/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const businesses = await prisma.business.findMany({
    where: { ownerId: session.user.id },
    include: { category: true },
  });

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-blue-600 text-sm">
          ← Back to FindAI
        </Link>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          My businesses
        </h1>

        {businesses.length === 0 ? (
          <p className="text-gray-500 text-sm">
            You haven&apos;t claimed any businesses yet. Find one on FindAI and
            claim it to manage it here.
          </p>
        ) : (
          <div className="space-y-3">
            {businesses.map((business) => (
              <Link
                key={business.id}
                href={`/dashboard/business/${business.id}`}
                className="block border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
              >
                <p className="font-medium text-gray-900">{business.name}</p>
                <p className="text-sm text-gray-500">
                  {business.category.name} · {business.city}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}