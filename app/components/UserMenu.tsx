"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { signOutAction } from "@/app/actions/auth";

type Props = {
  displayName: string;
};

export default function UserMenu({ displayName }: Props) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-paper/80 hover:text-paper text-sm"
      >
        Hi, {displayName}
        <span className="text-xs">&#9662;</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg bg-paper text-atlas shadow-xl border border-atlas/10 py-1 z-50">
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm hover:bg-atlas/5"
          >
            Dashboard
          </Link>
          <Link
            href="/favorites"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm hover:bg-atlas/5"
          >
            Favorites
          </Link>
          <Link
            href="/history"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm hover:bg-atlas/5"
          >
            Recently Viewed
          </Link>
          <div className="border-t border-atlas/10 my-1" />
          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full text-left px-4 py-2 text-sm text-coral hover:bg-atlas/5"
            >
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}