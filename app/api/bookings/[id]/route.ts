import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { auth } from "@/auth";

const VALID_ACTIONS = ["confirm", "complete", "cancel", "counter"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const action = body.action;

  if (!VALID_ACTIONS.includes(action)) {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { jobRequest: true, business: true },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  const isCustomer = booking.jobRequest.customerId === session.user.id;
  const isProvider = booking.business.ownerId === session.user.id;

  if (!isCustomer && !isProvider) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const isMyTurn =
    (isCustomer && booking.proposedBy === "provider") ||
    (isProvider && booking.proposedBy === "customer");

  if (action === "confirm") {
    if (booking.status !== "proposed") {
      return NextResponse.json({ error: "Booking is not in a confirmable state." }, { status: 400 });
    }
    if (!isMyTurn) {
      return NextResponse.json({ error: "Waiting for the other party to respond." }, { status: 403 });
    }
    const updated = await prisma.booking.update({ where: { id }, data: { status: "confirmed" } });
    return NextResponse.json({ success: true, booking: updated });
  }

  if (action === "counter") {
    if (booking.status !== "proposed") {
      return NextResponse.json({ error: "Booking is not in a state that can be countered." }, { status: 400 });
    }
    if (!isMyTurn) {
      return NextResponse.json({ error: "Waiting for the other party to respond." }, { status: 403 });
    }
    if (!body.proposedDate) {
      return NextResponse.json({ error: "Missing proposed date." }, { status: 400 });
    }
    const updated = await prisma.booking.update({
      where: { id },
      data: {
        proposedDate: new Date(body.proposedDate),
        notes: body.notes || null,
        proposedBy: isCustomer ? "customer" : "provider",
      },
    });
    return NextResponse.json({ success: true, booking: updated });
  }

  if (action === "complete") {
    if (booking.status !== "confirmed") {
      return NextResponse.json({ error: "Booking must be confirmed before it can be completed." }, { status: 400 });
    }
    const updated = await prisma.booking.update({ where: { id }, data: { status: "completed" } });
    return NextResponse.json({ success: true, booking: updated });
  }

  if (action === "cancel") {
    if (booking.status === "completed") {
      return NextResponse.json({ error: "A completed booking cannot be cancelled." }, { status: 400 });
    }
    const updated = await prisma.booking.update({ where: { id }, data: { status: "cancelled" } });
    return NextResponse.json({ success: true, booking: updated });
  }

  return NextResponse.json({ error: "Unhandled action." }, { status: 400 });
}