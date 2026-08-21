"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const applyTheme = (theme: Theme): void => {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("relay-theme", theme);
};

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  useEffect(() => {
    const saved = localStorage.getItem("relay-theme");
    const next: Theme = saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
    setTheme(next); applyTheme(next);
  }, []);
  const toggle = (): void => { const next = theme === "light" ? "dark" : "light"; setTheme(next); applyTheme(next); };
  return <button className="theme-toggle" type="button" onClick={toggle} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`} title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}>{theme === "light" ? <Moon size={16}/> : <Sun size={16}/>}</button>;
}
