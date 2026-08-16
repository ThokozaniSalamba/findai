"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BanButton({
  userId,
  initialBanned,
}: {
  userId: string;
  initialBanned: boolean;
}) {
  const [banned, setBanned] = useState(initialBanned);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function toggle() {
    setLoading(true);
    const res = await fetch(`/api/admin/users/${userId}/ban`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ banned: !banned }),
    });
    if (res.ok) {
      setBanned(!banned);
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`text-xs font-medium px-3 py-1 rounded ${
        banned
          ? "bg-green-100 text-green-700 hover:bg-green-200"
          : "bg-red-100 text-red-700 hover:bg-red-200"
      } disabled:opacity-50`}
    >
      {loading ? "..." : banned ? "Unban" : "Ban"}
    </button>
  );
}
