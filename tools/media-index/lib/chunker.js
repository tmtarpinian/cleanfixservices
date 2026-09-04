const crypto = require("node:crypto");

// Pure index-shaping logic: no I/O, no environment. Everything here is
// deterministic given (assets, options), which is what makes the cursor
// chain unit-testable and republishes reproducible.

const DEFAULT_PAGE_SIZE = 24;

function feedSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
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
    city: asset.city ?? null,
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

function groupBy(items, keyOf) {
  const groups = new Map();
  for (const item of items) {
    const name = keyOf(item);
    if (name == null) continue;
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(item);
  }
  return groups;
}

function buildIndex(assets, { version, pageSize = DEFAULT_PAGE_SIZE, publicBaseUrl = null, generatedAt }) {
  const published = sortPublished(assets).map((a) => toPublicItem(a, publicBaseUrl));

  const objects = [];
  const emitFeeds = (groups, slugPrefix = "") => {
    const meta = {};
    const slugs = new Map();
    for (const [name, items] of groups) {
      const slug = slugPrefix + feedSlug(name);
      // Two distinct names on one chunk path ("St. Louis" vs "St Louis")
      // would silently overwrite each other's pages — almost always a typo.
      if (slugs.has(slug)) {
        throw new Error(
          `feed slug collision: "${name}" and "${slugs.get(slug)}" both map to "${slug}" — fix the spelling in master.json`
        );
      }
      slugs.set(slug, name);
      const feed = buildFeed(items, { version, slug, pageSize });
      objects.push(...feed.objects);
      meta[name] = { firstPage: feed.firstPage, count: feed.count };
    }
    return meta;
  };

  const { all } = emitFeeds(new Map([["all", published]]));
  const byServiceType = emitFeeds(groupBy(published, (i) => i.serviceType));
  // City chunks live under <version>/city/<slug>/ so a city name can never
  // collide with a serviceType feed path. Legacy items with city: null appear
  // only in the all + serviceType feeds.
  const byCity = emitFeeds(groupBy(published, (i) => i.city), "city/");

  const latest = { version, generatedAt, pageSize, feeds: { all, byServiceType, byCity } };
  return { latest, objects };
}

module.exports = { DEFAULT_PAGE_SIZE, feedSlug, cursorToken, sortPublished, toPublicItem, buildIndex };
