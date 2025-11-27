"use client";
import React from "react";

// Lazy import within client boundary to avoid touching RSC layer
let CspViolationWatcher = null;
if (process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
  CspViolationWatcher = require('./CspViolationWatcher').default;
}

export default function DevRootClient() {
  if (process.env.NODE_ENV !== 'development') return null;
  const Watcher = CspViolationWatcher;
  return Watcher ? <Watcher /> : null;
}
