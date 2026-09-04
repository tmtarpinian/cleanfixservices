const { validateAsset, loadCategoryMap } = require("./schema");
const { buildIndex, DEFAULT_PAGE_SIZE } = require("./chunker");

const INDEX_PREFIX = "CleanfixMedia/_index/";

// Chunk objects are immutable — a version stamp is baked into every key, so
// they can be cached forever. latest.json is the only mutable object and
// carries a short TTL so a republish becomes visible within a minute.
const CHUNK_CACHE_CONTROL = "public, max-age=31536000, immutable";
const POINTER_CACHE_CONTROL = "public, max-age=60";

function versionStamp(now) {
  return "v" + now.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
}

async function publishIndex({
  storage,
  assets,
  categoryMap = loadCategoryMap(),
  pageSize = DEFAULT_PAGE_SIZE,
  publicBaseUrl = null,
  now = new Date(),
  keepVersions = 2,
  log = () => {},
}) {
  const invalid = assets
    .map((asset) => ({ asset, errors: validateAsset(asset, categoryMap) }))
    .filter(({ errors }) => errors.length > 0);
  if (invalid.length > 0) {
    const detail = invalid
      .map(({ asset, errors }) => `  ${asset.storageKey ?? "<no storageKey>"}\n    - ${errors.join("\n    - ")}`)
      .join("\n");
    throw new Error(`refusing to publish: ${invalid.length} invalid master entries\n${detail}`);
  }

  const version = versionStamp(now);
  const generatedAt = now.toISOString();
  const { latest, objects } = buildIndex(assets, { version, pageSize, publicBaseUrl, generatedAt });

  for (const { relKey, body } of objects) {
    const key = INDEX_PREFIX + relKey;
    await storage.put({
      key,
      body: JSON.stringify(body),
      contentType: "application/json",
      cacheControl: CHUNK_CACHE_CONTROL,
    });
    log(`put ${key} (${body.items.length} items, hasMore=${body.hasMore})`);
  }

  await storage.put({
    key: INDEX_PREFIX + "latest.json",
    body: JSON.stringify(latest),
    contentType: "application/json",
    cacheControl: POINTER_CACHE_CONTROL,
  });
  log(`put ${INDEX_PREFIX}latest.json -> ${version}`);

  // Prune old snapshots, keeping the current one plus (keepVersions - 1)
  // predecessors so in-flight paginators finish on a consistent snapshot.
  const keys = await storage.list(INDEX_PREFIX);
  const versions = [
    ...new Set(
      keys
        .map((k) => k.slice(INDEX_PREFIX.length).split("/")[0])
        .filter((v) => /^v\d{8}T\d{6}Z$/.test(v))
    ),
  ].sort();
  const stale = versions.slice(0, Math.max(0, versions.length - keepVersions));
  for (const staleVersion of stale) {
    for (const key of keys.filter((k) => k.startsWith(INDEX_PREFIX + staleVersion + "/"))) {
      await storage.delete(key);
      log(`pruned ${key}`);
    }
  }

  return { version, latest, chunkCount: objects.length, prunedVersions: stale };
}

module.exports = { publishIndex, INDEX_PREFIX, CHUNK_CACHE_CONTROL, POINTER_CACHE_CONTROL, versionStamp };
