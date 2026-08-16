import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { auth } from "@/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user as any).role?.toLowerCase() !== "admin") {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const { id } = await params;
  const { banned } = await request.json();

  const updated = await prisma.user.update({
    where: { id },
    data: { banned: Boolean(banned) },
  });

  return NextResponse.json({ success: true, banned: updated.banned });
}
