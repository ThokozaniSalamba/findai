import { prisma } from "@/app/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const businesses = await prisma.business.findMany({
    where: { ownerId: userId },
    include: { category: true },
  });

  const myAcceptedQuotes = await prisma.quote.findMany({
    where: {
      status: "accepted",
      business: { ownerId: userId },
    },
    include: {
      jobRequest: true,
      business: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const myJobs = await Promise.all(
    myAcceptedQuotes.map(async (q) => {
      const [lastMessage, readRecord, booking] = await Promise.all([
        prisma.message.findFirst({
          where: { jobRequestId: q.jobRequestId, businessId: q.businessId },
          orderBy: { createdAt: "desc" },
        }),
        prisma.messageRead.findUnique({
          where: {
            jobRequestId_businessId_userId: {
              jobRequestId: q.jobRequestId,
              businessId: q.businessId,
              userId,
            },
          },
        }),
        prisma.booking.findUnique({ where: { jobRequestId: q.jobRequestId } }),
      ]);

      const hasUnread = Boolean(
        lastMessage &&
          lastMessage.senderId !== userId &&
          (!readRecord || lastMessage.createdAt > readRecord.lastReadAt)
      );

      return {
        quote: q,
        hasUnread,
        lastMessagePreview: lastMessage?.content ?? null,
        bookingStatus: booking?.status ?? null,
      };
    })
  );

  const myPostedJobs = await prisma.jobRequest.findMany({
    where: { customerId: userId },
    include: {
      quotes: {
        include: { business: { select: { id: true, name: true } } },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const postedJobsWithInfo = await Promise.all(
    myPostedJobs.map(async (job) => {
      const acceptedQuote = job.quotes.find((q) => q.status === "accepted");
      let hasUnread = false;
      let lastMessagePreview: string | null = null;
      let bookingStatus: string | null = null;

      if (acceptedQuote) {
        const [lastMessage, readRecord, booking] = await Promise.all([
          prisma.message.findFirst({
            where: { jobRequestId: job.id, businessId: acceptedQuote.businessId },
            orderBy: { createdAt: "desc" },
          }),
          prisma.messageRead.findUnique({
            where: {
              jobRequestId_businessId_userId: {
                jobRequestId: job.id,
                businessId: acceptedQuote.businessId,
                userId,
              },
            },
          }),
          prisma.booking.findUnique({ where: { jobRequestId: job.id } }),
        ]);

        hasUnread = Boolean(
          lastMessage &&
            lastMessage.senderId !== userId &&
            (!readRecord || lastMessage.createdAt > readRecord.lastReadAt)
        );
        lastMessagePreview = lastMessage?.content ?? null;
        bookingStatus = booking?.status ?? null;
      }

      return {
        job,
        quoteCount: job.quotes.length,
        acceptedBusinessName: acceptedQuote?.business.name ?? null,
        hasUnread,
        lastMessagePreview,
        bookingStatus,
      };
    })
  );

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-blue-600 text-sm">
          &larr; Back to FindAI
        </Link>
        <Link href="/messages" className="text-blue-600 text-sm">
          Messages
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
                  {business.category.name} &middot; {business.city}
                </p>
              </Link>
            ))}
          </div>
        )}

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">
          My jobs (as provider)
        </h2>

        {myJobs.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No active jobs yet. Once a customer accepts your quote, it will show up here.
          </p>
        ) : (
          <div className="space-y-3">
            {myJobs.map(({ quote, hasUnread, lastMessagePreview, bookingStatus }) => (
              <Link
                key={quote.id}
                href={`/jobs/${quote.jobRequestId}`}
                className="block border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900">{quote.jobRequest.title}</p>
                  {hasUnread && (
                    <span className="bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                      New
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {quote.jobRequest.city} &middot; via {quote.business.name}
                </p>
                {bookingStatus && (
                  <p className="text-xs text-gray-400 mt-1 uppercase">
                    Booking: {bookingStatus}
                  </p>
                )}
                {lastMessagePreview && (
                  <p className="text-xs text-gray-400 mt-1 truncate">
                    Last message: {lastMessagePreview}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}

        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">
          My posted jobs
        </h2>

        {postedJobsWithInfo.length === 0 ? (
          <p className="text-gray-500 text-sm">
            You haven&apos;t posted any jobs yet.
          </p>
        ) : (
          <div className="space-y-3">
            {postedJobsWithInfo.map(({ job, quoteCount, acceptedBusinessName, hasUnread, lastMessagePreview, bookingStatus }) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="block border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900">{job.title}</p>
                  {hasUnread && (
                    <span className="bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                      New
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {job.city} &middot; {quoteCount} quote{quoteCount === 1 ? "" : "s"}
                  {acceptedBusinessName ? ` \u00b7 working with ${acceptedBusinessName}` : ""}
                </p>
                {bookingStatus && (
                  <p className="text-xs text-gray-400 mt-1 uppercase">
                    Booking: {bookingStatus}
                  </p>
                )}
                {lastMessagePreview && (
                  <p className="text-xs text-gray-400 mt-1 truncate">
                    Last message: {lastMessagePreview}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}