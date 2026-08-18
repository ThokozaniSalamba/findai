"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  quoteId: string;
};

export default function AcceptQuoteButton({ quoteId }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleAccept() {
    setSaving(true);
    await fetch(`/api/quotes/${quoteId}`, { method: "PATCH" });
    setSaving(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleAccept}
      disabled={saving}
      className="bg-green-600 text-white text-xs font-medium px-4 py-2 rounded-full hover:bg-green-700 disabled:opacity-50"
    >
      {saving ? "Accepting..." : "Accept quote"}
    </button>
  );
}
