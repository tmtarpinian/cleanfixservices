import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { fetchManifest, fetchPage, firstPageFor } from './mediaIndexClient'

// latest.json is the one mutable object (60s edge cache); poll on the same
// rhythm so a publish mid-visit shows up without a reload.
export const useMediaManifest = () =>
  useQuery({
    queryKey: ['mediaManifest'],
    queryFn: ({ signal }) => fetchManifest(signal),
    staleTime: 60_000,
  })

// One cache entry per (snapshot version, feed): chunks are immutable, so a
// page never goes stale, and switching filters back restores instantly from
// cache. A new publish flips manifest.version, which keys a fresh query while
// in-flight paginators finish on the old snapshot (kept in R2 for 2 versions).
export const useMediaFeed = (manifest, feed) => {
  const firstPage = manifest ? firstPageFor(manifest, feed) : null
  return useInfiniteQuery({
    queryKey: ['mediaFeed', manifest?.version, feed],
    enabled: !!firstPage,
    initialPageParam: firstPage,
    queryFn: ({ pageParam, signal }) => fetchPage(pageParam, signal),
    getNextPageParam: page => (page.hasMore ? page.nextCursor : undefined),
    staleTime: Infinity,
  })
}

export const flattenFeed = data => (data ? data.pages.flatMap(page => page.items) : [])
