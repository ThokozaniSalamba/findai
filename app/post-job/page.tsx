import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import PostJobForm from "@/app/components/PostJobForm";

export default async function PostJobPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Post a job</h1>
      <PostJobForm categories={categories} />
    </main>
  );
}
