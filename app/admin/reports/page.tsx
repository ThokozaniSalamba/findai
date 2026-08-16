import { prisma } from "@/app/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import ReportActions from "@/app/components/ReportActions";

export default async function AdminReportsPage() {
  const session = await auth();

  if (!session?.user || (session.user as any).role?.toLowerCase() !== "admin") {
    redirect("/");
  }

  const reports = await prisma.report.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "desc" },
    include: {
      review: {
        include: {
          user: { select: { name: true, email: true } },
          business: { select: { id: true, name: true } },
        },
      },
      reporter: { select: { name: true, email: true } },
    },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Reported Reviews</h1>
        <Link href="/admin" className="text-blue-600 hover:underline">
          ? Back to Admin Dashboard
        </Link>
      </div>

      {reports.length === 0 ? (
        <p className="text-gray-500">No pending reports.</p>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report.id} className="border rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-2">
                On <strong>{report.review.business.name}</strong> · reported by{" "}
                {report.reporter.name || report.reporter.email}
              </p>
              <p className="text-sm font-medium text-red-700 mb-2">
                Reason: {report.reason}
              </p>
              <div className="bg-gray-50 rounded p-3 mb-3">
                <p className="text-sm text-gray-700">
                  {"?".repeat(report.review.rating)} —{" "}
                  {report.review.user.name || report.review.user.email}
                </p>
                {report.review.comment && (
                  <p className="text-sm text-gray-600 mt-1">{report.review.comment}</p>
                )}
              </div>
              <ReportActions reportId={report.id} reviewId={report.review.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
