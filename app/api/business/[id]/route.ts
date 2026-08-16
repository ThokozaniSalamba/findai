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

  const { id } = await params;

  const business = await prisma.business.findUnique({ where: { id } });

  if (!business) {
    return NextResponse.json({ error: "Business not found." }, { status: 404 });
  }

  if (business.ownerId !== session.user.id) {
    return NextResponse.json({ error: "You do not own this business." }, { status: 403 });
  }

  const body = await request.json();

  const updated = await prisma.business.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description || null,
      phone: body.phone || null,
      website: body.website || null,
      addressLine: body.addressLine,
      city: body.city,
      region: body.region || null,
      postalCode: body.postalCode || null,
      country: body.country,
      priceRange: body.priceRange || null,
      openingHours: body.openingHours || null,
    },
  });

  return NextResponse.json({ success: true, business: updated });
}