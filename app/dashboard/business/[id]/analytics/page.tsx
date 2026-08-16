import { prisma } from "@/app/lib/prisma";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function BusinessAnalyticsPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const business = await prisma.business.findUnique({
    where: { id },
    include: {
      reviews: true,
    },
  });

  if (!business) {
    notFound();
  }

  const isOwner = business.ownerId === session.user.id;
  const isAdmin = (session.user as any).role?.toLowerCase() === "admin";

  if (!isOwner && !isAdmin) {
    redirect("/");
  }

  const [viewCount, favoriteCount, impressionCount] = await Promise.all([
    prisma.viewHistory.count({ where: { businessId: id } }),
    prisma.favorite.count({ where: { businessId: id } }),
    prisma.searchImpression.count({ where: { businessId: id } }),
  ]);

  const reviewCount = business.reviews.length;
  const avgRating =
    reviewCount > 0
      ? business.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : null;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [recentViews, recentImpressions] = await Promise.all([
    prisma.viewHistory.count({
      where: { businessId: id, viewedAt: { gte: thirtyDaysAgo } },
    }),
    prisma.searchImpression.count({
      where: { businessId: id, viewedAt: { gte: thirtyDaysAgo } },
    }),
  ]);

  const clickThroughRate =
    impressionCount > 0 ? ((viewCount / impressionCount) * 100).toFixed(1) : "0.0";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href={`/dashboard/business/${id}`}
            className="text-blue-600 text-sm hover:underline"
          >
            ← Back to manage business
          </Link>
          <h1 className="text-2xl font-bold mt-1">{business.name} — Analytics</h1>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="border rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Search Impressions
          </p>
          <p className="text-2xl font-bold text-gray-900">{impressionCount}</p>
        </div>

        <div className="border rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Profile Views
          </p>
          <p className="text-2xl font-bold text-gray-900">{viewCount}</p>
        </div>

        <div className="border rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Saves
          </p>
          <p className="text-2xl font-bold text-gray-900">{favoriteCount}</p>
        </div>

        <div className="border rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Avg Rating
          </p>
          <p className="text-2xl font-bold text-gray-900">
            {avgRating ? avgRating.toFixed(1) : "—"}
          </p>
          <p className="text-xs text-gray-400">{reviewCount} review{reviewCount === 1 ? "" : "s"}</p>
        </div>
      </div>

      <div className="border rounded-lg p-5 mb-8">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Last 30 Days</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-gray-500 mb-1">Impressions</p>
            <p className="text-xl font-semibold text-gray-900">{recentImpressions}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Views</p>
            <p className="text-xl font-semibold text-gray-900">{recentViews}</p>
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-2">Click-Through Rate</h2>
        <p className="text-3xl font-bold text-gray-900">{clickThroughRate}%</p>
        <p className="text-xs text-gray-500 mt-1">
          Percentage of people who viewed your profile after seeing it in search results.
        </p>
      </div>

      {reviewCount > 0 && (
        <div className="mt-8 border rounded-lg p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Recent Reviews</h2>
          <div className="space-y-3">
            {business.reviews.slice(0, 5).map((review) => (
              <div key={review.id} className="border-b last:border-0 pb-3 last:pb-0">
                <span className="font-semibold text-sm">{"★".repeat(review.rating)}</span>
                {review.comment && (
                  <p className="text-sm text-gray-600 mt-1">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}