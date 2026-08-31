#!/usr/bin/env node
const { parseArgs } = require("node:util");

const { loadCategoryMap, validateAsset } = require("../lib/schema");
const { loadMaster, updateAsset } = require("../lib/masterIndex");

const USAGE = `Usage: npm run media:status -- --key CleanfixMedia/SKU/SKU-PHOTO-YYYYMMDD-desc.jpg \\
  --status draft|published|archived [--portfolio-url https://...]

Changes an asset's portfolioStatus in the master index (e.g. draft -> published).
Moving away from published clears portfolioUrl automatically, per schema.
Run media:publish afterwards to regenerate the public index.`;

function main() {
  const { values: args } = parseArgs({
    options: {
      key: { type: "string" },
      status: { type: "string" },
      "portfolio-url": { type: "string" },
      help: { type: "boolean", default: false },
    },
  });

  if (args.help || !args.key || !args.status) {
    console.log(USAGE);
    process.exit(args.help ? 0 : 1);
  }

  const current = loadMaster().find((a) => a.storageKey === args.key);
  if (!current) {
    console.error(`no master index entry for storageKey "${args.key}"`);
    process.exit(1);
  }

  const patch = { portfolioStatus: args.status };
  if (args["portfolio-url"] !== undefined) patch.portfolioUrl = args["portfolio-url"];
  else if (args.status !== "published") patch.portfolioUrl = null;

  const candidate = { ...current, ...patch };
  const errors = validateAsset(candidate, loadCategoryMap());
  if (errors.length > 0) {
    console.error("Resulting asset would be invalid:\n  - " + errors.join("\n  - "));
    process.exit(1);
  }

  const updated = updateAsset(args.key, patch);
  console.log("updated:");
  console.log(JSON.stringify(updated, null, 2));
}

main();
