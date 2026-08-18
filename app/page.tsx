import { prisma } from "./lib/prisma";
import SearchHome from "./components/SearchHome";
import UserMenu from "./components/UserMenu";
import MessagesIcon from "./components/MessagesIcon";
import { auth } from "@/auth";
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

  const [businessCount, categoryCount, countryGroups, verifiedCount] = await Promise.all([
    prisma.business.count(),
    prisma.category.count(),
    prisma.business.groupBy({ by: ["country"] }),
    prisma.business.count({ where: { verified: true } }),
  ]);

  const countryCount = countryGroups.length;

  return (
    <main className="min-h-screen bg-paper">
      <header className="sticky top-0 z-40 bg-atlas text-paper border-b border-atlas-light px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-display text-2xl font-semibold text-paper">
          Find<span className="text-brass">AI</span>
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <Link href="/jobs" className="text-paper/80 hover:text-paper">
            Browse Jobs
          </Link>
          <Link href="/post-job" className="text-paper/80 hover:text-paper">
            Post a Job
          </Link>

          {session?.user ? (
            <>
              <MessagesIcon />
              <UserMenu displayName={session.user.name || session.user.email || "there"} />
            </>
          ) : (
            <>
              <Link href="/login" className="text-paper/80 hover:text-paper">
                Sign In
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-brass px-4 py-1.5 font-medium text-atlas hover:bg-brass/90 transition-colors"
              >
                Register
              </Link>
            </>
          )}
        </nav>
      </header>

      <section className="topo-bg relative overflow-hidden px-6 pt-16 pb-20 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass mb-4">
          Global Business & Service Directory
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-semibold text-paper max-w-2xl mx-auto leading-tight">
          Find any place, any professional, anywhere.
        </h1>
        <p className="mt-4 text-paper/70 max-w-xl mx-auto text-sm sm:text-base">
          Search the way you would ask a friend. Then quote, message, and
          book, all in one place.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-x-10 gap-y-4 max-w-3xl mx-auto">
          <div>
            <p className="font-display text-2xl sm:text-3xl font-semibold text-brass">{businessCount}+</p>
            <p className="font-mono text-[11px] uppercase tracking-wider text-paper/60">Listed</p>
          </div>
          <div>
            <p className="font-display text-2xl sm:text-3xl font-semibold text-brass">{categoryCount}</p>
            <p className="font-mono text-[11px] uppercase tracking-wider text-paper/60">Categories</p>
          </div>
          <div>
            <p className="font-display text-2xl sm:text-3xl font-semibold text-brass">{countryCount}</p>
            <p className="font-mono text-[11px] uppercase tracking-wider text-paper/60">Countries</p>
          </div>
          <div>
            <p className="font-display text-2xl sm:text-3xl font-semibold text-brass">{verifiedCount}</p>
            <p className="font-mono text-[11px] uppercase tracking-wider text-paper/60">Verified</p>
          </div>
        </div>
      </section>

      <div className="relative z-10 -mt-12 sm:-mt-16 pb-10">
        <SearchHome
          categories={categories}
          initialBusinesses={businesses}
          trendingBusinesses={trendingBusinesses}
        />
      </div>

      <section className="px-6 py-20 border-t border-atlas/10">
        <div className="max-w-5xl mx-auto">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass mb-3 text-center">
            How It Works
          </p>
          <h2 className="font-display text-3xl font-semibold text-atlas text-center mb-14">
            From search to booked, in minutes.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            <div className="text-center sm:text-left">
              <p className="font-display text-5xl font-semibold text-brass/30 mb-3">01</p>
              <h3 className="font-display text-lg font-semibold text-atlas mb-2">Tell us what you need</h3>
              <p className="text-sm text-atlas/60">
                Describe it in plain language. Our AI search understands intent, not just keywords.
              </p>
            </div>
            <div className="text-center sm:text-left">
              <p className="font-display text-5xl font-semibold text-brass/30 mb-3">02</p>
              <h3 className="font-display text-lg font-semibold text-atlas mb-2">Compare & connect</h3>
              <p className="text-sm text-atlas/60">
                Get quotes from verified businesses and professionals, and message them directly in-app.
              </p>
            </div>
            <div className="text-center sm:text-left">
              <p className="font-display text-5xl font-semibold text-brass/30 mb-3">03</p>
              <h3 className="font-display text-lg font-semibold text-atlas mb-2">Book with confidence</h3>
              <p className="text-sm text-atlas/60">
                Agree a time, track the job to completion, and leave a review, all in one place.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 bg-atlas/[0.03] border-t border-atlas/10">
        <div className="max-w-5xl mx-auto">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass mb-3 text-center">
            The FindAI Edge
          </p>
          <h2 className="font-display text-3xl font-semibold text-atlas text-center mb-14">
            Built to be more than a directory.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="rounded-xl border border-atlas/10 bg-paper p-6">
              <h3 className="font-display text-base font-semibold text-atlas mb-2">AI-powered matching</h3>
              <p className="text-sm text-atlas/60">Search in natural language and get results that understand what you are actually asking for.</p>
            </div>
            <div className="rounded-xl border border-atlas/10 bg-paper p-6">
              <h3 className="font-display text-base font-semibold text-atlas mb-2">Businesses & individuals</h3>
              <p className="text-sm text-atlas/60">From large companies to independent tradespeople. Find who you need, not just where.</p>
            </div>
            <div className="rounded-xl border border-atlas/10 bg-paper p-6">
              <h3 className="font-display text-base font-semibold text-atlas mb-2">Verified & trusted</h3>
              <p className="text-sm text-atlas/60">Verification badges and real reviews help you choose with confidence, not guesswork.</p>
            </div>
            <div className="rounded-xl border border-atlas/10 bg-paper p-6">
              <h3 className="font-display text-base font-semibold text-atlas mb-2">Quotes, chat & booking built in</h3>
              <p className="text-sm text-atlas/60">No more juggling calls and texts. The whole job happens in one thread, start to finish.</p>
            </div>
            <div className="rounded-xl border border-atlas/10 bg-paper p-6">
              <h3 className="font-display text-base font-semibold text-atlas mb-2">Global from day one</h3>
              <p className="text-sm text-atlas/60">Not limited to one country or city. Search and list anywhere in the world.</p>
            </div>
            <div className="rounded-xl border border-atlas/10 bg-paper p-6">
              <h3 className="font-display text-base font-semibold text-atlas mb-2">Free to search, always</h3>
              <p className="text-sm text-atlas/60">Finding what you need never costs you anything on FindAI.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-atlas text-paper px-6 py-14 border-t border-atlas-light">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8">
          <div className="col-span-2 sm:col-span-1">
            <p className="font-display text-xl font-semibold mb-2">
              Find<span className="text-brass">AI</span>
            </p>
            <p className="text-xs text-paper/50">
              Find any place, any professional, anywhere.
            </p>
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-paper/40 mb-3">Discover</p>
            <ul className="space-y-2 text-sm text-paper/70">
              <li><Link href="/jobs" className="hover:text-paper">Browse Jobs</Link></li>
              <li><Link href="/" className="hover:text-paper">Search Places</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-paper/40 mb-3">For Providers</p>
            <ul className="space-y-2 text-sm text-paper/70">
              <li><Link href="/post-job" className="hover:text-paper">Post a Job</Link></li>
              <li><Link href="/register" className="hover:text-paper">Register a Business</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-paper/40 mb-3">Account</p>
            <ul className="space-y-2 text-sm text-paper/70">
              {session?.user ? (
                <li><Link href="/dashboard" className="hover:text-paper">Dashboard</Link></li>
              ) : (
                <>
                  <li><Link href="/login" className="hover:text-paper">Sign In</Link></li>
                  <li><Link href="/register" className="hover:text-paper">Register</Link></li>
                </>
              )}
            </ul>
          </div>
        </div>
        <p className="max-w-5xl mx-auto mt-10 pt-6 border-t border-atlas-light text-xs text-paper/40">
          &copy; 2026 FindAI. All rights reserved.
        </p>
      </footer>
    </main>
  );
}