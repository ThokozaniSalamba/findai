"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Business = {
  id: string;
  name: string;
  description: string | null;
  phone: string | null;
  website: string | null;
  addressLine: string;
  city: string;
  region: string | null;
  postalCode: string | null;
  country: string;
  priceRange: string | null;
  openingHours: string | null;
};

type Props = {
  business: Business;
};

type Hours = {
  openTime: string;
  closeTime: string;
  closedWeekends: boolean;
};

function parseHours(raw: string | null): Hours {
  if (!raw) {
    return { openTime: "09:00", closeTime: "17:00", closedWeekends: false };
  }
  try {
    const parsed = JSON.parse(raw);
    return {
      openTime: parsed.openTime ?? "09:00",
      closeTime: parsed.closeTime ?? "17:00",
      closedWeekends: Boolean(parsed.closedWeekends),
    };
  } catch {
    return { openTime: "09:00", closeTime: "17:00", closedWeekends: false };
  }
}

export default function EditBusinessForm({ business }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: business.name,
    description: business.description ?? "",
    phone: business.phone ?? "",
    website: business.website ?? "",
    addressLine: business.addressLine,
    city: business.city,
    region: business.region ?? "",
    postalCode: business.postalCode ?? "",
    country: business.country,
    priceRange: business.priceRange ?? "",
  });
  const [hours, setHours] = useState<Hours>(parseHours(business.openingHours));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleHoursChange(field: keyof Hours, value: string | boolean) {
    setHours((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const response = await fetch(`/api/business/${business.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        openingHours: JSON.stringify(hours),
      }),
    });

    setSaving(false);

    if (!response.ok) {
      setMessage("Something went wrong. Please try again.");
      return;
    }

    setMessage("Saved successfully.");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700">Business name</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => handleChange("name", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm mt-1"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => handleChange("description", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm mt-1"
          rows={3}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Price range</label>
        <select
          value={form.priceRange}
          onChange={(e) => handleChange("priceRange", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm mt-1"
        >
          <option value="">Not specified</option>
          <option value="$">$ Budget</option>
          <option value="$$">$$ Moderate</option>
          <option value="$$$">$$$ Premium</option>
        </select>
      </div>

      <div className="border border-gray-200 rounded-lg p-4">
        <label className="text-sm font-medium text-gray-700 block mb-2">
          Opening hours (weekdays)
        </label>
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <label className="text-xs text-gray-500">Opens</label>
            <input
              type="time"
              value={hours.openTime}
              onChange={(e) => handleHoursChange("openTime", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Closes</label>
            <input
              type="time"
              value={hours.closeTime}
              onChange={(e) => handleHoursChange("closeTime", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mt-1"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={hours.closedWeekends}
            onChange={(e) => handleHoursChange("closedWeekends", e.target.checked)}
          />
          Closed on weekends
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Phone</label>
          <input
            type="text"
            value={form.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Website</label>
          <input
            type="text"
            value={form.website}
            onChange={(e) => handleChange("website", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm mt-1"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Address</label>
        <input
          type="text"
          value={form.addressLine}
          onChange={(e) => handleChange("addressLine", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm mt-1"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700">City</label>
          <input
            type="text"
            value={form.city}
            onChange={(e) => handleChange("city", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Region</label>
          <input
            type="text"
            value={form.region}
            onChange={(e) => handleChange("region", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm mt-1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Postal code</label>
          <input
            type="text"
            value={form.postalCode}
            onChange={(e) => handleChange("postalCode", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Country</label>
          <input
            type="text"
            value={form.country}
            onChange={(e) => handleChange("country", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm mt-1"
          />
        </div>
      </div>

      {message && <p className="text-sm text-gray-600">{message}</p>}

      <button
        type="submit"
        disabled={saving}
        className="bg-blue-600 text-white text-sm font-medium px-6 py-3 rounded-full hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}