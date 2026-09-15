// middleware/verifyHubspotSignature.js
//
// Implements HubSpot's webhook signature v3 scheme:
// https://developers.hubspot.com/docs/api/webhooks/validating-requests
//
// sourceString = HTTP method + full request URI + raw request body + timestamp
// expected signature = base64(HMAC-SHA256(sourceString, app client secret))
// compared against the X-HubSpot-Signature-v3 header.
//
// Also rejects requests whose X-HubSpot-Request-Timestamp is outside a
// 5-minute window, per HubSpot's replay-protection recommendation.
//
// Requires req.rawBody to be populated (see app.js's express.json verify
// callback) — signing must happen over the exact bytes received, not a
// re-serialized version of the parsed body, or valid signatures will fail.

const crypto = require('crypto');

const MAX_TIMESTAMP_AGE_MS = 5 * 60 * 1000; // 5 minutes

function verifyHubspotSignature(req, res, next) {
  const secret = process.env.HUBSPOT_CLIENT_SECRET;
  if (!secret) {
    console.error('[webhook-auth] HUBSPOT_CLIENT_SECRET not set — refusing to process unverified webhook');
    return res.sendStatus(500);
  }

  const signature = req.get('x-hubspot-signature-v3');
  const timestamp = req.get('x-hubspot-request-timestamp');

  if (!signature || !timestamp) {
    console.warn('[webhook-auth] Missing signature or timestamp header — rejecting');
    return res.sendStatus(401);
  }

  const age = Date.now() - Number(timestamp);
  if (!Number.isFinite(age) || Math.abs(age) > MAX_TIMESTAMP_AGE_MS) {
    console.warn(`[webhook-auth] Timestamp outside allowed window (age=${age}ms) — rejecting`);
    return res.sendStatus(401);
  }

  const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  const sourceString = req.method + fullUrl + (req.rawBody || '') + timestamp;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(sourceString, 'utf8')
    .digest('base64');

  const expectedBuf = Buffer.from(expectedSignature);
  const actualBuf = Buffer.from(signature);

  // Buffers must be equal length before timingSafeEqual — mismatched
  // lengths throw rather than returning false.
  const isValid = expectedBuf.length === actualBuf.length && crypto.timingSafeEqual(expectedBuf, actualBuf);

  if (!isValid) {
    console.warn('[webhook-auth] Signature mismatch — rejecting');
    return res.sendStatus(401);
  }

  next();
}

module.exports = { verifyHubspotSignature };
