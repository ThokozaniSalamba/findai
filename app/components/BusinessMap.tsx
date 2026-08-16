"use client";

import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useState, useRef } from "react";

// Fix Leaflet's default marker icons, which don't load correctly in Next.js by default
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/[email protected]/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/[email protected]/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/[email protected]/dist/images/marker-shadow.png",
});

type Business = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  category: { name: string };
};

type Props = {
  businesses: Business[];
  centerLat: number;
  centerLng: number;
  onSearchThisArea?: (lat: number, lng: number) => void;
};

function MapMoveWatcher({ onMoved }: { onMoved: (lat: number, lng: number) => void }) {
  useMapEvents({
    moveend: (e) => {
      const center = e.target.getCenter();
      onMoved(center.lat, center.lng);
    },
  });
  return null;
}

export default function BusinessMap({
  businesses,
  centerLat,
  centerLng,
  onSearchThisArea,
}: Props) {
  const [showSearchButton, setShowSearchButton] = useState(false);
  const pendingCenter = useRef<{ lat: number; lng: number } | null>(null);
  const isFirstMove = useRef(true);

  function handleMoved(lat: number, lng: number) {
    // Ignore the very first moveend fired right when the map loads
    if (isFirstMove.current) {
      isFirstMove.current = false;
      return;
    }
    pendingCenter.current = { lat, lng };
    setShowSearchButton(true);
  }

  function handleSearchThisArea() {
    if (pendingCenter.current && onSearchThisArea) {
      onSearchThisArea(pendingCenter.current.lat, pendingCenter.current.lng);
    }
    setShowSearchButton(false);
  }

  return (
    <div className="relative h-[400px] w-full">
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={12}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%", borderRadius: "0.75rem" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapMoveWatcher onMoved={handleMoved} />
        <MarkerClusterGroup chunkedLoading>
          {businesses.map((business) => (
            <Marker key={business.id} position={[business.latitude, business.longitude]}>
              <Popup>
                <strong>{business.name}</strong>
                <br />
                {business.category.name}
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      {showSearchButton && (
        <button
          onClick={handleSearchThisArea}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] rounded-full bg-atlas text-paper text-sm font-semibold px-5 py-2 shadow-lg hover:bg-atlas/90 transition-colors"
        >
          Search this area
        </button>
      )}
    </div>
  );
}