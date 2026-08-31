#!/usr/bin/env node
const path = require("node:path");
const { parseArgs } = require("node:util");

const { loadEnv } = require("../lib/env");
const { loadMaster } = require("../lib/masterIndex");
const { publishIndex } = require("../lib/publisher");
const { LocalDirStorage, R2Storage } = require("../lib/storage");
const { DEFAULT_PAGE_SIZE } = require("../lib/chunker");

const USAGE = `Usage: npm run media:publish -- [--backend r2|local] [--out DIR] \\
  [--page-size N] [--keep-versions N] [--dry-run]

Regenerates the public pagination index from the master index and uploads it
under CleanfixMedia/_index/. Only published assets are included. --backend local
writes the same object tree to a directory (default tools/media-index/out) for
inspection; --dry-run prints the plan without writing anywhere.`;

async function main() {
  const { values: args } = parseArgs({
    options: {
      backend: { type: "string", default: "r2" },
      out: { type: "string", default: path.resolve(__dirname, "..", "out") },
      "page-size": { type: "string", default: String(DEFAULT_PAGE_SIZE) },
      "keep-versions": { type: "string", default: "2" },
      "dry-run": { type: "boolean", default: false },
      help: { type: "boolean", default: false },
    },
  });
  if (args.help) {
    console.log(USAGE);
    process.exit(0);
  }

  loadEnv();
  const assets = loadMaster();
  if (assets.length === 0) {
    console.error("master index is empty — nothing to publish (add assets with media:add first)");
    process.exit(1);
  }

  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL || null;
  if (!publicBaseUrl) {
    console.warn(
      "warning: R2_PUBLIC_BASE_URL is not set — index items will carry mediaUrl: null " +
        "until it is set in .env and the index republished"
    );
  }

  let storage;
  if (args["dry-run"]) {
    storage = {
      async put({ key, body }) {
        console.log(`[dry-run] put ${key} (${Buffer.byteLength(body)} bytes)`);
      },
      async list() {
        return [];
      },
      async delete() {},
    };
  } else if (args.backend === "local") {
    storage = new LocalDirStorage(args.out);
  } else if (args.backend === "r2") {
    storage = R2Storage.fromEnv();
  } else {
    console.error(`unknown backend "${args.backend}"`);
    process.exit(1);
  }

  const result = await publishIndex({
    storage,
    assets,
    pageSize: Number(args["page-size"]),
    keepVersions: Number(args["keep-versions"]),
    publicBaseUrl,
    log: console.log,
  });

  const publishedCount = result.latest.feeds.all.count;
  console.log(
    `\npublished index ${result.version}: ${publishedCount} published assets, ` +
      `${result.chunkCount} chunk objects, pruned ${result.prunedVersions.length} old versions`
  );
  if (args.backend === "local") console.log(`wrote to ${args.out}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
