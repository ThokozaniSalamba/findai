import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { auth } from "@/auth";

async function checkAccess(jobRequestId: string, businessId: string, userId: string) {
  const job = await prisma.jobRequest.findUnique({ where: { id: jobRequestId } });
  const business = await prisma.business.findUnique({ where: { id: businessId } });

  if (!job || !business) return false;

  const isCustomer = job.customerId === userId;
  const isProvider = business.ownerId === userId;

  if (!isCustomer && !isProvider) return false;

  const quote = await prisma.quote.findUnique({
    where: { jobRequestId_businessId: { jobRequestId, businessId } },
  });

  return quote?.status === "accepted";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const { id: jobRequestId } = await params;
  const businessId = request.nextUrl.searchParams.get("businessId");

  if (!businessId) {
    return NextResponse.json({ error: "Missing businessId." }, { status: 400 });
  }

  const allowed = await checkAccess(jobRequestId, businessId, session.user.id);
  if (!allowed) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const messages = await prisma.message.findMany({
    where: { jobRequestId, businessId },
    orderBy: { createdAt: "asc" },
  });

  await prisma.messageRead.upsert({
    where: {
      jobRequestId_businessId_userId: {
        jobRequestId,
        businessId,
        userId: session.user.id,
      },
    },
    update: { lastReadAt: new Date() },
    create: {
      jobRequestId,
      businessId,
      userId: session.user.id,
    },
  });

  return NextResponse.json({ messages });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const { id: jobRequestId } = await params;
  const body = await request.json();

  if (!body.businessId || !body.content) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const allowed = await checkAccess(jobRequestId, body.businessId, session.user.id);
  if (!allowed) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const message = await prisma.message.create({
    data: {
      jobRequestId,
      businessId: body.businessId,
      senderId: session.user.id,
      content: body.content,
    },
  });

  return NextResponse.json({ success: true, message });
}