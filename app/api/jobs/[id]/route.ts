import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { auth } from "@/auth";

const VALID_ACTIONS = ["confirm", "complete", "cancel"];

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

  if (action === "confirm") {
    if (!isCustomer) {
      return NextResponse.json({ error: "Only the customer can confirm a booking." }, { status: 403 });
    }
    if (booking.status !== "proposed") {
      return NextResponse.json({ error: "Booking is not in a confirmable state." }, { status: 400 });
    }
    const updated = await prisma.booking.update({ where: { id }, data: { status: "confirmed" } });
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