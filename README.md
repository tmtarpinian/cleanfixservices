# cleanfixservices

React site for [cleanfixservices.com](https://cleanfixservices.com). Built with Create React App.

```bash
npm install
npm start        # dev server at http://localhost:3000
npm run build    # production build in build/
```

## Portfolio media

The portfolio page builds itself from the files in `src/assets/portfolio/`. There is no
data file to edit — **adding a job = dropping a correctly named file in that folder.**
Metadata (category, city, sort order) is parsed from the filename, and the filter chips
are generated from whatever categories exist.

### Filename convention

```
<category>--<city-slug>--<date>.<ext>
```

- **`category`** — lowercase, one word shown on the filter chip: `painting`, `plumbing`,
  `electrical`, `landscaping`. New categories work automatically and get their own chip.
- **`city-slug`** — lowercase, hyphens for spaces: `farmington-hills` → displays as
  "Farmington Hills".
- **`date`** — `YYYY-MM-DD` job date. Tiles are sorted newest-first by this value. If two
  jobs share category/city/date, add a suffix: `2026-08-01a`, `2026-08-01b`.
- The two-hyphen separator `--` is required between the three parts.

### Photos vs. videos

- **Photo**: one file — `.jpg`, `.jpeg`, `.png`, or `.webp`.
- **Video**: two files with the **same basename** — the video (`.mp4` or `.webm`) plus a
  poster image (`.jpg` etc.) used for the grid tile and the frame shown before playback.
  Video tiles automatically get a play badge, and the lightbox plays them with controls.

### Example file tree

```
src/assets/portfolio/
├── painting--farmington-hills--2026-06-01.jpg     # photo
├── plumbing--northville--2026-07-15.jpg           # photo
├── landscaping--novi--2026-08-09.mp4              # video
├── landscaping--novi--2026-08-09.jpg              # └─ its poster frame (same basename)
└── electrical--livonia--2026-08-20.webp           # photo
```

Practical tips: keep photos ≲1600px on the long edge and videos short/compressed (they
ship with the site bundle), and portrait orientation looks best in the masonry grid.

The parsing logic lives in `src/pages/portfolio/portfolioData.js`.

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
