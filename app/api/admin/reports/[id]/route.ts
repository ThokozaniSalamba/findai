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
  const { action } = await request.json();

  if (action === "dismiss") {
    await prisma.report.update({
      where: { id },
      data: { status: "dismissed" },
    });
  } else if (action === "delete") {
    const report = await prisma.report.findUnique({ where: { id } });
    if (report) {
      await prisma.review.delete({ where: { id: report.reviewId } });
    }
    await prisma.report.update({
      where: { id },
      data: { status: "resolved" },
    });
  } else {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
