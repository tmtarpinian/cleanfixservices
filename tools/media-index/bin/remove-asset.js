#!/usr/bin/env node
const path = require("node:path");
const { parseArgs } = require("node:util");

const { loadEnv } = require("../lib/env");
const { loadMaster } = require("../lib/masterIndex");
const { removeAsset } = require("../lib/remover");
const { LocalDirStorage, R2Storage } = require("../lib/storage");
const { DEFAULT_PAGE_SIZE } = require("../lib/chunker");

const USAGE = `Usage: npm run media:remove -- --key CleanfixMedia/SKU/SKU-PHOTO-YYYYMMDD-desc.jpg \\
  [--backend r2|local] [--out DIR] [--page-size N] [--dry-run] [--object-only]

Deletes an asset everywhere, in the safe order: removes its master index entry,
republishes the public index without it, then deletes the object from storage.
To hide an asset while keeping its bytes and record, use media:status --status
archived instead. --object-only skips master/index and only deletes the stored
object (recovery for a remove that failed after republishing, or an orphan
object with no master entry). --dry-run prints the plan and changes nothing.`;

async function main() {
  const { values: args } = parseArgs({
    options: {
      key: { type: "string" },
      backend: { type: "string", default: "r2" },
      out: { type: "string", default: path.resolve(__dirname, "..", "out") },
      "page-size": { type: "string", default: String(DEFAULT_PAGE_SIZE) },
      "dry-run": { type: "boolean", default: false },
      "object-only": { type: "boolean", default: false },
      help: { type: "boolean", default: false },
    },
  });
  if (args.help || !args.key) {
    console.log(USAGE);
    process.exit(args.help ? 0 : 1);
  }

  loadEnv();

  if (args["dry-run"]) {
    const entry = loadMaster().find((a) => a.storageKey === args.key);
    if (args["object-only"]) {
      console.log(`[dry-run] would delete object ${args.key} (master index untouched)`);
    } else if (!entry) {
      console.error(`no master index entry for storageKey "${args.key}"`);
      process.exit(1);
    } else {
      console.log(`[dry-run] would remove master entry:\n${JSON.stringify(entry, null, 2)}`);
      console.log(`[dry-run] would republish index with ${loadMaster().length - 1} remaining assets`);
      console.log(`[dry-run] would delete object ${args.key}`);
    }
    return;
  }

  let storage;
  if (args.backend === "local") storage = new LocalDirStorage(args.out);
  else if (args.backend === "r2") storage = R2Storage.fromEnv();
  else {
    console.error(`unknown backend "${args.backend}"`);
    process.exit(1);
  }

  if (args["object-only"]) {
    await storage.delete(args.key);
    console.log(`deleted object ${args.key} (master index untouched)`);
    return;
  }

  const result = await removeAsset({
    storage,
    storageKey: args.key,
    publishOptions: {
      pageSize: Number(args["page-size"]),
      publicBaseUrl: process.env.R2_PUBLIC_BASE_URL || null,
    },
    log: console.log,
  });

  console.log(
    `\nremoved ${args.key}: index republished as ${result.publishResult.version} ` +
      `(${result.remainingCount} assets remain in master)`
  );
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
