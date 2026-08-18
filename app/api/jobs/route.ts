import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { auth } from "@/auth";

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  const body = await request.json();

  if (!body.title || !body.description || !body.categoryId || !body.city || !body.country) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const job = await prisma.jobRequest.create({
    data: {
      title: body.title,
      description: body.description,
      budget: body.budget ? parseFloat(body.budget) : null,
      addressLine: body.addressLine || null,
      city: body.city,
      region: body.region || null,
      country: body.country,
      categoryId: body.categoryId,
      customerId: session.user.id,
    },
  });

  return NextResponse.json({ success: true, job });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("category");
  const city = searchParams.get("city");

  const jobs = await prisma.jobRequest.findMany({
    where: {
      status: "open",
      ...(categoryId ? { categoryId } : {}),
      ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
    },
    include: {
      category: true,
      _count: { select: { quotes: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ jobs });
}
