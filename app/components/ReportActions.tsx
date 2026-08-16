"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReportActions({
  reportId,
  reviewId,
}: {
  reportId: string;
  reviewId: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleAction(action: "dismiss" | "delete") {
    setLoading(true);
    const res = await fetch(`/api/admin/reports/${reportId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleAction("dismiss")}
        disabled={loading}
        className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200 disabled:opacity-50"
      >
        Dismiss report
      </button>
      <button
        onClick={() => handleAction("delete")}
        disabled={loading}
        className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 disabled:opacity-50"
      >
        Delete review
      </button>
    </div>
  );
}
