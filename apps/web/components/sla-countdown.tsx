"use client";

import { useEffect, useState } from "react";

type Props = Readonly<{ minutes: number; isBusinessHoursOpen: boolean; state: string; compact?: boolean }>;

const format = (minutes: number): string => {
  const absolute = Math.abs(minutes);
  const days = Math.floor(absolute / 1440);
  const hours = Math.floor((absolute % 1440) / 60);
  const remainder = absolute % 60;
  const value = days ? `${days}d ${hours}h` : `${hours}h ${remainder}m`;
  return minutes < 0 ? `${value} overdue` : `${value} left`;
};

export function SlaCountdown({ minutes, isBusinessHoursOpen, state, compact = false }: Props) {
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(startedAt);
  const running = isBusinessHoursOpen && state !== "MET" && state !== "PAUSED";
  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [running]);
  const displayed = minutes - (running ? Math.floor((now - startedAt) / 60000) : 0);
  return <span className={`countdown ${compact ? "countdown-compact" : ""}`} title={running ? "Business clock is running" : "Business clock is paused outside working hours"}>{format(displayed)}</span>;
}
