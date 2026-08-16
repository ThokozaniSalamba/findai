"use client";

import { useState } from "react";

export default function FavoriteButton({
  businessId,
  initialFavorited,
}: {
  businessId: string;
  initialFavorited: boolean;
}) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);

  const toggleFavorite = async () => {
    setLoading(true);
    const res = await fetch(`/api/business/${businessId}/favorite`, {
      method: favorited ? "DELETE" : "POST",
    });
    if (res.ok) {
      setFavorited(!favorited);
    }
    setLoading(false);
  };

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className={`inline-block text-sm font-medium px-6 py-3 rounded-full border ${
        favorited
          ? "bg-red-50 border-red-300 text-red-600 hover:bg-red-100"
          : "border-gray-300 text-gray-700 hover:bg-gray-50"
      }`}
    >
      {favorited ? "♥ Saved" : "♡ Save"}
    </button>
  );
}