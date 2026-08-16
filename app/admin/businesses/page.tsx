import { prisma } from "@/app/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";

export default async function AdminBusinessesPage() {
  const session = await auth();

  if (!session?.user || (session.user as any).role?.toLowerCase() !== "admin") {
    redirect("/");
  }

  const businesses = await prisma.business.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      category: { select: { name: true } },
      ownerId: true,
      verified: true,
      createdAt: true,
    },
  });

  async function toggleVerified(formData: FormData) {
    "use server";
    const { auth } = await import("@/auth");
    const { prisma } = await import("@/app/lib/prisma");

    const adminSession = await auth();
    if (!adminSession?.user || (adminSession.user as any).role?.toLowerCase() !== "admin") {
      return;
    }

    const businessId = formData.get("businessId") as string;
    const currentlyVerified = formData.get("currentlyVerified") === "true";

    await prisma.business.update({
      where: { id: businessId },
      data: { verified: !currentlyVerified },
    });

    revalidatePath("/admin/businesses");
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Manage Businesses</h1>
        <Link href="/admin" className="text-blue-600 hover:underline">
          ← Back to Admin Dashboard
        </Link>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Verified</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Added</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">View</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {businesses.map((business) => (
              <tr key={business.id}>
                <td className="px-4 py-3 text-sm text-gray-900">{business.name}</td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {business.category?.name || "—"}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      business.ownerId
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {business.ownerId ? "Claimed" : "Unclaimed"}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <form action={toggleVerified} className="flex items-center gap-2">
                    <input type="hidden" name="businessId" value={business.id} />
                    <input
                      type="hidden"
                      name="currentlyVerified"
                      value={String(business.verified)}
                    />
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        business.verified
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {business.verified ? "✓ Verified" : "Not verified"}
                    </span>
                    <button
                      type="submit"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {business.verified ? "Unverify" : "Verify"}
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {new Date(business.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-sm">
                  <Link
                    href={`/business/${business.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}