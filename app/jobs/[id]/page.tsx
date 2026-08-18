import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import QuoteForm from "@/app/components/QuoteForm";
import AcceptQuoteButton from "@/app/components/AcceptQuoteButton";
import MessageThread from "@/app/components/MessageThread";
import BookingPanel from "@/app/components/BookingPanel";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const job = await prisma.jobRequest.findUnique({
    where: { id },
    include: {
      category: true,
      customer: { select: { id: true, name: true } },
      quotes: {
        include: { business: { select: { id: true, name: true, ownerId: true } } },
        orderBy: { createdAt: "asc" },
      },
      booking: true,
    },
  });

  if (!job) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-10">
        <p className="text-gray-600">Job not found.</p>
      </main>
    );
  }

  const isCustomer = session?.user?.id === job.customerId;
  const acceptedQuote = job.quotes.find((q) => q.status === "accepted");

  let myBusinesses: { id: string; name: string }[] = [];
  if (session?.user?.id && !isCustomer) {
    const owned = await prisma.business.findMany({
      where: { ownerId: session.user.id },
      select: { id: true, name: true },
    });
    const alreadyQuotedIds = new Set(job.quotes.map((q) => q.businessId));
    myBusinesses = owned.filter((b) => !alreadyQuotedIds.has(b.id));
  }

  const myAcceptedQuote = job.quotes.find(
    (q) => q.status === "accepted" && q.business.ownerId === session?.user?.id
  );
  const isAcceptedProvider = Boolean(myAcceptedQuote);

  const chatBusinessId = acceptedQuote?.businessId || myAcceptedQuote?.businessId;
  let hasUnreadMessages = false;

  if (chatBusinessId && session?.user?.id) {
    const [lastMessage, readRecord] = await Promise.all([
      prisma.message.findFirst({
        where: { jobRequestId: job.id, businessId: chatBusinessId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.messageRead.findUnique({
        where: {
          jobRequestId_businessId_userId: {
            jobRequestId: job.id,
            businessId: chatBusinessId,
            userId: session.user.id,
          },
        },
      }),
    ]);

    if (
      lastMessage &&
      lastMessage.senderId !== session.user.id &&
      (!readRecord || lastMessage.createdAt > readRecord.lastReadAt)
    ) {
      hasUnreadMessages = true;
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
      <p className="text-sm text-gray-500 mt-1">
        {job.category.name} · {job.city}
        {job.region ? `, ${job.region}` : ""} · {job.country}
      </p>
      {job.budget && <p className="text-sm text-gray-600 mt-1">Budget: {job.budget}</p>}
      <p className="text-gray-800 mt-4 whitespace-pre-wrap">{job.description}</p>

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Quotes ({job.quotes.length})
        </h2>

        {isCustomer && job.quotes.length === 0 && (
          <p className="text-sm text-gray-500">No quotes yet.</p>
        )}

        <div className="space-y-3">
          {job.quotes.map((q) => (
            <div key={q.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{q.business.name}</p>
                <p className="text-sm text-gray-600">Price: {q.price}</p>
                {q.message && <p className="text-sm text-gray-500 mt-1">{q.message}</p>}
                <p className="text-xs text-gray-400 mt-1 uppercase">{q.status}</p>
              </div>
              {isCustomer && q.status === "pending" && job.status === "open" && (
                <AcceptQuoteButton quoteId={q.id} />
              )}
            </div>
          ))}
        </div>
      </div>

      {!isCustomer && myBusinesses.length > 0 && job.status === "open" && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Send a quote</h2>
          <div className="space-y-3">
            {myBusinesses.map((b) => (
              <QuoteForm key={b.id} jobId={job.id} businessId={b.id} businessName={b.name} />
            ))}
          </div>
        </div>
      )}

      {(isCustomer && acceptedQuote) || isAcceptedProvider ? (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Booking</h2>
          <BookingPanel
            jobId={job.id}
            booking={
              job.booking
                ? {
                    id: job.booking.id,
                    proposedDate: job.booking.proposedDate.toISOString(),
                    status: job.booking.status,
                    notes: job.booking.notes,
                    proposedBy: job.booking.proposedBy,
                  }
                : null
            }
            isCustomer={isCustomer}
            isProvider={isAcceptedProvider}
          />
        </div>
      ) : null}

      {isCustomer && acceptedQuote && session?.user?.id && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            Chat with {acceptedQuote.business.name}
            {hasUnreadMessages && (
              <span className="bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                New
              </span>
            )}
          </h2>
          <MessageThread
            jobId={job.id}
            businessId={acceptedQuote.businessId}
            currentUserId={session.user.id}
          />
        </div>
      )}

      {myAcceptedQuote && session?.user?.id && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            Chat with customer
            {hasUnreadMessages && (
              <span className="bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                New
              </span>
            )}
          </h2>
          <MessageThread
            jobId={job.id}
            businessId={myAcceptedQuote.businessId}
            currentUserId={session.user.id}
          />
        </div>
      )}
    </main>
  );
}