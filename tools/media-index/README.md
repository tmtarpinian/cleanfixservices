# Cleanfix portfolio media index

Static, pre-chunked pagination index for `cleanfix-media` (Cloudflare R2).
The browser never lists the bucket: it fetches small immutable JSON chunks
and only touches R2 for media bytes of assets actually on screen.

## Layout in R2

```
CleanfixMedia/_index/latest.json                     mutable pointer, 60s cache
CleanfixMedia/_index/<version>/all/first.json        immutable chunk, cached forever
CleanfixMedia/_index/<version>/all/after-<cursor>.json
CleanfixMedia/_index/<version>/electrical/first.json ... (one feed per serviceType)
```

`<version>` = `vYYYYMMDDTHHMMSSZ` snapshot stamp. Each publish writes a new
version, flips `latest.json`, and prunes all but the last 2 versions so
in-flight paginators finish on a consistent snapshot.

## Pagination contract (what the frontend builds against)

```
GET {INDEX_BASE}/latest.json
  -> { version, generatedAt, pageSize,
       feeds: { all: { firstPage, count },
                byServiceType: { "Electrical": { firstPage, count }, ... } } }

GET {INDEX_BASE}/{firstPage}                # then follow nextCursor
  -> { items: [MediaAsset...], nextCursor: "<opaque>" | null, hasMore: bool }
```

`INDEX_BASE` = `https://<public r2.dev host>/CleanfixMedia/_index`.
`nextCursor` is opaque — pass it back as-is (`fetch(INDEX_BASE + "/" + cursor)`).
Internally it encodes snapshot version, feed, last-seen date, and a
storageKey-hash tiebreaker (keyset pagination, not offsets).

Item shape: `{ sku, serviceType, mediaType, date, facts, portfolioUrl,
storageKey, mediaUrl }`. Only `published` assets ever appear.

## Source of truth

`data/master.json` — every asset in every status (`draft|published|archived`).
**Gitignored on purpose**: the repo is public and draft/archived entries are
private. It exists only on the machine that runs uploads; keep it in your
normal machine backups.

`categoryMap.json` — serviceType → SKU list, mirrored from the HubSpot product
catalog (`hs_sku`). Adding a SKU to HubSpot means adding it here too; unknown
SKUs fail validation loudly instead of guessing.

## Commands

```
npm run media:add -- --sku SWITCH-REPLACE --media-type photo --date 2026-08-28 \
  --desc kitchen-3way --facts "..." [--status published] [--upload path.jpg]
npm run media:status -- --key <storageKey> --status published
npm run media:publish -- [--backend r2|local] [--dry-run]
npm run media:test
```

Credentials come from the repo-root `.env` (gitignored):
`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`,
`R2_PUBLIC_BASE_URL`.

## Testing walkthrough (real bucket)

Prereq: fill the repo-root `.env` with the five variables above. Test assets
use a `-test` suffix in SHORTDESC so they are easy to find and delete later.

**1. Reset the smoke-test master** (its entries have no real bytes behind them):

```
rm -f tools/media-index/data/master.json
```

**2. Seed 6 assets — 5 published across 3 serviceTypes (two sharing a date to
exercise the sort tiebreaker) + 1 draft to prove exclusion.** `--upload` puts
the bytes to R2 and writes the master entry in one step; any small image works:

```
npm run media:add -- --sku SWITCH-REPLACE   --media-type photo --date 2026-08-20 --desc stair-test   --upload test.jpg --status published --facts "Test asset 1"
npm run media:add -- --sku OUTLET-REPLACE   --media-type photo --date 2026-08-22 --desc gfci-test    --upload test.jpg --status published --facts "Test asset 2"
npm run media:add -- --sku FIXTURE-REPLACE  --media-type photo --date 2026-08-25 --desc porch-test   --upload test.jpg --status published --facts "Test asset 3"
npm run media:add -- --sku TOILET-TANK-REPAIR --media-type photo --date 2026-08-25 --desc valve-test --upload test.jpg --status published --facts "Test asset 4 (same date as 3: tiebreaker)"
npm run media:add -- --sku GUTTER-CLEAN     --media-type photo --date 2026-08-27 --desc ranch-test   --upload test.jpg --status published --facts "Test asset 5"
npm run media:add -- --sku CARTRIDGE-SHOWER --media-type photo --date 2026-08-27 --desc moen-test    --upload test.jpg --status draft     --facts "Draft: must never appear publicly"
```

Expect: each command prints `uploaded ... -> CleanfixMedia/...` and
`added to master index (N entries total)`. A bad SKU, malformed date, or a
`portfolio-url` on a draft must fail with a named validator error — try one
on purpose.

**3. Publish** (small page size so pagination is observable with 5 items;
production default is 24):

```
npm run media:publish -- --dry-run --page-size 2   # plan only, writes nothing
npm run media:publish -- --page-size 2             # real publish to R2
```

Expect: `5 published assets` (not 6), one `all` feed of 3 pages
(first.json -> after-...json -> after-...json), per-serviceType feeds for
Electrical / Plumbing / Gutter Cleaning only, then
`put CleanfixMedia/_index/latest.json -> v<stamp>`.

**4. Verify over the public URL** — follow the cursor chain exactly as the
frontend will:

```
BASE="$R2_PUBLIC_BASE_URL/CleanfixMedia/_index"
curl -s "$BASE/latest.json" | python3 -m json.tool          # feeds.all.count == 5
FIRST=$(curl -s "$BASE/latest.json" | python3 -c "import sys,json;print(json.load(sys.stdin)['feeds']['all']['firstPage'])")
curl -s "$BASE/$FIRST" | python3 -m json.tool               # 2 items, hasMore true
# then fetch $BASE/<nextCursor> twice more; final page: nextCursor null, hasMore false
```

Checks: draft asset appears on no page; same-date items (3 and 4) have
distinct cursors and a stable order; every mediaUrl loads in a browser.

**5. Republish to test snapshot pruning:** run step 3 again twice — the third
publish must report `pruned` the oldest version, and `latest.json` must point
at the newest.

**Cleanup later:** delete the `*-test.*` objects in the R2 dashboard, delete
their master entries (or rm master.json), republish.



08-30-2026 test commands
npm run media:add -- --sku FIXTURE-FAN-TO-LIGHT --media-type timelapse --date 2026-08-15 \
  --desc handyman-video-test --upload ~/Desktop/cfs-test/FIXTURE-FAN-TO-LIGHT-TIMELAPSE-20260815.mp4 --status published --facts "Test asset 1"

  OUTLET-REPLACE-PHOTO-20260627.jpg

  General Handyman-VIDEO-20260820
  GUTTER-CLEAN-PHOTO-20241122.jpg
  TOILET-TANK-REPAIR-PHOTO-20241125_test.jpg
  FIXTURE-FAN-TO-LIGHT-TIMELAPSE-20260815.mp4

  curl https://pub-f3ecb2b41c8e4e3080e5e5ae1a47e5c1.r2.dev/CleanfixMedia/_index/latest.json

  curl -s "$BASE/v20260831T000124Z/all/after-20260814_a60241108a.json" | python3 -m json.tool 