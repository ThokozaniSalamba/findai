import { prisma } from "@/app/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function HistoryPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const views = await prisma.viewHistory.findMany({
    where: { userId: (session.user as any).id },
    orderBy: { viewedAt: "desc" },
    take: 20,
    include: {
      business: {
        include: { category: true },
      },
    },
  });

  const seen = new Set<string>();
  const uniqueViews = views.filter((v) => {
    if (seen.has(v.business.id)) return false;
    seen.add(v.business.id);
    return true;
  });

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Recently Viewed</h1>
        <Link href="/" className="text-blue-600 text-sm hover:underline">
          ← Back to search
        </Link>
      </div>

      {uniqueViews.length === 0 ? (
        <p className="text-gray-500">
          You haven't viewed any businesses yet.{" "}
          <Link href="/" className="text-blue-600 hover:underline">
            Start exploring
          </Link>
          .
        </p>
      ) : (
        <div className="space-y-4">
          {uniqueViews.map((v) => (
            <Link
              key={v.id}
              href={`/business/${v.business.id}`}
              className="block border rounded-lg p-4 hover:bg-gray-50"
            >
              <p className="text-sm text-blue-600 font-medium mb-1">
                {v.business.category.name}
              </p>
              <h2 className="text-lg font-semibold text-gray-900">
                {v.business.name}
              </h2>
              <p className="text-sm text-gray-500">
                {v.business.city}
                {v.business.region ? `, ${v.business.region}` : ""}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}