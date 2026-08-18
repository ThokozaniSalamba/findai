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

  if (!body.businessId || !body.price) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const business = await prisma.business.findUnique({ where: { id: body.businessId } });

  if (!business || business.ownerId !== session.user.id) {
    return NextResponse.json({ error: "You do not own this business." }, { status: 403 });
  }

  const job = await prisma.jobRequest.findUnique({ where: { id: jobRequestId } });

  if (!job || job.status !== "open") {
    return NextResponse.json({ error: "This job is no longer open." }, { status: 400 });
  }

  try {
    const quote = await prisma.quote.create({
      data: {
        jobRequestId,
        businessId: body.businessId,
        price: parseFloat(body.price),
        message: body.message || null,
      },
    });
    return NextResponse.json({ success: true, quote });
  } catch {
    return NextResponse.json(
      { error: "You have already submitted a quote for this job." },
      { status: 409 }
    );
  }
}
