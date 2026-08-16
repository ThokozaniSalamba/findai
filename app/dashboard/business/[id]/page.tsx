import { prisma } from "@/app/lib/prisma";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import EditBusinessForm from "@/app/components/EditBusinessForm";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditBusinessPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const business = await prisma.business.findUnique({
    where: { id },
  });

  if (!business) {
    notFound();
  }

  if (business.ownerId !== session.user.id) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-gray-200 px-6 py-4">
        <Link href="/dashboard" className="text-blue-600 text-sm">
          ← Back to dashboard
        </Link>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Edit {business.name}
          </h1>

          <Link
            href={`/dashboard/business/${id}/analytics`}
            className="inline-block bg-gray-900 text-white text-sm font-medium px-5 py-2.5 rounded-full hover:bg-gray-800"
          >
            View Analytics
          </Link>
        </div>

        <EditBusinessForm business={business} />
      </div>
    </main>
  );
}