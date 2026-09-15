# cleanfix-hubspot-webhooks

Listens for a HubSpot deal-stage-change webhook. On `closedwon`, fetches
the deal's `job_site_address` and `number_of_trips`, calls the Google Maps
Distance Matrix API for one-way distance from the Cleanfix shop address,
computes round-trip mileage × trips, and writes it back to the deal's
`total_miliage` property (property name misspelled on purpose — it's the
real HubSpot internal name, not a typo in this code).

## Running this

Local + ngrok only — no hosted deployment for this tool.
```
npm install
cp .env.example .env   # fill in real values
npm run dev
ngrok http --url=cameo-disband-embroider.ngrok-free.dev 3000
```
Point HubSpot's webhook subscription at
`https://cameo-disband-embroider.ngrok-free.dev/webhooks/dispatch`.

## Unresolved: the Google Maps 401 on IP change

This was the original motivation for looking at Render, and running
local-only doesn't fix it — every new session on a new dynamic home IP
still means a 401 from Google until that IP is re-whitelisted on the
`GOOGLE_MAPS_KEY` restriction. Worth deciding deliberately rather than
just living with the recurring whitelist chore:

- **Drop the IP restriction on the key** and rely on the API restriction
  (Distance Matrix only) instead. The key lives server-side only (never
  reaches a browser), so IP restriction here is defense-in-depth, not the
  only thing standing between the key and misuse. This fully removes the
  session-to-session friction at the cost of that one layer of defense.
- **Keep the IP restriction and re-whitelist as needed** — the status quo,
  fine if this only comes up occasionally.

Not making this call for you since it's a real security tradeoff, not a
technical one.

## Cost guardrail

Every Distance Matrix call goes through `webhook/mapsUsageGuard.js`
first: a conservative daily call cap (default 15, `MAPS_DAILY_CALL_CAP`
env var) with a logged running cost estimate, and a required
`MAPS_ALLOW_OVERAGE=true` override to exceed it. At real Cleanfix volume
(a handful of closed-won deals a day, one Distance Matrix element per
deal) this cap will essentially never bind — it's there because any code
that spends real money gets a hard cap by default, not because the
projected spend is meaningful. Known limitation: the counter is in-memory
and resets whenever the local process restarts. Also set a
budget alert in Google Cloud Console (Billing → Budgets & alerts) on the
project owning `GOOGLE_MAPS_KEY` — that's the durable backstop, this
guardrail is a soft, best-effort one.

## Open items / things to confirm

- **Mileage rounding**: this reconstruction rounds to 2 decimal places
  (`Math.round(oneWayMiles * 2 * trips * 100) / 100`), matching what was
  last known to be running. If the live version before deletion actually
  forced an integer, that's a one-line change — flag it if `total_miliage`
  on real closed deals looks like it was always a whole number.
- **`CLEANFIX_ADDRESS`** in `webhook/handlers/closedWon.js` is set to
  `21015 Saint Francis St, Farmington Hills, MI 48336` — confirm that's
  still the correct origin address.
- No decorator/strategy pattern here on purpose: there are exactly two
  mutually exclusive event outcomes (`closedwon` vs. everything else), not
  a growing list of pluggable behaviors, so a strategy layer would be
  ceremony without a second implementation to justify it. If a third
  meaningfully different stage-driven behavior shows up later, that's the
  trigger to introduce one — not before.
