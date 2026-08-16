"use client";

import { useState } from "react";

type Props = {
  destLat: number;
  destLng: number;
};

export default function DirectionsInfo({ destLat, destLng }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ distanceKm: number; durationMin: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleGetDirections() {
    if (!navigator.geolocation) {
      setError("Location isn't available in this browser.");
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        try {
          const res = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${destLng},${destLat}?overview=false`
          );
          const data = await res.json();

          if (data.routes && data.routes[0]) {
            const route = data.routes[0];
            setResult({
              distanceKm: route.distance / 1000,
              durationMin: route.duration / 60,
            });
          } else {
            setError("Couldn't calculate a route to this business.");
          }
        } catch (err) {
          console.error("Routing failed:", err);
          setError("Couldn't calculate a route to this business.");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError("Allow location access to see driving distance and time.");
        setLoading(false);
      }
    );
  }

  return (
    <div className="mt-2">
      {!result && (
        <button
          onClick={handleGetDirections}
          disabled={loading}
          className="text-sm text-blue-600 hover:underline disabled:opacity-50"
        >
          {loading ? "Calculating..." : "Show driving distance & time"}
        </button>
      )}
      {result && (
        <p className="text-sm text-gray-700">
          🚗 {result.distanceKm.toFixed(1)} km · about {Math.round(result.durationMin)} min drive
        </p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}