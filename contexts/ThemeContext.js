"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "safespace_theme";

const ThemeContext = createContext(undefined);

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);

  // Initialize from localStorage or system preference
  useEffect(() => {
    try {
      const stored = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
      if (stored === "dark" || stored === "light") {
        setIsDark(stored === "dark");
        return;
      }
    } catch {}

    if (typeof window !== "undefined") {
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDark(prefersDark);
    }
  }, []);

  // Apply/remove the .dark class on <html>
  useEffect(() => {
    if (typeof document !== "undefined") {
      const el = document.documentElement;
      if (isDark) el.classList.add("dark");
      else el.classList.remove("dark");
    }
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, isDark ? "dark" : "light");
      }
    } catch {}
  }, [isDark]);

  const setDarkMode = (value) => setIsDark(!!value);
  const toggleDarkMode = () => setIsDark((v) => !v);

  // Provide a color map aligned with CSS variables for convenience
  const colors = useMemo(
    () => ({
      background: "var(--background)",
      foreground: "var(--foreground)",
      primary: "var(--primary)",
      primaryForeground: "var(--primary-foreground)",
      secondary: "var(--secondary)",
      secondaryForeground: "var(--secondary-foreground)",
      muted: "var(--muted)",
      mutedForeground: "var(--muted-foreground)",
      accent: "var(--accent)",
      accentForeground: "var(--accent-foreground)",
      border: "var(--border)",
      input: "var(--input)",
      ring: "var(--ring)",
      card: "var(--card)",
      cardForeground: "var(--card-foreground)",
    }),
    []
  );

  const scaledFontSize = (base) => base; // Keep parity API; web uses CSS for sizing

  const value = useMemo(
    () => ({ isDark, setDarkMode, toggleDarkMode, colors, scaledFontSize }),
    [isDark, colors]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
