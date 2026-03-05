"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const apps = [
  {
    name: "Amplify",
    description: "Growth OS for financial advisors",
    href: "/onboarding/firm-profile",
  },
  {
    name: "Amplify Chat",
    description: "Internal AI Agent",
    href: "/amplify-chat",
  },
];

export default function Home() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6">
      <button
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className="fixed right-6 top-6 flex size-10 items-center justify-center rounded-full border border-border bg-surface text-foreground-muted shadow-sm transition-colors hover:text-foreground"
      >
        {dark ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="size-5">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="size-5">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
        )}
      </button>

      <header className="mb-16 text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Amplify Advisors App Hub
        </h1>
        <p className="mt-3 text-lg text-foreground-muted">
          Choose an application to get started.
        </p>
      </header>

      <div className="grid w-full max-w-xl grid-cols-1 gap-6 sm:grid-cols-2">
        {apps.map((app) => (
          <Link
            key={app.name}
            href={app.href}
            className="group relative flex aspect-square flex-col items-center justify-center rounded-lg border border-border bg-surface text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
          >
            <h2 className="text-2xl font-semibold tracking-tight">
              {app.name}
            </h2>
            <p className="mt-2 text-sm text-foreground-muted">
              {app.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
