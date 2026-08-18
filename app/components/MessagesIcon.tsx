"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function MessagesIcon() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let active = true;
    fetch("/api/messages/conversations")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data) {
          const count = data.conversations.filter((c: { hasUnread: boolean }) => c.hasUnread).length;
          setUnreadCount(count);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return (
    <Link href="/messages" className="relative text-paper/80 hover:text-paper text-sm flex items-center gap-1">
      Messages
      {unreadCount > 0 && (
        <span className="inline-flex items-center justify-center bg-red-500 text-white text-[10px] font-semibold rounded-full w-4 h-4">
          {unreadCount}
        </span>
      )}
    </Link>
  );
}