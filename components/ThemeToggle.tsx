"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-800 transition-all hover:bg-gray-100 hover:scale-105 active:scale-95 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
      title="Cambiar modo"
    >
      {/* Icono Sol (Visible en Light) */}
      <span className={`absolute text-xl transition-all duration-300 ${theme === "dark" ? "rotate-90 opacity-0 scale-0" : "rotate-0 opacity-100 scale-100"}`}>
        ☀️
      </span>
      {/* Icono Luna (Visible en Dark) */}
      <span className={`absolute text-xl transition-all duration-300 ${theme === "dark" ? "rotate-0 opacity-100 scale-100" : "-rotate-90 opacity-0 scale-0"}`}>
        🌑
      </span>
    </button>
  );
}