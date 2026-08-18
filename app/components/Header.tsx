"use client";

import { useState } from "react";
import Link from "next/link";
import UserMenu from "./UserMenu";
import MessagesIcon from "./MessagesIcon";
import { signOutAction } from "@/app/actions/auth";

type Props = {
  isLoggedIn: boolean;
  displayName: string;
};

export default function Header({ isLoggedIn, displayName }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-atlas text-paper border-b border-atlas-light px-4 sm:px-6 py-4">
      <div className="flex items-center justify-between">
        <Link href="/" className="font-display text-2xl font-semibold text-paper">
          Find<span className="text-brass">AI</span>
        </Link>

        <nav className="hidden sm:flex items-center gap-4 text-sm">
          <Link href="/jobs" className="text-paper/80 hover:text-paper">
            Browse Jobs
          </Link>
          <Link href="/post-job" className="text-paper/80 hover:text-paper">
            Post a Job
          </Link>
          {isLoggedIn ? (
            <>
              <MessagesIcon />
              <UserMenu displayName={displayName} />
            </>
          ) : (
            <>
              <Link href="/login" className="text-paper/80 hover:text-paper">
                Sign In
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-brass px-4 py-1.5 font-medium text-atlas hover:bg-brass/90 transition-colors"
              >
                Register
              </Link>
            </>
          )}
        </nav>

        <div className="flex sm:hidden items-center gap-3">
          {isLoggedIn && <MessagesIcon />}
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            className="text-paper p-1"
          >
            {open ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {open && (
        <div className="sm:hidden mt-4 pt-4 border-t border-atlas-light flex flex-col gap-1">
          <Link
            href="/jobs"
            onClick={() => setOpen(false)}
            className="py-2 text-paper/90 text-sm"
          >
            Browse Jobs
          </Link>
          <Link
            href="/post-job"
            onClick={() => setOpen(false)}
            className="py-2 text-paper/90 text-sm"
          >
            Post a Job
          </Link>

          {isLoggedIn ? (
            <>
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="py-2 text-paper/90 text-sm"
              >
                Dashboard
              </Link>
              <Link
                href="/favorites"
                onClick={() => setOpen(false)}
                className="py-2 text-paper/90 text-sm"
              >
                Favorites
              </Link>
              <Link
                href="/history"
                onClick={() => setOpen(false)}
                className="py-2 text-paper/90 text-sm"
              >
                Recently Viewed
              </Link>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="py-2 text-coral text-sm text-left w-full"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="py-2 text-paper/90 text-sm"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className="py-2 text-paper/90 text-sm"
              >
                Register
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}