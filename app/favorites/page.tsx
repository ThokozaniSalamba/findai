import { prisma } from "@/app/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function FavoritesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: (session.user as any).id },
    orderBy: { createdAt: "desc" },
    include: {
      business: {
        include: { category: true },
      },
    },
  });

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Favorites</h1>
        <Link href="/" className="text-blue-600 text-sm hover:underline">
          ← Back to search
        </Link>
      </div>

      {favorites.length === 0 ? (
        <p className="text-gray-500">
          You haven't saved any businesses yet.{" "}
          <Link href="/" className="text-blue-600 hover:underline">
            Start exploring
          </Link>
          .
        </p>
      ) : (
        <div className="space-y-4">
          {favorites.map((fav) => (
            <Link
              key={fav.id}
              href={`/business/${fav.business.id}`}
              className="block border rounded-lg p-4 hover:bg-gray-50"
            >
              <p className="text-sm text-blue-600 font-medium mb-1">
                {fav.business.category.name}
              </p>
              <h2 className="text-lg font-semibold text-gray-900">
                {fav.business.name}
              </h2>
              <p className="text-sm text-gray-500">
                {fav.business.city}
                {fav.business.region ? `, ${fav.business.region}` : ""}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}