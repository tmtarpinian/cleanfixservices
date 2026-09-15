// test/verifyHubspotSignature.test.js
const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');

const { verifyHubspotSignature } = require('../middleware/verifyHubspotSignature');

const SECRET = 'unit-test-secret';
const METHOD = 'POST';
const HOST = 'cameo-disband-embroider.ngrok-free.dev';
const PATH = '/webhooks/dispatch';
const BODY = JSON.stringify({ subscriptionType: 'deal.propertyChange' });

function sign({ method = METHOD, host = HOST, path = PATH, body = BODY, timestamp, secret = SECRET }) {
  const fullUrl = `https://${host}${path}`;
  const sourceString = method + fullUrl + body + timestamp;
  return crypto.createHmac('sha256', secret).update(sourceString, 'utf8').digest('base64');
}

function makeReq({ signature, timestamp, body = BODY, method = METHOD, host = HOST, path = PATH }) {
  const headers = { host };
  if (signature !== undefined) headers['x-hubspot-signature-v3'] = signature;
  if (timestamp !== undefined) headers['x-hubspot-request-timestamp'] = timestamp;

  return {
    method,
    protocol: 'https',
    originalUrl: path,
    rawBody: body,
    get(headerName) {
      const key = headerName.toLowerCase();
      return headers[key];
    },
  };
}

function makeRes() {
  const res = { statusCode: null, sent: false };
  res.sendStatus = (code) => {
    res.statusCode = code;
    res.sent = true;
    return res;
  };
  return res;
}

describe('verifyHubspotSignature', () => {
  let originalSecret;

  beforeEach(() => {
    originalSecret = process.env.HUBSPOT_CLIENT_SECRET;
    process.env.HUBSPOT_CLIENT_SECRET = SECRET;
  });

  afterEach(() => {
    process.env.HUBSPOT_CLIENT_SECRET = originalSecret;
  });

  test('500s and does not call next when HUBSPOT_CLIENT_SECRET is unset', () => {
    delete process.env.HUBSPOT_CLIENT_SECRET;
    const req = makeReq({ signature: 'irrelevant', timestamp: Date.now().toString() });
    const res = makeRes();
    let nextCalled = false;

    verifyHubspotSignature(req, res, () => {
      nextCalled = true;
    });

    assert.equal(res.statusCode, 500);
    assert.equal(nextCalled, false);
  });

  test('401s when signature header is missing', () => {
    const req = makeReq({ timestamp: Date.now().toString() });
    const res = makeRes();
    let nextCalled = false;

    verifyHubspotSignature(req, res, () => {
      nextCalled = true;
    });

    assert.equal(res.statusCode, 401);
    assert.equal(nextCalled, false);
  });

  test('401s when timestamp header is missing', () => {
    const req = makeReq({ signature: 'irrelevant' });
    const res = makeRes();
    let nextCalled = false;

    verifyHubspotSignature(req, res, () => {
      nextCalled = true;
    });

    assert.equal(res.statusCode, 401);
    assert.equal(nextCalled, false);
  });

  test('401s when timestamp is outside the 5-minute window', () => {
    const staleTimestamp = (Date.now() - 10 * 60 * 1000).toString(); // 10 min old
    const signature = sign({ timestamp: staleTimestamp });
    const req = makeReq({ signature, timestamp: staleTimestamp });
    const res = makeRes();
    let nextCalled = false;

    verifyHubspotSignature(req, res, () => {
      nextCalled = true;
    });

    assert.equal(res.statusCode, 401);
    assert.equal(nextCalled, false);
  });

  test('401s on a signature that does not match', () => {
    const timestamp = Date.now().toString();
    const req = makeReq({ signature: 'not-the-right-signature', timestamp });
    const res = makeRes();
    let nextCalled = false;

    verifyHubspotSignature(req, res, () => {
      nextCalled = true;
    });

    assert.equal(res.statusCode, 401);
    assert.equal(nextCalled, false);
  });

  test('calls next() on a valid signature within the time window', () => {
    const timestamp = Date.now().toString();
    const signature = sign({ timestamp });
    const req = makeReq({ signature, timestamp });
    const res = makeRes();
    let nextCalled = false;

    verifyHubspotSignature(req, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(res.sent, false);
  });

  test('401s if the body was tampered with after signing (rawBody mismatch)', () => {
    const timestamp = Date.now().toString();
    const signature = sign({ timestamp, body: BODY });
    const req = makeReq({ signature, timestamp, body: JSON.stringify({ tampered: true }) });
    const res = makeRes();
    let nextCalled = false;

    verifyHubspotSignature(req, res, () => {
      nextCalled = true;
    });

    assert.equal(res.statusCode, 401);
    assert.equal(nextCalled, false);
  });
});
