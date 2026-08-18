"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Booking = {
  id: string;
  proposedDate: string;
  status: string;
  notes: string | null;
  proposedBy: string;
};

type Props = {
  jobId: string;
  booking: Booking | null;
  isCustomer: boolean;
  isProvider: boolean;
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  proposed: { label: "Proposed — awaiting response", className: "bg-amber-100 text-amber-700" },
  confirmed: { label: "Confirmed", className: "bg-blue-100 text-blue-700" },
  completed: { label: "Completed", className: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelled", className: "bg-gray-200 text-gray-600" },
};

export default function BookingPanel({ jobId, booking, isCustomer, isProvider }: Props) {
  const router = useRouter();
  const [proposedDate, setProposedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [showCounterForm, setShowCounterForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePropose(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const response = await fetch(`/api/jobs/${jobId}/booking`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proposedDate, notes }),
    });

    setSaving(false);

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error || "Could not propose booking. Please try again.");
      return;
    }

    router.refresh();
  }

  async function handleCounter(e: React.FormEvent) {
    e.preventDefault();
    if (!booking) return;
    setSaving(true);
    setError(null);

    const response = await fetch(`/api/bookings/${booking.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "counter", proposedDate, notes }),
    });

    setSaving(false);

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error || "Could not suggest a new time. Please try again.");
      return;
    }

    setShowCounterForm(false);
    router.refresh();
  }

  async function handleAction(action: string) {
    if (!booking) return;
    setSaving(true);
    setError(null);

    const response = await fetch(`/api/bookings/${booking.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });

    setSaving(false);

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error || "Action failed. Please try again.");
      return;
    }

    router.refresh();
  }

  if (!booking) {
    if (isCustomer) {
      return (
        <form onSubmit={handlePropose} className="border border-gray-200 rounded-lg p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Propose a booking date</h3>
          <div>
            <label className="text-sm font-medium text-gray-700">Date and time</label>
            <input
              type="datetime-local"
              required
              value={proposedDate}
              onChange={(e) => setProposedDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm mt-1"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-full hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Sending..." : "Propose booking"}
          </button>
        </form>
      );
    }

    return (
      <div className="border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-500">
          Waiting for the customer to propose a date and time.
        </p>
      </div>
    );
  }

  const statusInfo = STATUS_LABELS[booking.status] ?? { label: booking.status, className: "bg-gray-100 text-gray-600" };
  const date = new Date(booking.proposedDate);
  const proposerLabel = booking.proposedBy === "customer" ? "customer" : "provider";
  const isMyTurn =
    booking.status === "proposed" &&
    ((isCustomer && booking.proposedBy === "provider") ||
      (isProvider && booking.proposedBy === "customer"));

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Booking</h3>
        <span className={`text-xs font-semibold rounded-full px-3 py-1 ${statusInfo.className}`}>
          {statusInfo.label}
        </span>
      </div>
      <p className="text-sm text-gray-700">
        {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </p>
      {booking.notes && <p className="text-sm text-gray-500">{booking.notes}</p>}
      {booking.status === "proposed" && (
        <p className="text-xs text-gray-400">
          {isMyTurn
            ? `Proposed by the ${proposerLabel} — your response is needed.`
            : `Waiting for the other party to respond.`}
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {booking.status === "proposed" && isMyTurn && !showCounterForm && (
        <div className="flex gap-2">
          <button
            onClick={() => handleAction("confirm")}
            disabled={saving}
            className="bg-blue-600 text-white text-xs font-medium px-4 py-2 rounded-full hover:bg-blue-700 disabled:opacity-50"
          >
            Accept this time
          </button>
          <button
            onClick={() => setShowCounterForm(true)}
            disabled={saving}
            className="border border-gray-300 text-gray-700 text-xs font-medium px-4 py-2 rounded-full hover:bg-gray-50 disabled:opacity-50"
          >
            Suggest different time
          </button>
        </div>
      )}

      {booking.status === "proposed" && isMyTurn && showCounterForm && (
        <form onSubmit={handleCounter} className="space-y-2 border-t border-gray-100 pt-3">
          <div>
            <label className="text-sm font-medium text-gray-700">New date and time</label>
            <input
              type="datetime-local"
              required
              value={proposedDate}
              onChange={(e) => setProposedDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm mt-1"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white text-xs font-medium px-4 py-2 rounded-full hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Sending..." : "Send new time"}
            </button>
            <button
              type="button"
              onClick={() => setShowCounterForm(false)}
              className="text-xs text-gray-500 hover:underline"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {booking.status === "confirmed" && (
        <div className="flex gap-2">
          <button
            onClick={() => handleAction("complete")}
            disabled={saving}
            className="bg-green-600 text-white text-xs font-medium px-4 py-2 rounded-full hover:bg-green-700 disabled:opacity-50"
          >
            Mark completed
          </button>
        </div>
      )}

      {(booking.status === "proposed" || booking.status === "confirmed") && (
        <button
          onClick={() => handleAction("cancel")}
          disabled={saving}
          className="border border-gray-300 text-gray-700 text-xs font-medium px-4 py-2 rounded-full hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel booking
        </button>
      )}
    </div>
  );
}