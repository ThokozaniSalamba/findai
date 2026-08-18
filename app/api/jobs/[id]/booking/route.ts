import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { auth } from "@/auth";

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

  if (!body.proposedDate) {
    return NextResponse.json({ error: "Missing proposed date." }, { status: 400 });
  }

  const job = await prisma.jobRequest.findUnique({ where: { id: jobRequestId } });

  if (!job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  if (job.customerId !== session.user.id) {
    return NextResponse.json({ error: "Only the customer can propose the first booking time." }, { status: 403 });
  }

  const acceptedQuote = await prisma.quote.findFirst({
    where: { jobRequestId, status: "accepted" },
  });

  if (!acceptedQuote) {
    return NextResponse.json({ error: "No accepted quote for this job." }, { status: 400 });
  }

  const existing = await prisma.booking.findUnique({ where: { jobRequestId } });

  if (existing) {
    return NextResponse.json({ error: "A booking already exists for this job." }, { status: 409 });
  }

  const booking = await prisma.booking.create({
    data: {
      jobRequestId,
      businessId: acceptedQuote.businessId,
      proposedDate: new Date(body.proposedDate),
      notes: body.notes || null,
      proposedBy: "customer",
    },
  });

  return NextResponse.json({ success: true, booking });
}