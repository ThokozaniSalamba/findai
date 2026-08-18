import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }
  const userId = session.user.id;

  const [customerJobs, providerQuotes] = await Promise.all([
    prisma.jobRequest.findMany({
      where: {
        customerId: userId,
        quotes: { some: { status: "accepted" } },
      },
      include: {
        quotes: {
          where: { status: "accepted" },
          include: { business: { select: { id: true, name: true } } },
        },
      },
    }),
    prisma.quote.findMany({
      where: {
        status: "accepted",
        business: { ownerId: userId },
      },
      include: {
        jobRequest: { include: { customer: { select: { id: true, name: true, email: true } } } },
        business: { select: { id: true, name: true } },
      },
    }),
  ]);

  const conversationInputs: {
    jobRequestId: string;
    businessId: string;
    jobTitle: string;
    otherPartyName: string;
    role: "customer" | "provider";
  }[] = [];

  for (const job of customerJobs) {
    const quote = job.quotes[0];
    if (!quote) continue;
    conversationInputs.push({
      jobRequestId: job.id,
      businessId: quote.businessId,
      jobTitle: job.title,
      otherPartyName: quote.business.name,
      role: "customer",
    });
  }

  for (const quote of providerQuotes) {
    conversationInputs.push({
      jobRequestId: quote.jobRequestId,
      businessId: quote.businessId,
      jobTitle: quote.jobRequest.title,
      otherPartyName: quote.jobRequest.customer.name || quote.jobRequest.customer.email,
      role: "provider",
    });
  }

  const conversations = await Promise.all(
    conversationInputs.map(async (c) => {
      const [lastMessage, readRecord] = await Promise.all([
        prisma.message.findFirst({
          where: { jobRequestId: c.jobRequestId, businessId: c.businessId },
          orderBy: { createdAt: "desc" },
        }),
        prisma.messageRead.findUnique({
          where: {
            jobRequestId_businessId_userId: {
              jobRequestId: c.jobRequestId,
              businessId: c.businessId,
              userId,
            },
          },
        }),
      ]);

      const hasUnread = Boolean(
        lastMessage &&
          lastMessage.senderId !== userId &&
          (!readRecord || lastMessage.createdAt > readRecord.lastReadAt)
      );

      return {
        jobRequestId: c.jobRequestId,
        businessId: c.businessId,
        jobTitle: c.jobTitle,
        otherPartyName: c.otherPartyName,
        role: c.role,
        lastMessage: lastMessage?.content ?? null,
        lastMessageAt: lastMessage?.createdAt.toISOString() ?? null,
        hasUnread,
      };
    })
  );

  conversations.sort((a, b) => {
    const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return bTime - aTime;
  });

  return NextResponse.json({ conversations });
}