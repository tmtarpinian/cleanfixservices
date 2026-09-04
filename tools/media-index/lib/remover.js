const { loadMaster, saveMaster, DEFAULT_MASTER_PATH } = require("./masterIndex");
const { publishIndex } = require("./publisher");

// Deletes an asset everywhere it lives, in the order that keeps the live site
// consistent: master entry out first, index republished without it, and only
// then the media object itself — so no published chunk ever references bytes
// that are already gone. (Old snapshots kept for in-flight paginators may
// briefly 404 on the deleted object; that window is keepVersions publishes.)
async function removeAsset({
  storage,
  storageKey,
  masterPath = DEFAULT_MASTER_PATH,
  publishOptions = {},
  log = () => {},
}) {
  const assets = loadMaster(masterPath);
  const entry = assets.find((a) => a.storageKey === storageKey);
  if (!entry) {
    throw new Error(
      `no master index entry for storageKey "${storageKey}" ` +
        `(already removed? use --object-only to delete just the stored object)`
    );
  }

  const remaining = assets.filter((a) => a.storageKey !== storageKey);
  saveMaster(remaining, masterPath);
  log(`removed master entry ${storageKey} (${remaining.length} entries left)`);

  // Republish even when the master is now empty — an empty index is valid and
  // correct; a stale index still referencing the asset is not.
  const publishResult = await publishIndex({ storage, assets: remaining, log, ...publishOptions });

  await storage.delete(storageKey);
  log(`deleted object ${storageKey}`);

  return { entry, remainingCount: remaining.length, publishResult };
}

module.exports = { removeAsset };
