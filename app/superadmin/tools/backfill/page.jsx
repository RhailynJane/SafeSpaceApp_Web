"use client";

import { useState } from "react";

export default function BackfillPasswordPolicyPage() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const runBackfill = async (dryRun) => {
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/backfill-password-policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to run backfill");
      setResult(data);
    } catch (e) {
      setError(e.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Backfill Password Policy</h2>
        <p className="text-muted-foreground">Update Clerk metadata from Convex roles and set passwordChangedAt for targeted roles.</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
          <p className="font-medium">Error</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      <div className="bg-card rounded-lg border p-6 space-y-4">
        <div className="flex gap-3">
          <button
            onClick={() => runBackfill(true)}
            disabled={loading}
            className="px-4 py-2 bg-card border rounded-lg hover:bg-accent disabled:opacity-50"
          >
            {loading ? "Running..." : "Dry Run"}
          </button>
          <button
            onClick={() => runBackfill(false)}
            disabled={loading}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? "Running..." : "Run Backfill"}
          </button>
        </div>

        {result && (
          <div className="mt-4 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-muted-foreground">Dry Run</div>
              <div>{String(result.dryRun)}</div>
              <div className="text-muted-foreground">Scanned</div>
              <div>{result.scanned}</div>
              <div className="text-muted-foreground">Eligible</div>
              <div>{result.eligible}</div>
              <div className="text-muted-foreground">Updated</div>
              <div>{result.updated}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
