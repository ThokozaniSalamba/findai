import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { auth } from "@/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const { id: quoteId } = await params;

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { jobRequest: true },
  });

  if (!quote) {
    return NextResponse.json({ error: "Quote not found." }, { status: 404 });
  }

  if (quote.jobRequest.customerId !== session.user.id) {
    return NextResponse.json({ error: "You do not own this job." }, { status: 403 });
  }

  await prisma.$transaction([
    prisma.quote.update({ where: { id: quoteId }, data: { status: "accepted" } }),
    prisma.quote.updateMany({
      where: { jobRequestId: quote.jobRequestId, id: { not: quoteId } },
      data: { status: "rejected" },
    }),
    prisma.jobRequest.update({
      where: { id: quote.jobRequestId },
      data: { status: "accepted" },
    }),
  ]);

  return NextResponse.json({ success: true });
}
