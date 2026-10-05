#!/usr/bin/env node
/**
 * Point-in-time snapshot of everything a contest depends on.
 *
 * Why this exists: Supabase Pro keeps daily backups for 7 days. Judging
 * runs longer than that, and judge scores are the least replaceable data
 * on the platform — losing them means eight people re-reviewing seventy
 * nine projects. This writes a full copy of the contest-critical tables to
 * local JSON on demand, so the retention window is however long you keep
 * the files, at no cost.
 *
 * It reads through PostgREST with the service role rather than pg_dump,
 * because that needs only the keys already in .env.local.
 *
 * Usage:
 *   set -a && source .env.local && set +a
 *   node scripts/backup-contest-data.mjs              # -> backups/<timestamp>/
 *   node scripts/backup-contest-data.mjs --out /path  # somewhere else
 *
 * Run it before any risky migration or data script, and once a day while
 * judging is live. Keep at least one copy off this machine.
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Ordered roughly parent-first, which is the order you'd restore them in.
const TABLES = [
  "profiles",
  "contests",
  "contest_judges",
  "contest_submissions",
  "contest_scores",
  "projects",
  "project_logs",
  "collaborations",
  "comments",
  "announcements",
  "blogs",
];

const PAGE = 1000;

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    console.error("Run:  set -a && source .env.local && set +a");
    process.exit(1);
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * PostgREST caps a response at 1000 rows and returns no warning when it
 * truncates, so anything that doesn't page explicitly will silently back up
 * only the first thousand rows and look like it succeeded.
 */
async function dumpTable(admin, table) {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await admin.from(table).select("*").range(from, from + PAGE - 1);
    if (error) return { error: error.message };
    rows.push(...data);
    if (data.length < PAGE) break;
  }
  return { rows };
}

async function main() {
  const outFlag = process.argv.indexOf("--out");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = outFlag !== -1 ? process.argv[outFlag + 1] : path.join("backups", stamp);

  fs.mkdirSync(outDir, { recursive: true });
  const admin = getClient();

  console.log(`Snapshot -> ${outDir}\n`);
  const manifest = { takenAt: new Date().toISOString(), tables: {} };
  let failed = 0;

  for (const table of TABLES) {
    process.stdout.write(`  ${table.padEnd(22)}`);
    const { rows, error } = await dumpTable(admin, table);
    if (error) {
      console.log(`SKIPPED (${error})`);
      manifest.tables[table] = { error };
      failed++;
      continue;
    }
    fs.writeFileSync(path.join(outDir, `${table}.json`), JSON.stringify(rows, null, 2));
    manifest.tables[table] = { rows: rows.length };
    console.log(`${String(rows.length).padStart(6)} rows`);
  }

  fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));

  const total = Object.values(manifest.tables).reduce((a, t) => a + (t.rows || 0), 0);
  console.log(`\nDone. ${total.toLocaleString()} rows across ${TABLES.length - failed} tables.`);
  if (failed) console.log(`${failed} table(s) skipped — see manifest.json.`);
  console.log(`\nKeep a copy somewhere that isn't this laptop.`);
}

main().catch((err) => {
  console.error("Backup failed:", err.message);
  process.exit(1);
});
