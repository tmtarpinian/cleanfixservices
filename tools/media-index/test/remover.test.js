const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { removeAsset } = require("../lib/remover");
const { loadMaster, saveMaster } = require("../lib/masterIndex");
const { LocalDirStorage } = require("../lib/storage");
const { INDEX_PREFIX } = require("../lib/publisher");

const CATEGORY_MAP = { Electrical: ["SWITCH-REPLACE"] };

function asset(n, date, status = "published") {
  return {
    serviceType: "Electrical",
    mediaType: "photo",
    portfolioStatus: status,
    facts: `fact ${n}`,
    date,
    city: "Ann Arbor",
    storageKey: `CleanfixMedia/SWITCH-REPLACE/SWITCH-REPLACE-PHOTO-${date.replaceAll("-", "")}-job-${n}.jpg`,
    portfolioUrl: null,
  };
}

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "media-remove-"));
}

function setup(assets) {
  const root = tmpDir();
  const storage = new LocalDirStorage(root);
  const masterPath = path.join(tmpDir(), "master.json");
  saveMaster(assets, masterPath);
  // put the media bytes the assets claim to have
  for (const a of assets) fs.mkdirSync(path.dirname(path.join(root, a.storageKey)), { recursive: true });
  for (const a of assets) fs.writeFileSync(path.join(root, a.storageKey), "bytes");
  return { storage, masterPath, root };
}

const publishOptions = { categoryMap: CATEGORY_MAP, pageSize: 2 };

test("removeAsset drops the entry, republishes without it, and deletes the object", async () => {
  const a1 = asset(1, "2026-08-20");
  const a2 = asset(2, "2026-08-22");
  const { storage, masterPath, root } = setup([a1, a2]);

  const result = await removeAsset({ storage, storageKey: a1.storageKey, masterPath, publishOptions });

  assert.equal(result.remainingCount, 1);
  assert.deepEqual(loadMaster(masterPath).map((a) => a.storageKey), [a2.storageKey]);
  assert.equal(fs.existsSync(path.join(root, a1.storageKey)), false, "object deleted");
  assert.equal(fs.existsSync(path.join(root, a2.storageKey)), true, "other object untouched");

  const latest = JSON.parse(await storage.get(INDEX_PREFIX + "latest.json"));
  assert.equal(latest.version, result.publishResult.version);
  assert.equal(latest.feeds.all.count, 1);
  const first = JSON.parse(await storage.get(INDEX_PREFIX + latest.feeds.all.firstPage));
  assert.deepEqual(first.items.map((i) => i.storageKey), [a2.storageKey]);
});

test("removing the last asset publishes a valid empty index", async () => {
  const a1 = asset(1, "2026-08-20");
  const { storage, masterPath } = setup([a1]);

  const result = await removeAsset({ storage, storageKey: a1.storageKey, masterPath, publishOptions });

  assert.equal(result.remainingCount, 0);
  const latest = JSON.parse(await storage.get(INDEX_PREFIX + "latest.json"));
  assert.equal(latest.feeds.all.count, 0);
  const first = JSON.parse(await storage.get(INDEX_PREFIX + latest.feeds.all.firstPage));
  assert.deepEqual(first, { items: [], nextCursor: null, hasMore: false });
});

test("unknown storageKey fails loudly and changes nothing", async () => {
  const a1 = asset(1, "2026-08-20");
  const { storage, masterPath, root } = setup([a1]);

  await assert.rejects(
    () => removeAsset({ storage, storageKey: "CleanfixMedia/NOPE/nope.jpg", masterPath, publishOptions }),
    /no master index entry/
  );
  assert.equal(loadMaster(masterPath).length, 1, "master untouched");
  assert.equal(fs.existsSync(path.join(root, a1.storageKey)), true, "object untouched");
});

test("object delete happens after the republish (index never points at gone bytes)", async () => {
  const a1 = asset(1, "2026-08-20");
  const a2 = asset(2, "2026-08-22");
  const { storage, masterPath } = setup([a1, a2]);

  const events = [];
  const spy = Object.create(storage);
  spy.put = async (obj) => { events.push(`put ${obj.key}`); return storage.put(obj); };
  spy.delete = async (key) => { events.push(`delete ${key}`); return storage.delete(key); };

  await removeAsset({ storage: spy, storageKey: a1.storageKey, masterPath, publishOptions });

  const objectDelete = events.indexOf(`delete ${a1.storageKey}`);
  const lastIndexPut = events.map((e) => e.startsWith(`put ${INDEX_PREFIX}`)).lastIndexOf(true);
  assert.ok(objectDelete > lastIndexPut, `object deleted before index finished: ${events.join(", ")}`);
});
