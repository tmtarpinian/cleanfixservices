const crypto = require("node:crypto");

// Pure index-shaping logic: no I/O, no environment. Everything here is
// deterministic given (assets, options), which is what makes the cursor
// chain unit-testable and republishes reproducible.

const DEFAULT_PAGE_SIZE = 24;

function feedSlug(name) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

// Keyset cursor: last-seen sort key (compact date) + tiebreaker (hash of the
// storageKey, the natural unique id). Clients treat the whole token as opaque.
function cursorToken(item) {
  const hash = crypto.createHash("sha1").update(item.storageKey).digest("hex").slice(0, 10);
  return `${item.date.replaceAll("-", "")}_${hash}`;
}

function sortPublished(assets) {
  return assets
    .filter((a) => a.portfolioStatus === "published")
    .slice()
    .sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1;
      return a.storageKey < b.storageKey ? 1 : -1;
    });
}

function toPublicItem(asset, publicBaseUrl) {
  return {
    sku: asset.storageKey.split("/")[1],
    serviceType: asset.serviceType,
    mediaType: asset.mediaType,
    date: asset.date,
    facts: asset.facts,
    portfolioUrl: asset.portfolioUrl ?? null,
    storageKey: asset.storageKey,
    mediaUrl: publicBaseUrl ? `${publicBaseUrl.replace(/\/+$/, "")}/${asset.storageKey}` : null,
  };
}

function buildFeed(items, { version, slug, pageSize }) {
  const pages = [];
  for (let i = 0; i < items.length; i += pageSize) pages.push(items.slice(i, i + pageSize));
  if (pages.length === 0) pages.push([]);

  const firstPage = `${version}/${slug}/first.json`;
  const objects = [];
  let relKey = firstPage;
  pages.forEach((page, idx) => {
    const hasMore = idx < pages.length - 1;
    const nextCursor = hasMore
      ? `${version}/${slug}/after-${cursorToken(page[page.length - 1])}.json`
      : null;
    objects.push({ relKey, body: { items: page, nextCursor, hasMore } });
    relKey = nextCursor;
  });
  return { firstPage, count: items.length, objects };
}

function buildIndex(assets, { version, pageSize = DEFAULT_PAGE_SIZE, publicBaseUrl = null, generatedAt }) {
  const published = sortPublished(assets).map((a) => toPublicItem(a, publicBaseUrl));

  const feeds = new Map([["all", published]]);
  for (const item of published) {
    if (!feeds.has(item.serviceType)) feeds.set(item.serviceType, []);
    feeds.get(item.serviceType).push(item);
  }

  const objects = [];
  const feedsMeta = {};
  for (const [name, items] of feeds) {
    const feed = buildFeed(items, { version, slug: feedSlug(name), pageSize });
    objects.push(...feed.objects);
    feedsMeta[name] = { firstPage: feed.firstPage, count: feed.count };
  }

  const { all, ...byServiceType } = feedsMeta;
  const latest = { version, generatedAt, pageSize, feeds: { all, byServiceType } };
  return { latest, objects };
}

module.exports = { DEFAULT_PAGE_SIZE, feedSlug, cursorToken, sortPublished, toPublicItem, buildIndex };
