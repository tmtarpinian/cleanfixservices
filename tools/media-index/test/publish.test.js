const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { publishIndex, INDEX_PREFIX } = require("../lib/publisher");
const { LocalDirStorage } = require("../lib/storage");

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

function tmpStorage() {
  return new LocalDirStorage(fs.mkdtempSync(path.join(os.tmpdir(), "media-index-")));
}

test("publish round-trip: latest.json resolves and cursor chain paginates fully", async () => {
  const storage = tmpStorage();
  const assets = [
    asset(1, "2026-08-01"),
    asset(2, "2026-08-02"),
    asset(3, "2026-08-03"),
    asset(4, "2026-08-04", "draft"),
  ];
  const result = await publishIndex({
    storage,
    assets,
    categoryMap: CATEGORY_MAP,
    pageSize: 2,
    now: new Date("2026-08-28T00:00:00Z"),
  });

  const latest = JSON.parse(await storage.get(INDEX_PREFIX + "latest.json"));
  assert.equal(latest.version, result.version);
  assert.equal(latest.feeds.all.count, 3, "draft asset must not be counted");

  let cursor = latest.feeds.all.firstPage;
  const seen = [];
  while (cursor) {
    const page = JSON.parse(await storage.get(INDEX_PREFIX + cursor));
    seen.push(...page.items.map((i) => i.facts));
    assert.equal(page.hasMore, page.nextCursor !== null);
    cursor = page.nextCursor;
  }
  assert.deepEqual(seen, ["fact 3", "fact 2", "fact 1"]);
});

test("invalid master entry blocks the whole publish", async () => {
  const storage = tmpStorage();
  const bad = { ...asset(1, "2026-08-01"), serviceType: "Roofing" };
  await assert.rejects(
    publishIndex({ storage, assets: [bad], categoryMap: CATEGORY_MAP }),
    /refusing to publish: 1 invalid master entries/
  );
  assert.deepEqual(await storage.list(INDEX_PREFIX), [], "nothing may be written on failure");
});

test("republish keeps previous snapshot, prunes older ones", async () => {
  const storage = tmpStorage();
  const assets = [asset(1, "2026-08-01")];
  const opts = { storage, assets, categoryMap: CATEGORY_MAP, keepVersions: 2 };

  const v1 = await publishIndex({ ...opts, now: new Date("2026-08-28T00:00:00Z") });
  const v2 = await publishIndex({ ...opts, now: new Date("2026-08-28T01:00:00Z") });
  const v3 = await publishIndex({ ...opts, now: new Date("2026-08-28T02:00:00Z") });

  const keys = await storage.list(INDEX_PREFIX);
  const versionsOnDisk = new Set(
    keys.map((k) => k.slice(INDEX_PREFIX.length).split("/")[0]).filter((v) => v.startsWith("v"))
  );
  assert.deepEqual([...versionsOnDisk].sort(), [v2.version, v3.version].sort());
  assert.deepEqual(v3.prunedVersions, [v1.version]);

  const latest = JSON.parse(await storage.get(INDEX_PREFIX + "latest.json"));
  assert.equal(latest.version, v3.version);
});
