"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  businessId: string;
};

export default function ClaimButton({ businessId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClaim() {
    setLoading(true);
    setError(null);

    const response = await fetch(`/api/business/${businessId}/claim`, {
      method: "POST",
    });

    setLoading(false);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error || "Something went wrong.");
      return;
    }

    router.refresh();
  }

  return (
    <div>
      <button
        onClick={handleClaim}
        disabled={loading}
        className="inline-block bg-gray-900 text-white text-sm font-medium px-6 py-3 rounded-full hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? "Claiming..." : "Claim this business"}
      </button>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}