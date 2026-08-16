import { prisma } from "./lib/prisma";
import SearchHome from "./components/SearchHome";
import { auth, signOut } from "@/auth";
import Link from "next/link";

export default async function Home() {
  const session = await auth();

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  const businesses = await prisma.business.findMany({
    include: { category: true },
    take: 8,
  });

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const trendingCounts = await prisma.viewHistory.groupBy({
    by: ["businessId"],
    where: { viewedAt: { gte: sevenDaysAgo } },
    _count: { businessId: true },
    orderBy: { _count: { businessId: "desc" } },
    take: 8,
  });

  const trendingIds = trendingCounts.map((t) => t.businessId);

  const trendingBusinessesRaw = trendingIds.length
    ? await prisma.business.findMany({
        where: { id: { in: trendingIds } },
        include: { category: true },
      })
    : [];

  const trendingBusinesses = trendingIds
    .map((id) => trendingBusinessesRaw.find((b) => b.id === id))
    .filter((b): b is NonNullable<typeof b> => Boolean(b));

  return (
    <main className="min-h-screen bg-paper">
      <header className="sticky top-0 z-40 bg-atlas text-paper border-b border-atlas-light px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-display text-2xl font-semibold text-paper">
          Find<span className="text-brass">AI</span>
        </Link>

        {session?.user ? (
          <div className="flex items-center gap-4 text-sm">
            <span className="text-paper/70">
              Hi, {session.user.name || session.user.email}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut();
              }}
            >
              <button
                type="submit"
                className="text-brass hover:text-coral transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        ) : (
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/login" className="text-paper/80 hover:text-paper">
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-brass px-4 py-1.5 font-medium text-atlas hover:bg-brass/90 transition-colors"
            >
              Register
            </Link>
          </nav>
        )}
      </header>

      <section className="topo-bg relative overflow-hidden px-6 pt-16 pb-24 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass mb-4">
          Global Business Directory
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold text-paper max-w-2xl mx-auto leading-tight">
          Find any place, anywhere.
        </h1>
        <p className="mt-4 text-paper/70 max-w-xl mx-auto text-sm sm:text-base">
          Search the way you'd ask a friend — FindAI understands "cheap
          coffee open now near me."
        </p>
      </section>

      <div className="relative z-10 -mt-12 sm:-mt-16 pb-16">
        <SearchHome
          categories={categories}
          initialBusinesses={businesses}
          trendingBusinesses={trendingBusinesses}
        />
      </div>
    </main>
  );
}