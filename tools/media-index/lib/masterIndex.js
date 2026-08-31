const fs = require("node:fs");
const path = require("node:path");

// The master index is the private source of truth: every asset in every
// status. It is deliberately gitignored (public repo) and never uploaded to
// the public bucket — only published-only chunks derived from it go to R2.
const DEFAULT_MASTER_PATH = path.resolve(__dirname, "..", "data", "master.json");

function loadMaster(filePath = DEFAULT_MASTER_PATH) {
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function saveMaster(assets, filePath = DEFAULT_MASTER_PATH) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(assets, null, 2) + "\n");
}

function appendAsset(asset, filePath = DEFAULT_MASTER_PATH) {
  const assets = loadMaster(filePath);
  if (assets.some((a) => a.storageKey === asset.storageKey)) {
    throw new Error(`master index already has an entry for storageKey "${asset.storageKey}"`);
  }
  assets.push(asset);
  saveMaster(assets, filePath);
  return assets.length;
}

function updateAsset(storageKey, patch, filePath = DEFAULT_MASTER_PATH) {
  const assets = loadMaster(filePath);
  const asset = assets.find((a) => a.storageKey === storageKey);
  if (!asset) throw new Error(`no master index entry for storageKey "${storageKey}"`);
  Object.assign(asset, patch);
  saveMaster(assets, filePath);
  return asset;
}

module.exports = { DEFAULT_MASTER_PATH, loadMaster, saveMaster, appendAsset, updateAsset };
