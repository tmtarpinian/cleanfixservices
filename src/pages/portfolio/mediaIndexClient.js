// Fetch layer for the R2 media index — plain functions, no React.
// Contract: tools/media-index/README.md ("Pagination contract").
//
//   GET {INDEX_BASE}/latest.json  -> manifest { version, pageSize, feeds }
//   GET {INDEX_BASE}/{firstPage}  -> { items, nextCursor, hasMore }
//   then follow nextCursor verbatim — it is an opaque chunk path.

export const INDEX_BASE =
  process.env.REACT_APP_MEDIA_INDEX_BASE ||
  'https://pub-f3ecb2b41c8e4e3080e5e5ae1a47e5c1.r2.dev/CleanfixMedia/_index'

export const ALL_FEED = 'all'

// Feed names are strings so they slot straight into query keys: 'all', a
// serviceType display name, or 'city:<City Name>' (colons can't appear in
// validated city names, so the prefix is unambiguous).
const CITY_PREFIX = 'city:'
export const cityFeed = city => CITY_PREFIX + city

const getJson = async (url, signal) => {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`media index: ${response.status} for ${url}`)
  return response.json()
}

export const fetchManifest = signal => getJson(`${INDEX_BASE}/latest.json`, signal)

export const fetchPage = (chunkPath, signal) => getJson(`${INDEX_BASE}/${chunkPath}`, signal)

// byCity is absent from manifests published before the city field existed.
export const firstPageFor = (manifest, feed) => {
  if (feed === ALL_FEED) return manifest.feeds.all.firstPage
  if (feed.startsWith(CITY_PREFIX)) {
    return manifest.feeds.byCity?.[feed.slice(CITY_PREFIX.length)]?.firstPage ?? null
  }
  return manifest.feeds.byServiceType[feed]?.firstPage ?? null
}

// mediaType enum is photo | video | timelapse; everything but photo plays.
export const isVideo = item => item.mediaType !== 'photo'
