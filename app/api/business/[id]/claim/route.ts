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

  const { id } = await params;

  const business = await prisma.business.findUnique({ where: { id } });

  if (!business) {
    return NextResponse.json({ error: "Business not found." }, { status: 404 });
  }

  if (business.ownerId) {
    return NextResponse.json({ error: "This business is already claimed." }, { status: 409 });
  }

  const updated = await prisma.business.update({
    where: { id },
    data: { ownerId: session.user.id },
  });

  return NextResponse.json({ success: true, businessId: updated.id });
}