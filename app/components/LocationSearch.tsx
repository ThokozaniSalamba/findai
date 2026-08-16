"use client";

import { useState, useEffect, useRef } from "react";

type SearchResult = {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
};

type Props = {
  onLocationChange: (lat: number, lng: number, label: string) => void;
};

function formatLabel(result: SearchResult): string {
  const addr = result.address;
  if (!addr) return result.display_name;

  const place = addr.city ?? addr.town ?? addr.village ?? "";
  const parts = [place, addr.state, addr.country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : result.display_name;
}

export default function LocationSearch({ onLocationChange }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (selected) return;
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&q=${encodeURIComponent(
            query
          )}`
        );
        const data = await response.json();
        setResults(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("City search failed:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, selected]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (results.length === 1) {
      handleSelect(results[0]);
    }
  }

  function handleSelect(result: SearchResult) {
    const label = formatLabel(result);
    setSelected(label);
    setQuery(label);
    setResults([]);
    onLocationChange(parseFloat(result.lat), parseFloat(result.lon), label);
  }

  return (
    <div className="relative w-full sm:w-auto">
      <form onSubmit={handleSubmit} className="flex">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(null);
          }}
          placeholder="Search any city worldwide..."
          className="border border-gray-300 rounded-full px-5 py-4 text-sm text-gray-700 w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </form>

      {loading && (
        <div className="absolute z-10 bg-white border border-gray-200 rounded-lg shadow-md mt-1 w-full px-4 py-2 text-sm text-gray-400">
          Searching...
        </div>
      )}

      {!loading && results.length > 0 && (
        <ul className="absolute z-10 bg-white border border-gray-200 rounded-lg shadow-md mt-1 w-full max-h-64 overflow-y-auto">
          {results.map((result, i) => (
            <li
              key={i}
              onClick={() => handleSelect(result)}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0"
            >
              {formatLabel(result)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}