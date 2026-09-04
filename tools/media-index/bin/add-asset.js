#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const { parseArgs } = require("node:util");

const { loadEnv } = require("../lib/env");
const { loadCategoryMap, skuToServiceType, validateAsset } = require("../lib/schema");
const { appendAsset } = require("../lib/masterIndex");
const { R2Storage } = require("../lib/storage");

const MEDIA_CONTENT_TYPES = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
};

const USAGE = `Usage: npm run media:add -- --sku SWITCH-REPLACE --media-type photo --date 2026-08-28 \\
  --desc kitchen-3way --city "Ann Arbor" --facts "..." [--status draft|published|archived] \\
  [--portfolio-url https://...] [--upload path/to/file.jpg] [--ext jpg]

Derives the storageKey (CleanfixMedia/[SKU]/[SKU]-[MEDIATYPE]-[YYYYMMDD]-[SHORTDESC].ext),
validates the asset, appends it to the private master index, and — with --upload —
puts the media bytes to R2 under that key. Without --upload, --ext is required and the
object is assumed to already exist (or be uploaded separately).`;

async function main() {
  const { values: args } = parseArgs({
    options: {
      sku: { type: "string" },
      "media-type": { type: "string" },
      date: { type: "string" },
      desc: { type: "string" },
      city: { type: "string" },
      facts: { type: "string" },
      status: { type: "string", default: "draft" },
      "portfolio-url": { type: "string" },
      upload: { type: "string" },
      ext: { type: "string" },
      help: { type: "boolean", default: false },
    },
  });

  if (args.help || !args.sku || !args["media-type"] || !args.date || !args.desc || !args.city || !args.facts) {
    console.log(USAGE);
    process.exit(args.help ? 0 : 1);
  }

  const ext = (args.ext ?? (args.upload ? path.extname(args.upload).slice(1) : "")).toLowerCase();
  if (!ext) {
    console.error("Provide --ext (or --upload, whose extension is used).");
    process.exit(1);
  }

  const categoryMap = loadCategoryMap();
  const serviceType = skuToServiceType(categoryMap)[args.sku];
  if (!serviceType) {
    console.error(`SKU "${args.sku}" is not in categoryMap.json — add it under its serviceType first.`);
    process.exit(1);
  }

  const storageKey =
    `CleanfixMedia/${args.sku}/${args.sku}-${args["media-type"].toUpperCase()}` +
    `-${args.date.replaceAll("-", "")}-${args.desc}.${ext}`;

  const asset = {
    serviceType,
    mediaType: args["media-type"],
    portfolioStatus: args.status,
    facts: args.facts,
    date: args.date,
    city: args.city.trim().replace(/\s+/g, " "),
    storageKey,
    portfolioUrl: args["portfolio-url"] ?? null,
  };

  const errors = validateAsset(asset, categoryMap);
  if (errors.length > 0) {
    console.error("Asset is invalid:\n  - " + errors.join("\n  - "));
    process.exit(1);
  }

  if (args.upload) {
    loadEnv();
    const storage = R2Storage.fromEnv();
    await storage.put({
      key: storageKey,
      body: fs.readFileSync(args.upload),
      contentType: MEDIA_CONTENT_TYPES[ext] ?? "application/octet-stream",
      cacheControl: "public, max-age=31536000, immutable",
    });
    console.log(`uploaded ${args.upload} -> ${storageKey}`);
  }

  const count = appendAsset(asset);
  console.log(`added to master index (${count} entries total):`);
  console.log(JSON.stringify(asset, null, 2));
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
