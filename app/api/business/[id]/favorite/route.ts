import { prisma } from "@/app/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  await prisma.favorite.upsert({
    where: {
      userId_businessId: {
        userId: (session.user as any).id,
        businessId: id,
      },
    },
    update: {},
    create: {
      userId: (session.user as any).id,
      businessId: id,
    },
  });

  return NextResponse.json({ favorited: true });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  await prisma.favorite.deleteMany({
    where: {
      userId: (session.user as any).id,
      businessId: id,
    },
  });

  return NextResponse.json({ favorited: false });
}