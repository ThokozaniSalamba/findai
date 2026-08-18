import type { Metadata } from "next";
import { prisma } from "@/app/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import ClaimButton from "@/app/components/ClaimButton";
import FavoriteButton from "@/app/components/FavoriteButton";
import DirectionsInfo from "@/app/components/DirectionsInfo";
import ReportButton from "@/app/components/ReportButton";

type Props = {
  params: Promise<{ id: string }>;
};

const availabilityLabels: Record<string, { label: string; className: string }> = {
  available_now: { label: "Available now", className: "bg-green-100 text-green-700" },
  busy: { label: "Busy", className: "bg-amber-100 text-amber-700" },
  tomorrow: { label: "Available tomorrow", className: "bg-blue-100 text-blue-700" },
  holiday: { label: "On holiday", className: "bg-gray-200 text-gray-600" },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const business = await prisma.business.findUnique({
    where: { id },
    select: { name: true, description: true, city: true, country: true },
  });

  if (!business) {
    return { title: "Business not found" };
  }

  const title = `${business.name} — ${business.city}, ${business.country}`;
  const description =
    business.description ||
    `Find ${business.name} in ${business.city}, ${business.country} on FindAI.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

export default async function BusinessPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();

  const business = await prisma.business.findUnique({
    where: { id },
    include: {
      category: true,
      reviews: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } } },
      },
    },
  });

  if (!business) {
    notFound();
  }

  if (session?.user) {
    await prisma.viewHistory.create({
      data: {
        userId: (session.user as any).id,
        businessId: id,
      },
    });
  }

  let isFavorited = false;
  if (session?.user) {
    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_businessId: {
          userId: (session.user as any).id,
          businessId: id,
        },
      },
    });
    isFavorited = Boolean(favorite);
  }

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`;
  const isLoggedIn = Boolean(session?.user);
  const isUnclaimed = !business.ownerId;
  const isOwner = business.ownerId === session?.user?.id;
  const availabilityInfo = availabilityLabels[business.availability];
  const skillsList = business.skills
    ? business.skills.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-gray-200 px-6 py-4">
        <Link href="/" className="text-blue-600 text-sm">
          ← Back to search
        </Link>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="bg-gray-100 h-56 rounded-xl mb-6" />

        <div className="flex items-center justify-between mb-1">
          <p className="text-sm text-blue-600 font-medium">
            {business.category.name}
          </p>
          {business.isIndividual && (
            <span className="text-xs font-medium text-gray-500 bg-gray-100 rounded-full px-3 py-1">
              Individual professional
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-3">
          <h1 className="text-3xl font-bold text-gray-900">{business.name}</h1>
          {business.verified && (
            <span
              title="Verified business"
              className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold px-3 py-1"
            >
              ✓ Verified
            </span>
          )}
          {availabilityInfo && (
            <span
              className={`inline-flex items-center gap-1 rounded-full text-xs font-semibold px-3 py-1 ${availabilityInfo.className}`}
            >
              {availabilityInfo.label}
            </span>
          )}
        </div>

        {business.description && (
          <p className="text-gray-600 mb-6">{business.description}</p>
        )}

        {skillsList.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {skillsList.map((skill) => (
                <span
                  key={skill}
                  className="text-xs font-medium text-gray-700 bg-gray-100 rounded-full px-3 py-1"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-gray-200 pt-6">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Address</h2>
            <p className="text-gray-600 text-sm">
              {business.addressLine}
              <br />
              {business.city}
              {business.region ? `, ${business.region}` : ""}
              <br />
              {business.country}
            </p>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Contact</h2>
            <p className="text-gray-600 text-sm">
              {business.phone ?? "Phone not available"}
              <br />
              {business.website ? (
                <a href={business.website} className="text-blue-600" target="_blank">
                  {business.website}
                </a>
              ) : (
                "Website not available"
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-8">
          <a href={directionsUrl} target="_blank" className="inline-block bg-blue-600 text-white text-sm font-medium px-6 py-3 rounded-full hover:bg-blue-700">
            Get directions
          </a>

          {isLoggedIn && (
            <FavoriteButton businessId={business.id} initialFavorited={isFavorited} />
          )}

          {isOwner && (
            <Link href={`/dashboard/business/${business.id}`} className="inline-block border border-gray-300 text-gray-700 text-sm font-medium px-6 py-3 rounded-full hover:bg-gray-50">
              Manage this business
            </Link>
          )}

          {!isOwner && isUnclaimed && isLoggedIn && (
            <ClaimButton businessId={business.id} />
          )}

          {!isOwner && isUnclaimed && !isLoggedIn && (
            <Link href="/login" className="inline-block border border-gray-300 text-gray-700 text-sm font-medium px-6 py-3 rounded-full hover:bg-gray-50">
              Sign in to claim this business
            </Link>
          )}
        </div>

        <DirectionsInfo destLat={business.latitude} destLng={business.longitude} />

        <div className="mt-10 border-t pt-6">
          <h2 className="text-xl font-bold mb-4">Reviews</h2>

          {isLoggedIn ? (
            <form
              action={async (formData: FormData) => {
                "use server";
                const { auth } = await import("@/auth");
                const { prisma } = await import("@/app/lib/prisma");
                const { redirect } = await import("next/navigation");
                const { sendReviewNotification } = await import("@/app/lib/email");

                const session = await auth();
                if (!session?.user) {
                  redirect("/login");
                }

                const currentUser = await prisma.user.findUnique({
                  where: { id: (session!.user as any).id },
                });
                if (currentUser?.banned) {
                  redirect(`/business/${business.id}`);
                }

                const { checkRateLimit } = await import("@/app/lib/rate-limit");
                const limit = checkRateLimit(`review:${(session!.user as any).id}`, 5, 60_000);
                if (!limit.allowed) {
                  redirect(`/business/${business.id}`);
                }

                const rating = Number(formData.get("rating"));
                const comment = formData.get("comment") as string;

                await prisma.review.create({
                  data: {
                    rating,
                    comment,
                    businessId: business.id,
                    userId: (session!.user as any).id,
                  },
                });

                if (business.ownerId) {
                  const owner = await prisma.user.findUnique({
                    where: { id: business.ownerId },
                  });
                  if (owner) {
                    sendReviewNotification(
                      owner.email,
                      business.name,
                      business.id,
                      rating,
                      comment || null
                    ).catch((err) =>
                      console.error("Review notification email failed:", err)
                    );
                  }
                }

                redirect(`/business/${business.id}`);
              }}
              className="mb-8 border rounded-lg p-4"
            >
              <label className="block text-sm font-medium mb-1">Rating</label>
              <select name="rating" required className="border rounded px-2 py-1 mb-3">
                <option value="5">5 - Excellent</option>
                <option value="4">4 - Good</option>
                <option value="3">3 - Average</option>
                <option value="2">2 - Poor</option>
                <option value="1">1 - Terrible</option>
              </select>

              <label className="block text-sm font-medium mb-1">Comment</label>
              <textarea
                name="comment"
                rows={3}
                className="w-full border rounded px-2 py-1 mb-3"
                placeholder="Share your experience..."
              />

              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Submit Review
              </button>
            </form>
          ) : (
            <p className="text-gray-500 mb-8">
              <Link href="/login" className="text-blue-600 hover:underline">
                Sign in
              </Link>{" "}
              to leave a review.
            </p>
          )}

          <div className="space-y-4">
            {business.reviews.length === 0 && (
              <p className="text-gray-500">No reviews yet. Be the first!</p>
            )}
            {business.reviews.map((review) => (
              <div key={review.id} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">{"★".repeat(review.rating)}</span>
                  <span className="text-sm text-gray-500">
                    {review.user.name || "Anonymous"} ·{" "}
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {review.comment && <p className="text-gray-700">{review.comment}</p>}
                {isLoggedIn && <ReportButton reviewId={review.id} />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}