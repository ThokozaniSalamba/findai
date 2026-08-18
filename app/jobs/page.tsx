import Link from "next/link";
import { prisma } from "@/app/lib/prisma";

type SearchParams = Promise<{ category?: string; city?: string }>;

export default async function JobsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  const jobs = await prisma.jobRequest.findMany({
    where: {
      status: "open",
      ...(params.category ? { categoryId: params.category } : {}),
      ...(params.city ? { city: { contains: params.city, mode: "insensitive" } } : {}),
    },
    include: {
      category: true,
      _count: { select: { quotes: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Open jobs</h1>
        <Link
          href="/post-job"
          className="bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-full hover:bg-blue-700"
        >
          Post a job
        </Link>
      </div>

      <form className="flex gap-3 mb-6" method="get">
        <select name="category" defaultValue={params.category ?? ""} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="city"
          defaultValue={params.city ?? ""}
          placeholder="City"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        <button type="submit" className="bg-gray-800 text-white text-sm px-4 py-2 rounded-lg">
          Filter
        </button>
      </form>

      <div className="space-y-3">
        {jobs.length === 0 && <p className="text-sm text-gray-500">No open jobs match your filters.</p>}
        {jobs.map((job) => (
          <Link
            key={job.id}
            href={`/jobs/${job.id}`}
            className="block border border-gray-200 rounded-lg p-4 hover:border-blue-400"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-gray-900">{job.title}</h2>
              {job.budget && <span className="text-sm text-gray-600">Budget: {job.budget}</span>}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {job.category.name} · {job.city} · {job._count.quotes} quote{job._count.quotes === 1 ? "" : "s"}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
