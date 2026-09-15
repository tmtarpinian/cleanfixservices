// webhook/mapsUsageGuard.js
//
// This service makes exactly one Distance Matrix element per closed-won
// deal (1 origin × 1 destination), which is billed money by Google once
// a project exceeds its free monthly SKU allowance. At Cleanfix's actual
// volume this will never realistically approach that allowance — but per
// standing policy, anything that calls a metered API gets a hard cap and
// a logged cost estimate by default, not just when someone remembers to
// ask for one.
//
// KNOWN LIMITATION: this counter is in-memory and resets on process
// restart. Render's free tier can restart/sleep the service, and a
// restart silently resets today's count to zero. That's an acceptable
// gap for a ~$0.005/call service used a handful of times a day, but it
// means this is a soft, best-effort guardrail — not a substitute for the
// hard budget alert you should also set in Google Cloud Console
// (Billing → Budgets & alerts) on the project that owns GOOGLE_MAPS_KEY.

// Google's list price for a basic Distance Matrix element is roughly
// $2–$5 per 1,000 elements depending on SKU/tier as of this writing.
// Using the higher end here is intentional — the estimate should never
// undersell what a run could cost.
const ESTIMATED_COST_PER_ELEMENT_USD = 0.005;

const DEFAULT_DAILY_CALL_CAP = 15; // generous for a solo handyman's daily close-won volume

let dayKey = null;
let callsToday = 0;

function todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD, UTC
}

function resetIfNewDay() {
  const key = todayKey();
  if (key !== dayKey) {
    dayKey = key;
    callsToday = 0;
  }
}

/**
 * Call before making a Distance Matrix request. Returns true if the call
 * is allowed to proceed, false if the daily cap has been hit and no
 * override is set.
 */
function allowMapsCall() {
  resetIfNewDay();

  const cap = Number(process.env.MAPS_DAILY_CALL_CAP) || DEFAULT_DAILY_CALL_CAP;
  const overrideEnabled = process.env.MAPS_ALLOW_OVERAGE === 'true';

  if (callsToday >= cap && !overrideEnabled) {
    console.error(
      `[maps-guard] Daily Distance Matrix cap reached (${callsToday}/${cap}). ` +
        `Skipping this call. Set MAPS_ALLOW_OVERAGE=true to deliberately override, ` +
        `or raise MAPS_DAILY_CALL_CAP if this cap is genuinely too low for real volume.`
    );
    return false;
  }

  callsToday += 1;
  const estimatedSpendToday = (callsToday * ESTIMATED_COST_PER_ELEMENT_USD).toFixed(4);
  console.log(
    `[maps-guard] Distance Matrix call ${callsToday}/${cap} today ` +
      `(est. ~$${estimatedSpendToday} spent today at $${ESTIMATED_COST_PER_ELEMENT_USD}/element)`
  );

  return true;
}

// Exposed for tests only — lets a test suite reset module-level state
// between runs without needing to reach into closures.
function _resetForTests() {
  dayKey = null;
  callsToday = 0;
}

module.exports = { allowMapsCall, _resetForTests, DEFAULT_DAILY_CALL_CAP, ESTIMATED_COST_PER_ELEMENT_USD };
