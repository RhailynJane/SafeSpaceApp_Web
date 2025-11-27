"use client";

import React, { useEffect, useState, useRef } from "react";

export default function CspViolationWatcher() {
  const [events, setEvents] = useState([]);
  const mounted = useRef(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    if (mounted.current) return;
    mounted.current = true;

    const handler = (e) => {
      const info = {
        blockedURI: e.blockedURI,
        violatedDirective: e.violatedDirective,
        effectiveDirective: e.effectiveDirective,
        sourceFile: e.sourceFile,
        lineNumber: e.lineNumber,
        columnNumber: e.columnNumber,
        disposition: e.disposition,
        timestamp: Date.now(),
      };
      // Keep last 5 events
      setEvents((prev) => {
        const next = [info, ...prev];
        return next.slice(0, 5);
      });
      // Also log visibly
      // eslint-disable-next-line no-console
      console.warn("CSP violation:", info);
    };

    document.addEventListener("securitypolicyviolation", handler);
    return () => document.removeEventListener("securitypolicyviolation", handler);
  }, []);

  if (process.env.NODE_ENV !== "development") return null;
  if (events.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        left: 16,
        zIndex: 99999,
        maxWidth: 420,
        background: "#111827cc",
        color: "#f9fafb",
        backdropFilter: "blur(6px)",
        borderRadius: 12,
        padding: 12,
        border: "1px solid #374151",
        fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
        boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>CSP Violations (dev)</div>
      <div style={{ display: "grid", gap: 8 }}>
        {events.map((ev, idx) => (
          <div key={idx} style={{ fontSize: 12, lineHeight: 1.35 }}>
            <div>
              <span style={{ color: "#93c5fd" }}>{ev.effectiveDirective}</span>
              {" "}blocked{": "}
              <span style={{ color: "#fca5a5" }}>{ev.blockedURI || "(inline)"}</span>
            </div>
            {ev.sourceFile && (
              <div style={{ color: "#d1d5db" }}>
                {ev.sourceFile}:{ev.lineNumber}:{ev.columnNumber}
              </div>
            )}
            <div style={{ color: "#9ca3af" }}>
              {new Date(ev.timestamp).toLocaleTimeString()} — {ev.violatedDirective}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
