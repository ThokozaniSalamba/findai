import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { auth } from "@/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user || (session.user as { role?: string }).role?.toLowerCase() !== "admin") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();

  const business = await prisma.business.update({
    where: { id },
    data: { verified: Boolean(body.verified) },
  });

  return NextResponse.json(business);
}