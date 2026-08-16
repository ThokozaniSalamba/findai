"use client";

import { useState } from "react";

export default function ReportButton({ reviewId }: { reviewId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    const res = await fetch(`/api/review/${reviewId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    if (res.ok) {
      setStatus("done");
    } else {
      setStatus("idle");
    }
  }

  if (status === "done") {
    return <span className="text-xs text-gray-400">Reported</span>;
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-gray-400 hover:text-red-600"
      >
        Report
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex items-center gap-2">
      <input
        type="text"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Why are you reporting this?"
        required
        minLength={3}
        className="text-xs border rounded px-2 py-1 flex-1"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="text-xs bg-red-600 text-white px-2 py-1 rounded disabled:opacity-50"
      >
        Submit
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-xs text-gray-400"
      >
        Cancel
      </button>
    </form>
  );
}
