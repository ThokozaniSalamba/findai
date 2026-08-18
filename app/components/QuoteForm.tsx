"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  jobId: string;
  businessId: string;
  businessName: string;
};

export default function QuoteForm({ jobId, businessId, businessName }: Props) {
  const router = useRouter();
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const response = await fetch(`/api/jobs/${jobId}/quotes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId, price, message }),
    });

    setSaving(false);

    if (!response.ok) {
      setError("Could not submit quote. You may have already quoted this job.");
      return;
    }

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="border border-gray-200 rounded-lg p-4 space-y-3">
      <p className="text-sm text-gray-600">Quoting as <span className="font-medium">{businessName}</span></p>
      <div>
        <label className="text-sm font-medium text-gray-700">Your price</label>
        <input
          type="number"
          required
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm mt-1"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700">Message (optional)</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm mt-1"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-full hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? "Sending..." : "Send quote"}
      </button>
    </form>
  );
}
