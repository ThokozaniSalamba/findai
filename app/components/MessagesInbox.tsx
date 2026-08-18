"use client";

import { useState, useEffect } from "react";
import MessageThread from "./MessageThread";

type Conversation = {
  jobRequestId: string;
  businessId: string;
  jobTitle: string;
  otherPartyName: string;
  role: "customer" | "provider";
  lastMessage: string | null;
  lastMessageAt: string | null;
  hasUnread: boolean;
};

type Props = {
  currentUserId: string;
};

export default function MessagesInbox({ currentUserId }: Props) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Conversation | null>(null);

  async function loadConversations() {
    const res = await fetch("/api/messages/conversations");
    if (res.ok) {
      const data = await res.json();
      setConversations(data.conversations);
      setSelected((prev) => prev ?? data.conversations[0] ?? null);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSelect(conv: Conversation) {
    setSelected(conv);
    setConversations((prev) =>
      prev.map((c) =>
        c.jobRequestId === conv.jobRequestId && c.businessId === conv.businessId
          ? { ...c, hasUnread: false }
          : c
      )
    );
  }

  if (loading) {
    return <p className="text-sm text-gray-400 px-6 py-10">Loading conversations...</p>;
  }

  if (conversations.length === 0) {
    return (
      <p className="text-sm text-gray-500 px-6 py-10">
        No conversations yet. Once you accept or send a quote, you can chat here.
      </p>
    );
  }

  return (
    <div className="flex border border-gray-200 rounded-lg overflow-hidden" style={{ minHeight: "500px" }}>
      <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
        {conversations.map((c) => {
          const isSelected =
            selected?.jobRequestId === c.jobRequestId && selected?.businessId === c.businessId;
          return (
            <button
              key={`${c.jobRequestId}-${c.businessId}`}
              onClick={() => handleSelect(c)}
              className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 ${
                isSelected ? "bg-blue-50" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900 truncate">{c.jobTitle}</p>
                {c.hasUnread && (
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 ml-2" />
                )}
              </div>
              <p className="text-xs text-gray-500 truncate">{c.otherPartyName}</p>
              {c.lastMessage && (
                <p className="text-xs text-gray-400 truncate mt-0.5">{c.lastMessage}</p>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex-1 flex flex-col">
        {selected ? (
          <div className="p-4 flex-1 overflow-y-auto">
            <div className="mb-3">
              <p className="text-sm font-semibold text-gray-900">{selected.jobTitle}</p>
              <p className="text-xs text-gray-500">Chatting with {selected.otherPartyName}</p>
            </div>
            <MessageThread
              key={`${selected.jobRequestId}-${selected.businessId}`}
              jobId={selected.jobRequestId}
              businessId={selected.businessId}
              currentUserId={currentUserId}
            />
          </div>
        ) : (
          <p className="text-sm text-gray-400 p-6">Select a conversation to view messages.</p>
        )}
      </div>
    </div>
  );
}