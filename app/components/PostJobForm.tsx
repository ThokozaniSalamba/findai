"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Category = {
  id: string;
  name: string;
};

type Props = {
  categories: Category[];
};

export default function PostJobForm({ categories }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    description: "",
    categoryId: categories[0]?.id ?? "",
    budget: "",
    addressLine: "",
    city: "",
    region: "",
    country: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const response = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSaving(false);

    if (!response.ok) {
      setError("Something went wrong. Please check the form and try again.");
      return;
    }

    const data = await response.json();
    router.push(`/jobs/${data.job.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      <div>
        <label className="text-sm font-medium text-gray-700">What do you need done?</label>
        <input
          type="text"
          required
          value={form.title}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="e.g. Fix a leaking pipe under the kitchen sink"
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm mt-1"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Details</label>
        <textarea
          required
          value={form.description}
          onChange={(e) => handleChange("description", e.target.value)}
          rows={4}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm mt-1"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Category</label>
        <select
          value={form.categoryId}
          onChange={(e) => handleChange("categoryId", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm mt-1"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Budget (optional)</label>
        <input
          type="number"
          value={form.budget}
          onChange={(e) => handleChange("budget", e.target.value)}
          placeholder="e.g. 500"
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm mt-1"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Address (optional)</label>
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
            required
            value={form.city}
            onChange={(e) => handleChange("city", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Region (optional)</label>
          <input
            type="text"
            value={form.region}
            onChange={(e) => handleChange("region", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm mt-1"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Country</label>
        <input
          type="text"
          required
          value={form.country}
          onChange={(e) => handleChange("country", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm mt-1"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="bg-blue-600 text-white text-sm font-medium px-6 py-3 rounded-full hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? "Posting..." : "Post job"}
      </button>
    </form>
  );
}
