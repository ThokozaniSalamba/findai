"use client";

import { useState } from "react";

type Props = {
  onLocationChange: (lat: number, lng: number, label: string) => void;
};

export default function LocationButton({ onLocationChange }: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "granted" | "denied">("idle");

  function handleDetectLocation() {
    if (!navigator.geolocation) {
      setStatus("denied");
      return;
    }

    setStatus("loading");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setStatus("granted");
        onLocationChange(lat, lng, `${lat.toFixed(3)}, ${lng.toFixed(3)}`);
      },
      () => {
        setStatus("denied");
      }
    );
  }

  return (
    <button
      onClick={handleDetectLocation}
      className="border border-gray-300 rounded-full px-5 py-4 text-gray-600 text-sm hover:bg-gray-50 whitespace-nowrap"
    >
      {status === "idle" && "📍 Use my location"}
      {status === "loading" && "📍 Detecting..."}
      {status === "granted" && "📍 Location set"}
      {status === "denied" && "📍 Location unavailable"}
    </button>
  );
}