"use client";

import { useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FEATURES, FEATURE_MAP } from "@/lib/features";

export default function OrganizationAccessControlPage() {
  const params = useParams();
  const slug = params?.slug ? String(params.slug) : undefined;
  const { user } = useUser();
  const clerkId = user?.id;

  const featureRows = useQuery(
    api.featurePermissions.listByOrg,
    slug ? { orgSlug: slug } : "skip"
  );

  const updatePermission = useMutation(api.featurePermissions.updatePermission);
  const bulkUpdate = useMutation(api.featurePermissions.bulkUpdate);

  const [state, setState] = useState([]); // local editable copy
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (featureRows) {
      setState(featureRows.map(r => ({
        featureKey: r.featureKey,
        label: FEATURE_MAP[r.featureKey]?.label || r.featureKey,
        enabled: r.enabled,
        _id: r._id || null,
      })));
      setDirty(false);
    }
  }, [featureRows]);

  const onToggle = (idx) => {
    setState(prev => prev.map((row, i) => {
      if (i !== idx) return row;
      return { ...row, enabled: !row.enabled };
    }));
    setDirty(true);
  };

  const onQuickUpdate = async (idx) => {
    // Immediate backend update for a single checkbox (optional optimization)
    try {
      const row = state[idx];
      await updatePermission({
        orgSlug: slug,
        featureKey: row.featureKey,
        enabled: !row.enabled,
        updatedBy: clerkId,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const onSaveAll = async () => {
    if (!slug) return;
    setSaving(true); setError(""); setSuccess(false);
    try {
      await bulkUpdate({
        orgSlug: slug,
        updates: state.map(s => ({
          featureKey: s.featureKey,
          enabled: s.enabled,
        })),
        updatedBy: clerkId,
      });
      setDirty(false);
      setSuccess(true);
    } catch (e) {
      setError(e?.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Access Control</h2>
          <p className="text-muted-foreground">Configure feature visibility & permissions for this organization.</p>
        </div>
        <div className="flex gap-3">
          <Link href={`/superadmin/organizations/${slug}`} className="px-4 py-2 rounded-lg border border-border bg-card hover:bg-accent transition-colors">Back</Link>
          <button
            onClick={onSaveAll}
            disabled={!dirty || saving}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : dirty ? "Save All" : "Saved"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg border border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400">{error}</div>
      )}
      {success && (
        <div className="p-3 rounded-lg border border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400">Permissions updated.</div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium">Feature</th>
              <th className="px-4 py-3 font-medium text-center">Enabled</th>
            </tr>
          </thead>
          <tbody>
            {state.map((row, idx) => {
              return (
                <tr key={row.featureKey} className="border-t border-border/60">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{row.label}</div>
                    <div className="text-xs text-muted-foreground">{FEATURE_MAP[row.featureKey]?.description}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={row.enabled}
                        onChange={() => onToggle(idx)}
                        className="h-4 w-4 rounded border-border bg-background checked:bg-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="sr-only">enabled</span>
                    </label>
                  </td>
                </tr>
              );
            })}
            {state.length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-6 text-center text-muted-foreground">Loading feature permissions...</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">Changes are applied per organization. Disabled features will be hidden from users in this organization.</p>
    </div>
  );
}
