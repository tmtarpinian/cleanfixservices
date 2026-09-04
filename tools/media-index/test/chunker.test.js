const test = require("node:test");
const assert = require("node:assert/strict");

const { buildIndex, cursorToken } = require("../lib/chunker");

function asset(n, { date, status = "published", serviceType = "Electrical", sku = "SWITCH-REPLACE", city = "Ann Arbor" }) {
  return {
    serviceType,
    mediaType: "photo",
    portfolioStatus: status,
    facts: `fact ${n}`,
    date,
    city,
    storageKey: `CleanfixMedia/${sku}/${sku}-PHOTO-${date.replaceAll("-", "")}-job-${n}.jpg`,
    portfolioUrl: null,
  };
}

const OPTS = { version: "v20260828T000000Z", pageSize: 2, generatedAt: "2026-08-28T00:00:00Z" };

test("draft and archived assets never appear in any feed", () => {
  const { latest, objects } = buildIndex(
    [
      asset(1, { date: "2026-08-01" }),
      asset(2, { date: "2026-08-02", status: "draft" }),
      asset(3, { date: "2026-08-03", status: "archived" }),
    ],
    OPTS
  );
  assert.equal(latest.feeds.all.count, 1);
  const allKeys = objects.flatMap((o) => o.body.items.map((i) => i.storageKey));
  assert.ok(allKeys.every((k) => k.includes("job-1")));
});

test("items sorted date DESC with storageKey DESC tiebreaker", () => {
  const { objects } = buildIndex(
    [
      asset(1, { date: "2026-08-01" }),
      asset(3, { date: "2026-08-03" }),
      asset(2, { date: "2026-08-03" }),
    ],
    { ...OPTS, pageSize: 10 }
  );
  const first = objects.find((o) => o.relKey.endsWith("all/first.json"));
  assert.deepEqual(
    first.body.items.map((i) => i.facts),
    ["fact 3", "fact 2", "fact 1"]
  );
});

test("cursor chain links every page and terminates cleanly", () => {
  const assets = ["2026-08-01", "2026-08-02", "2026-08-03", "2026-08-04", "2026-08-05"].map(
    (date, i) => asset(i, { date })
  );
  const { latest, objects } = buildIndex(assets, OPTS);
  const byKey = Object.fromEntries(objects.map((o) => [o.relKey, o.body]));

  let cursor = latest.feeds.all.firstPage;
  const seen = [];
  let hops = 0;
  while (cursor) {
    const page = byKey[cursor];
    assert.ok(page, `cursor "${cursor}" must resolve to an emitted chunk`);
    assert.equal(page.hasMore, page.nextCursor !== null);
    seen.push(...page.items.map((i) => i.storageKey));
    cursor = page.nextCursor;
    assert.ok(++hops < 10, "cursor chain must terminate");
  }
  assert.equal(seen.length, 5);
  assert.deepEqual(seen, [...new Set(seen)], "no item may appear on two pages");
});

test("cursor token encodes last-seen date and per-key tiebreaker", () => {
  const a = asset(1, { date: "2026-08-14" });
  const token = cursorToken({ ...a });
  assert.match(token, /^20260814_[0-9a-f]{10}$/);
  const b = asset(2, { date: "2026-08-14" });
  assert.notEqual(token, cursorToken(b), "same-date items must produce distinct cursors");
});

test("per-serviceType feeds contain only their own items", () => {
  const { latest, objects } = buildIndex(
    [
      asset(1, { date: "2026-08-01" }),
      asset(2, { date: "2026-08-02", serviceType: "Plumbing", sku: "TOILET-TANK-REPAIR" }),
    ],
    OPTS
  );
  assert.equal(latest.feeds.byServiceType.Electrical.count, 1);
  assert.equal(latest.feeds.byServiceType.Plumbing.count, 1);
  const plumbingFirst = objects.find((o) => o.relKey === latest.feeds.byServiceType.Plumbing.firstPage);
  assert.deepEqual(plumbingFirst.body.items.map((i) => i.serviceType), ["Plumbing"]);
});

test("per-city feeds live under city/ and carry only their own items", () => {
  const { latest, objects } = buildIndex(
    [
      asset(1, { date: "2026-08-01", city: "Ann Arbor" }),
      asset(2, { date: "2026-08-02", city: "St. Clair Shores" }),
      asset(3, { date: "2026-08-03", city: "Ann Arbor" }),
    ],
    { ...OPTS, pageSize: 10 }
  );
  assert.equal(latest.feeds.byCity["Ann Arbor"].count, 2);
  assert.equal(latest.feeds.byCity["St. Clair Shores"].count, 1);
  assert.equal(latest.feeds.byCity["Ann Arbor"].firstPage, `${OPTS.version}/city/ann-arbor/first.json`);
  assert.equal(
    latest.feeds.byCity["St. Clair Shores"].firstPage,
    `${OPTS.version}/city/st-clair-shores/first.json`
  );
  const annArbor = objects.find((o) => o.relKey === latest.feeds.byCity["Ann Arbor"].firstPage);
  assert.deepEqual(annArbor.body.items.map((i) => i.city), ["Ann Arbor", "Ann Arbor"]);
});

test("legacy null-city items appear in all/serviceType feeds but join no city feed", () => {
  const { latest, objects } = buildIndex(
    [asset(1, { date: "2026-08-01", city: null }), asset(2, { date: "2026-08-02", city: "Ann Arbor" })],
    { ...OPTS, pageSize: 10 }
  );
  assert.equal(latest.feeds.all.count, 2);
  assert.equal(latest.feeds.byServiceType.Electrical.count, 2);
  assert.deepEqual(Object.keys(latest.feeds.byCity), ["Ann Arbor"]);
  const first = objects.find((o) => o.relKey === latest.feeds.all.firstPage);
  assert.deepEqual(first.body.items.map((i) => i.city), ["Ann Arbor", null]);
});

test("two city spellings colliding on one slug refuse to publish", () => {
  assert.throws(
    () =>
      buildIndex(
        [
          asset(1, { date: "2026-08-01", city: "St. Louis" }),
          asset(2, { date: "2026-08-02", city: "St Louis" }),
        ],
        OPTS
      ),
    /feed slug collision/
  );
});

test("empty published set still emits a valid empty first page", () => {
  const { latest, objects } = buildIndex([asset(1, { date: "2026-08-01", status: "draft" })], OPTS);
  assert.equal(latest.feeds.all.count, 0);
  const first = objects.find((o) => o.relKey === latest.feeds.all.firstPage);
  assert.deepEqual(first.body, { items: [], nextCursor: null, hasMore: false });
});

test("mediaUrl derives from publicBaseUrl, null when unset", () => {
  const withBase = buildIndex([asset(1, { date: "2026-08-01" })], {
    ...OPTS,
    publicBaseUrl: "https://pub-example.r2.dev/",
  });
  const item = withBase.objects.find((o) => o.relKey.endsWith("all/first.json")).body.items[0];
  assert.equal(item.mediaUrl, `https://pub-example.r2.dev/${item.storageKey}`);
  assert.equal(item.sku, "SWITCH-REPLACE");

  const withoutBase = buildIndex([asset(1, { date: "2026-08-01" })], OPTS);
  assert.equal(
    withoutBase.objects.find((o) => o.relKey.endsWith("all/first.json")).body.items[0].mediaUrl,
    null
  );
});
