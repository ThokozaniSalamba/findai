"use client";

import { useEffect, useState } from "react";

type Message = {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
};

type Props = {
  jobId: string;
  businessId: string;
  currentUserId: string;
};

export default function MessageThread({ jobId, businessId, currentUserId }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  async function loadMessages() {
    const response = await fetch(`/api/jobs/${jobId}/messages?businessId=${businessId}`);
    if (response.ok) {
      const data = await response.json();
      setMessages(data.messages);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSending(true);

    await fetch(`/api/jobs/${jobId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId, content }),
    });

    setContent("");
    setSending(false);
    loadMessages();
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">Messages</h3>
        <button onClick={loadMessages} className="text-xs text-blue-600 hover:underline">
          Refresh
        </button>
      </div>

      <div className="space-y-2 mb-3 max-h-72 overflow-y-auto">
        {loading && <p className="text-xs text-gray-400">Loading...</p>}
        {!loading && messages.length === 0 && (
          <p className="text-xs text-gray-400">No messages yet. Say hello.</p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`text-sm px-3 py-2 rounded-lg max-w-[80%] ${
              m.senderId === currentUserId
                ? "bg-blue-600 text-white ml-auto"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {m.content}
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={sending}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
