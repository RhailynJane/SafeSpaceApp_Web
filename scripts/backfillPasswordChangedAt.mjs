#!/usr/bin/env node
import 'dotenv/config';

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
if (!CLERK_SECRET_KEY) {
  console.error('Missing CLERK_SECRET_KEY in environment. Aborting.');
  process.exit(1);
}

const ROLES = new Set(['admin', 'team_leader', 'support_worker', 'peer_support']);
const NOW_ISO = new Date().toISOString();

async function fetchUsersPage({ limit = 100, offset = 0 } = {}) {
  const url = new URL('https://api.clerk.com/v1/users');
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('offset', String(offset));
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${CLERK_SECRET_KEY}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch users: ${res.status} ${text}`);
  }
  return res.json();
}

async function updateUserPublicMetadata(id, newPublicMetadata) {
  const res = await fetch(`https://api.clerk.com/v1/users/${id}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ public_metadata: newPublicMetadata }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to update user ${id}: ${res.status} ${text}`);
  }
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  let offset = 0;
  const limit = 100;
  let total = 0;
  let eligible = 0;
  let updated = 0;

  console.log(`Starting backfill (dryRun=${dryRun}). Roles: ${Array.from(ROLES).join(', ')}`);

  // Basic pagination loop
  while (true) {
    const page = await fetchUsersPage({ limit, offset });
    const users = Array.isArray(page) ? page : page?.data || [];
    if (users.length === 0) break;

    for (const u of users) {
      total += 1;
      const pm = u?.public_metadata || {};
      const role = pm.role;
      if (!ROLES.has(role || '')) continue;
      eligible += 1;

      if (!pm.passwordChangedAt) {
        const newPm = { ...pm, passwordChangedAt: NOW_ISO };
        // Do not override mustChangePassword here; only backfill timestamp
        console.log(`Backfilling user ${u.id} (${u.email_addresses?.[0]?.email_address || 'no-email'}) role=${role}`);
        if (!dryRun) {
          await updateUserPublicMetadata(u.id, newPm);
        }
        updated += 1;
        // Small delay to be gentle on API rate limits
        await sleep(50);
      }
    }

    offset += users.length;
    // Safety: if returned fewer than limit, likely last page
    if (users.length < limit) break;
  }

  console.log('--- Summary ---');
  console.log(`Scanned: ${total}`);
  console.log(`Eligible by role: ${eligible}`);
  console.log(`Updated passwordChangedAt: ${updated}`);
}

main().catch((e) => {
  console.error('Backfill failed:', e);
  process.exit(1);
});
