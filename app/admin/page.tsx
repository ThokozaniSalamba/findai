import { prisma } from "@/app/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const session = await auth();

  if (!session?.user || (session.user as any).role?.toLowerCase() !== "admin") {
    redirect("/");
  }

  const totalUsers = await prisma.user.count();
  const totalBusinesses = await prisma.business.count();
  const claimedBusinesses = await prisma.business.count({
    where: { ownerId: { not: null } },
  });
  const unclaimedBusinesses = totalBusinesses - claimedBusinesses;
  const pendingReports = await prisma.report.count({
    where: { status: "pending" },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="text-2xl font-bold">{totalUsers}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-500">Claimed Businesses</p>
          <p className="text-2xl font-bold">{claimedBusinesses}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-500">Unclaimed Businesses</p>
          <p className="text-2xl font-bold">{unclaimedBusinesses}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-gray-500">Pending Reports</p>
          <p className="text-2xl font-bold">{pendingReports}</p>
        </div>
      </div>

      <div className="flex gap-4">
        <Link
          href="/admin/users"
          className="border rounded-lg px-4 py-2 hover:bg-gray-50"
        >
          Manage Users →
        </Link>
        <Link
          href="/admin/businesses"
          className="border rounded-lg px-4 py-2 hover:bg-gray-50"
        >
          Manage Businesses →
        </Link>
        <Link
          href="/admin/reports"
          className="border rounded-lg px-4 py-2 hover:bg-gray-50"
        >
          Reported Reviews →
        </Link>
      </div>
    </div>
  );
}