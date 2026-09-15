// routes/webhooks.js
var express = require('express');
var router = express.Router();
const { verifyHubspotSignature } = require('../middleware/verifyHubspotSignature');
const { handleDealStageChange } = require('../webhook/handlers/dealStageChange');
const { handleClosedWon } = require('../webhook/handlers/closedWon');

// Pipeline: Handyman Service
//   FirstContact: appointmentscheduled
//   Qualify Job: qualifiedtobuy
//   Quote Researched: decisionmakerboughtin
//   Quote Presented: contractsent
//   Closed Won: closedwon
//   Closed Lost: closedlost

router.post('/dispatch', verifyHubspotSignature, async (req, res) => {
  res.sendStatus(200);

  const events = Array.isArray(req.body) ? req.body : [req.body];

  for (const event of events) {
    try {
      if (event.subscriptionType === 'deal.propertyChange' && event.propertyName === 'dealstage') {
        if (event.propertyValue === 'closedwon') {
          await handleClosedWon(event);
        } else {
          await handleDealStageChange(event);
        }
      } else {
        console.log(`[dispatch] Unhandled event: ${event.subscriptionType} ${event.propertyName || ''}`);
      }
    } catch (err) {
      console.error(`[dispatch] Error:`, err.message);
    }
  }
});

module.exports = router;
