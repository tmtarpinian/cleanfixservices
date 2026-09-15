// webhook/handlers/dealStageChange.js
async function handleDealStageChange(event) {
  console.log(`[deal-stage] Deal ${event.objectId} moved to stage ${event.propertyValue}`);
  // Non-closed-won stage changes are just logged for now. If you later
  // want stage-driven automation (e.g. a Slack ping on "Quote Presented"),
  // add it here as its own branch/handler — keep this dispatch-by-stage
  // shape rather than growing one big conditional.
}

module.exports = { handleDealStageChange };
