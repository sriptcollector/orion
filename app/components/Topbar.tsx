"use client";

import { useEffect, useState } from "react";

function formatDate(d: Date) {
  return d
    .toLocaleDateString("en-GB", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
    .toUpperCase();
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function Topbar() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="border-b rule px-10 py-4 flex items-center justify-between">
      <div className="label num">{now ? formatDate(now) : " "}</div>
      <div className="flex items-center gap-8">
        <div className="label num">{now ? formatTime(now) : " "}</div>
        <button className="text-[12px] border rule px-3 py-1.5 hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)] transition-colors">
          + New
        </button>
      </div>
    </header>
  );
}
