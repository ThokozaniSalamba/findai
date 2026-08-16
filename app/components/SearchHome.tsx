"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import LocationButton from "./LocationButton";
import LocationSearch from "./LocationSearch";

const BusinessMap = dynamic(() => import("./BusinessMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full rounded-xl bg-atlas/5 flex items-center justify-center text-sm text-atlas/40 font-mono">
      Loading map...
    </div>
  ),
});

type Category = {
  id: string;
  name: string;
};

type Business = {
  id: string;
  name: string;
  city: string;
  latitude: number;
  longitude: number;
  distanceKm?: number;
  priceRange?: string | null;
  verified?: boolean;
  category: { name: string };
};

type Props = {
  categories: Category[];
  initialBusinesses: Business[];
  trendingBusinesses: Business[];
};

const DEFAULT_LAT = -24.6282;
const DEFAULT_LNG = 25.9231;

const RADIUS_OPTIONS = [
  { label: "Any distance", value: "" },
  { label: "Within 5 km", value: "5" },
  { label: "Within 10 km", value: "10" },
  { label: "Within 25 km", value: "25" },
  { label: "Within 50 km", value: "50" },
];

const PRICE_OPTIONS = [
  { label: "Any price", value: "" },
  { label: "$ Budget", value: "$" },
  { label: "$$ Moderate", value: "$$" },
  { label: "$$$ Premium", value: "$$$" },
];

const CHEAP_WORDS = ["cheap", "budget", "affordable", "inexpensive", "low cost", "low-cost"];
const MID_WORDS = ["moderate", "mid-range", "mid range", "reasonable", "average price"];
const PREMIUM_WORDS = ["expensive", "premium", "luxury", "upscale", "high end", "high-end"];
const OPEN_NOW_PATTERNS = ["open now", "right now", "currently open", "open right now"];
const NEAR_ME_PATTERNS = ["near me", "nearby", "close to me", "around me"];

// Extra trigger words per category, keyed by lowercase category name.
// Lets "food" match "Restaurants", "fix a leak" match "Plumbers", etc.
const CATEGORY_SYNONYMS: Record<string, string[]> = {
  restaurants: ["food", "eat", "dinner", "lunch", "breakfast", "meal", "dining"],
  hotels: ["stay", "sleep", "accommodation", "lodging", "room"],
  plumbers: ["plumbing", "leak", "pipe", "drain", "burst pipe"],
  dentists: ["teeth", "dental", "toothache", "tooth"],
};

function matchCategory(lower: string, categories: Category[]): Category | undefined {
  return categories.find((c) => {
    const name = c.name.toLowerCase();
    if (lower.includes(name)) return true;
    const synonyms = CATEGORY_SYNONYMS[name] ?? [];
    return synonyms.some((word) => lower.includes(word));
  });
}

export default function SearchHome({ categories, initialBusinesses, trendingBusinesses }: Props) {
  const [query, setQuery] = useState("");
  const [understood, setUnderstood] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>(initialBusinesses);
  const [loading, setLoading] = useState(false);

  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [radius, setRadius] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [openNow, setOpenNow] = useState(false);

  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);

  async function fetchBusinesses(overrides: {
    categoryId?: string;
    radius?: string;
    priceRange?: string;
    openNow?: boolean;
    lat?: number | null;
    lng?: number | null;
  } = {}) {
    setLoading(true);

    const params = new URLSearchParams();

    const category = overrides.categoryId ?? selectedCategoryId;
    const rad = overrides.radius ?? radius;
    const price = overrides.priceRange ?? priceRange;
    const open = overrides.openNow ?? openNow;
    const lat = overrides.lat !== undefined ? overrides.lat : userLat;
    const lng = overrides.lng !== undefined ? overrides.lng : userLng;

    if (category) params.set("categoryId", category);
    if (rad) params.set("radiusKm", rad);
    if (price) params.set("priceRange", price);
    if (open) params.set("openNow", "true");
    if (lat !== null && lat !== undefined) params.set("lat", String(lat));
    if (lng !== null && lng !== undefined) params.set("lng", String(lng));

    try {
      const res = await fetch(`/api/businesses?${params.toString()}`);
      const data = await res.json();
      setBusinesses(Array.isArray(data) ? data : data.businesses ?? []);
    } catch (err) {
      console.error("Failed to fetch businesses:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleLocationChange(lat: number, lng: number, label: string) {
    setUserLat(lat);
    setUserLng(lng);
    fetchBusinesses({ lat, lng });
  }

  function handleSearchThisArea(lat: number, lng: number) {
    setUserLat(lat);
    setUserLng(lng);
    fetchBusinesses({ lat, lng });
  }

  function handleCategoryClick(categoryId: string) {
    const next = selectedCategoryId === categoryId ? "" : categoryId;
    setSelectedCategoryId(next);
    fetchBusinesses({ categoryId: next });
  }

  function handleRadiusChange(value: string) {
    setRadius(value);
    fetchBusinesses({ radius: value });
  }

  function handlePriceChange(value: string) {
    setPriceRange(value);
    fetchBusinesses({ priceRange: value });
  }

  function handleOpenNowToggle() {
    const next = !openNow;
    setOpenNow(next);
    fetchBusinesses({ openNow: next });
  }async function handleSearch(e: React.FormEvent) {
    e.preventDefault();

    const lower = query.toLowerCase();
    const understoodParts: string[] = [];

    // 1. Category detection (now includes synonyms like "food" -> Restaurants)
    let matchedCategoryId = "";
    const matchedCategory = matchCategory(lower, categories);
    if (matchedCategory) {
      matchedCategoryId = matchedCategory.id;
      understoodParts.push(matchedCategory.name);
    }

    // 2. Price word detection
    let matchedPrice = "";
    if (CHEAP_WORDS.some((w) => lower.includes(w))) {
      matchedPrice = "$";
      understoodParts.push("budget-friendly");
    } else if (MID_WORDS.some((w) => lower.includes(w))) {
      matchedPrice = "$$";
      understoodParts.push("moderate price");
    } else if (PREMIUM_WORDS.some((w) => lower.includes(w))) {
      matchedPrice = "$$$";
      understoodParts.push("premium");
    }

    // 3. Open now detection
    const matchedOpenNow = OPEN_NOW_PATTERNS.some((p) => lower.includes(p));
    if (matchedOpenNow) understoodParts.push("open now");

    // 4. "near me" detection -> use device geolocation
    const matchedNearMe = NEAR_ME_PATTERNS.some((p) => lower.includes(p));

    // 5. "in <city>" detection -> geocode via Nominatim
    const cityMatch = lower.match(/\bin\s+([a-z\s]+)$/i);
    let geocodedLat: number | null = null;
    let geocodedLng: number | null = null;

    if (cityMatch && cityMatch[1]) {
      const cityName = cityMatch[1].trim();
      understoodParts.push(`in ${cityName}`);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            cityName
          )}`
        );
        const results = await res.json();
        if (results && results[0]) {
          geocodedLat = parseFloat(results[0].lat);
          geocodedLng = parseFloat(results[0].lon);
        }
      } catch (err) {
        console.error("Geocoding failed:", err);
      }
    }

    setSelectedCategoryId(matchedCategoryId);
    setPriceRange(matchedPrice);
    setOpenNow(matchedOpenNow);
    setUnderstood(understoodParts.length > 0 ? understoodParts.join(" · ") : null);

    if (matchedNearMe && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLat(lat);
          setUserLng(lng);
          fetchBusinesses({
            categoryId: matchedCategoryId,
            priceRange: matchedPrice,
            openNow: matchedOpenNow,
            lat,
            lng,
          });
        },
        () => {
          fetchBusinesses({
            categoryId: matchedCategoryId,
            priceRange: matchedPrice,
            openNow: matchedOpenNow,
          });
        }
      );
    } else if (geocodedLat !== null && geocodedLng !== null) {
      setUserLat(geocodedLat);
      setUserLng(geocodedLng);
      fetchBusinesses({
        categoryId: matchedCategoryId,
        priceRange: matchedPrice,
        openNow: matchedOpenNow,
        lat: geocodedLat,
        lng: geocodedLng,
      });
    } else {
      fetchBusinesses({
        categoryId: matchedCategoryId,
        priceRange: matchedPrice,
        openNow: matchedOpenNow,
      });
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4">
      {/* AI Search Box — floats above the hero */}
      <form
        onSubmit={handleSearch}
        className="mb-6 rounded-2xl bg-paper shadow-xl shadow-atlas/20 border border-atlas/10 p-3"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try: cheap food open now near me"
            className="flex-1 rounded-xl border border-atlas/15 px-4 py-3 text-sm text-atlas placeholder:text-atlas/40 focus:outline-none focus:ring-2 focus:ring-brass"
          />
          <button
            type="submit"
            className="rounded-xl bg-coral px-6 py-3 text-sm font-semibold text-paper hover:bg-coral/90 transition-colors"
          >
            Search
          </button>
        </div>
        {understood && (
          <p className="mt-3 px-1 font-mono text-xs text-atlas/50">
            Understood: {understood}
          </p>
        )}
      </form>

      {/* Location controls */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <LocationButton onLocationChange={handleLocationChange} />
        <LocationSearch onLocationChange={handleLocationChange} />
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryClick(cat.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-colors ${
              selectedCategoryId === cat.id
                ? "bg-atlas text-paper border-atlas"
                : "bg-paper text-atlas/70 border-atlas/15 hover:border-brass hover:text-atlas"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Filter row: radius, price, open now */}
      <div className="flex flex-wrap items-center gap-3 mb-10">
        <select
          value={radius}
          onChange={(e) => handleRadiusChange(e.target.value)}
          className="rounded-lg border border-atlas/15 bg-paper px-3 py-1.5 text-sm text-atlas"
        >
          {RADIUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={priceRange}
          onChange={(e) => handlePriceChange(e.target.value)}
          className="rounded-lg border border-atlas/15 bg-paper px-3 py-1.5 text-sm text-atlas"
        >
          {PRICE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <button
          onClick={handleOpenNowToggle}
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
            openNow
              ? "bg-sage text-paper"
              : "bg-paper text-atlas/70 border border-atlas/15 hover:border-sage"
          }`}
        >
          ● Open now
        </button>
      </div>

      {/* Map */}
      <div className="mb-12 rounded-2xl overflow-hidden border border-atlas/10 shadow-sm">
        <BusinessMap
          businesses={businesses}
          centerLat={userLat ?? DEFAULT_LAT}
          centerLng={userLng ?? DEFAULT_LNG}
          onSearchThisArea={handleSearchThisArea}
        />
      </div>

      {/* Results */}
      <h2 className="font-display text-2xl font-semibold text-atlas mb-4">
        {loading ? "Searching..." : `${businesses.length} places found`}
      </h2>

      {loading ? (
        <p className="text-sm text-atlas/50 font-mono mb-16">Loading businesses...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
          {businesses.map((b, i) => (
            <Link
              key={b.id}
              href={`/business/${b.id}`}
              style={{ animationDelay: `${i * 40}ms` }}
              className="animate-pin-drop group rounded-xl border border-atlas/10 bg-paper p-5 hover:border-brass hover:shadow-lg hover:shadow-atlas/5 transition-all"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-lg font-semibold text-atlas group-hover:text-coral transition-colors">
                  {b.name}
                </h3>
                <div className="flex items-center gap-2 shrink-0">
                  {b.verified && (
                    <span
                      title="Verified business"
                      className="inline-flex items-center gap-1 rounded-full bg-sage/15 text-sage text-xs font-semibold px-2 py-0.5"
                    >
                      ✓ Verified
                    </span>
                  )}
                  {b.priceRange && (
                    <span className="font-mono text-xs text-brass">{b.priceRange}</span>
                  )}
                </div>
              </div>
              <p className="text-sm text-atlas/60 mt-1">{b.category.name}</p>
              <p className="text-sm text-atlas/60">{b.city}</p>
              {b.distanceKm !== undefined && (
                <p className="font-mono text-xs text-sage mt-3">
                  {b.distanceKm.toFixed(1)} km away
                </p>
              )}
            </Link>
          ))}
          {businesses.length === 0 && (
            <p className="text-sm text-atlas/50 col-span-full text-center py-10">
              No places match yet — try widening your search.
            </p>
          )}
        </div>
      )}

      {/* Trending */}
      {trendingBusinesses.length > 0 && (
        <div className="mb-16">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-brass mb-2">
            This Week
          </p>
          <h2 className="font-display text-2xl font-semibold text-atlas mb-5">
            Trending near you
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {trendingBusinesses.map((b) => (
              <Link
                key={b.id}
                href={`/business/${b.id}`}
                className="rounded-xl border border-atlas/10 bg-atlas text-paper p-5 hover:border-brass transition-colors"
              >
                <h3 className="font-display text-lg font-semibold">{b.name}</h3>
                <p className="text-sm text-paper/60 mt-1">{b.category.name}</p>
                <p className="text-sm text-paper/60">{b.city}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}