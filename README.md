# cleanfixservices

React site for [cleanfixservices.com](https://cleanfixservices.com). Built with Create React App.

```bash
npm install
npm start        # dev server at http://localhost:3000
npm run build    # production build in build/
```

## Portfolio media

Portfolio media lives in Cloudflare R2 (`cleanfix-media`), not the site bundle. The
page streams it through a **static pagination index**: pre-chunked, immutable JSON
snapshots published to `CleanfixMedia/_index/`, so the browser never lists the bucket
and only on-screen assets fetch bytes. Full contract, CLI commands, and testing
walkthrough: [`tools/media-index/README.md`](tools/media-index/README.md).

**Adding a job** happens on the machine that owns `tools/media-index/data/master.json`
(gitignored — the repo and bucket are public, drafts are not):

```bash
npm run media:add -- --sku SWITCH-REPLACE --media-type photo --date 2026-08-28 \
  --desc kitchen-3way --city "Ann Arbor" --facts "..." --upload path.jpg --status published
npm run media:publish        # writes a new index snapshot, flips latest.json
```

The site picks up a publish within ~60s (`latest.json` cache) — no rebuild or deploy.

**Frontend** (`src/pages/portfolio/`), one file per concern:

- `mediaIndexClient.js` — pure fetch functions for the index contract; `INDEX_BASE`
  comes from `REACT_APP_MEDIA_INDEX_BASE` (defaults to the public r2.dev host).
- `usePortfolioFeed.js` — React Query: a manifest query (60s stale time, matching the
  `latest.json` edge cache) plus `useInfiniteQuery` per feed, keyed by snapshot
  version so chunks cache forever and filter switches restore instantly.
- `useInView.js` — shared IntersectionObserver hook.
- `MediaTile.js` — tiles render a placeholder until they scroll near the viewport;
  only then does the media src hit R2 (videos load metadata only until played).
- `Portfolio.js` — filter chips from the manifest's `byServiceType` feeds, a city
  dropdown from `byCity`, and text search (city/serviceType/facts). Chips and the
  dropdown each select a server feed; search and combined filters narrow client-side,
  paging the feed eagerly to the end so results are complete. Infinite-scroll
  sentinel, lightbox.

Tests: `Portfolio.test.js` (mocked fetch + IntersectionObserver) — `npm test`.

## Calculators

Each estimator is a standalone component in `src/pages/calculators/calcs/` (one file per
calculator). The page renders whatever is in the `ACTIVE_CALCULATORS` array at the top of
`src/pages/calculators/Calculators.js` — **swapping a calculator in or out is adding or
removing a line there** (and its import). Array order is display order.

To add a new calculator, copy an existing one in `calcs/` — they're all built from the
shared pieces in `CalcParts.js` (`CalcCard`, `CalcResults`, `NumberField`, `Segmented`),
so a new one is mostly just the math. Rates and assumptions (paint coverage, per-foot
gutter rates, water cost) live as constants at the top of each calculator file for easy
tuning.

## Design system

Custom CSS, no framework (Bootstrap is being phased out). Brand tokens (colors, fonts)
are CSS custom properties in `src/styles/tokens.css`; shared primitives (buttons,
sections, form fields) in `src/styles/base.css`. Fonts are self-hosted variable woff2s
in `src/assets/fonts/`. Mobile-first — ~95% of traffic is phones.
