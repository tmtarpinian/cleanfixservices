// test/dispatch.test.js
//
// Strategy: start the real app on an ephemeral port and POST real HTTP
// requests to it (so we're testing actual routing behavior, not a mock
// of it). Outbound calls the handlers make to HubSpot/Google Maps go
// through global.fetch, which we swap for a mock per-test so no real
// network calls happen and we can assert on exactly what was requested.
//
// Every request must carry a valid HubSpot signature v3 header now that
// verifyHubspotSignature runs in front of /webhooks/dispatch — see
// signRequest() below. This suite is testing dispatch/handler behavior,
// not the signature check itself (that's covered in its own dedicated
// test file), so we always sign correctly here.

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const crypto = require('node:crypto');

const app = require('../app');
const mapsGuard = require('../webhook/mapsUsageGuard');

const TEST_CLIENT_SECRET = 'test-webhook-dispatch-secret';

let server;
let baseUrl;
let originalFetch;
let originalClientSecret;
let fetchCalls;

beforeEach(async () => {
  fetchCalls = [];
  originalFetch = global.fetch;
  originalClientSecret = process.env.HUBSPOT_CLIENT_SECRET;
  process.env.HUBSPOT_CLIENT_SECRET = TEST_CLIENT_SECRET;
  mapsGuard._resetForTests();
  delete process.env.MAPS_DAILY_CALL_CAP;
  delete process.env.MAPS_ALLOW_OVERAGE;

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  baseUrl = `http://localhost:${port}`;
});

afterEach(async () => {
  global.fetch = originalFetch;
  process.env.HUBSPOT_CLIENT_SECRET = originalClientSecret;
  await new Promise((resolve) => server.close(resolve));
});

function signRequest(method, url, body, timestamp) {
  const sourceString = method + url + body + timestamp;
  return crypto.createHmac('sha256', TEST_CLIENT_SECRET).update(sourceString, 'utf8').digest('base64');
}

function postDispatch(bodyObj) {
  const url = `${baseUrl}/webhooks/dispatch`;
  const body = JSON.stringify(bodyObj);
  const timestamp = Date.now().toString();
  const signature = signRequest('POST', url, body, timestamp);

  return originalFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hubspot-signature-v3': signature,
      'x-hubspot-request-timestamp': timestamp,
    },
    body,
  });
}

describe('POST /webhooks/dispatch', () => {
  test('closedwon event fetches the deal, calls Distance Matrix, and writes the exact mileage back', async () => {
    global.fetch = async (url, opts) => {
      const urlStr = url.toString();

      if (urlStr.includes('api.hubapi.com/crm/v3/objects/deals/456') && (!opts || opts.method === undefined)) {
        fetchCalls.push({ url: urlStr, method: 'GET' });
        return {
          ok: true,
          json: async () => ({
            properties: {
              job_site_address: '123 Test St, Detroit, MI',
              number_of_trips: '2',
              dealname: 'Test Deal',
              total_miliage: null,
            },
          }),
        };
      }

      if (urlStr.includes('maps.googleapis.com/maps/api/distancematrix')) {
        fetchCalls.push({ url: urlStr, method: 'GET' });
        return {
          ok: true,
          json: async () => ({
            status: 'OK',
            origin_addresses: ['21015 Saint Francis St, Farmington Hills, MI 48336'],
            destination_addresses: ['123 Test St, Detroit, MI'],
            rows: [{ elements: [{ status: 'OK', distance: { value: 16093 } }] }], // 10 miles one-way
          }),
        };
      }

      if (urlStr.includes('api.hubapi.com/crm/v3/objects/deals/456') && opts?.method === 'PATCH') {
        fetchCalls.push({ url: urlStr, method: 'PATCH', body: opts.body });
        return { ok: true, json: async () => ({}) };
      }

      throw new Error(`Unexpected fetch call in test: ${urlStr}`);
    };

    await postDispatch({
      subscriptionType: 'deal.propertyChange',
      propertyName: 'dealstage',
      propertyValue: 'closedwon',
      objectId: 456,
    });
    await new Promise((resolve) => setImmediate(resolve));

    const mapsCall = fetchCalls.find((c) => c.url.includes('distancematrix'));
    const patchCall = fetchCalls.find((c) => c.method === 'PATCH');

    assert.ok(mapsCall, 'expected a Distance Matrix call');
    assert.ok(patchCall, 'expected a PATCH writeback to the deal');

    // 16093m = 10.0 mi one-way; round trip (×2) × 2 trips = 40 total miles
    const patchBody = JSON.parse(patchCall.body);
    assert.equal(patchBody.properties.total_miliage, '40');
  });

  test('closedwon event skips writeback when mileage already matches', async () => {
    global.fetch = async (url, opts) => {
      const urlStr = url.toString();

      if (urlStr.includes('/deals/789') && (!opts || opts.method === undefined)) {
        return {
          ok: true,
          json: async () => ({
            properties: {
              job_site_address: '123 Test St, Detroit, MI',
              number_of_trips: '2',
              dealname: 'Already Up To Date Deal',
              total_miliage: '40', // matches what this event would compute
            },
          }),
        };
      }

      if (urlStr.includes('distancematrix')) {
        return {
          ok: true,
          json: async () => ({
            status: 'OK',
            origin_addresses: ['21015 Saint Francis St, Farmington Hills, MI 48336'],
            destination_addresses: ['123 Test St, Detroit, MI'],
            rows: [{ elements: [{ status: 'OK', distance: { value: 16093 } }] }],
          }),
        };
      }

      if (opts?.method === 'PATCH') {
        throw new Error('should not have written back — mileage already matches');
      }

      throw new Error(`Unexpected fetch call in test: ${urlStr}`);
    };

    await postDispatch({
      subscriptionType: 'deal.propertyChange',
      propertyName: 'dealstage',
      propertyValue: 'closedwon',
      objectId: 789,
    });
    await new Promise((resolve) => setImmediate(resolve));
    // No assertion needed beyond "no throw" — the mock itself throws if
    // a PATCH is attempted, which would fail the test.
  });

  test('closedwon event with no job_site_address skips mileage calc entirely', async () => {
    global.fetch = async (url) => {
      const urlStr = url.toString();

      if (urlStr.includes('/deals/999')) {
        return {
          ok: true,
          json: async () => ({
            properties: { dealname: 'No Address Deal' }, // no job_site_address
          }),
        };
      }

      throw new Error(`Unexpected fetch call in test: ${urlStr}`);
    };

    await postDispatch({
      subscriptionType: 'deal.propertyChange',
      propertyName: 'dealstage',
      propertyValue: 'closedwon',
      objectId: 999,
    });
    await new Promise((resolve) => setImmediate(resolve));
    // Mock throws on any unexpected call (e.g. distancematrix), so a
    // clean run here proves the handler returned early.
  });

  test('non-closedwon dealstage change does not touch Maps or HubSpot writeback', async () => {
    global.fetch = async (url) => {
      throw new Error(`Unexpected fetch call in test: ${url}`);
    };

    await postDispatch({
      subscriptionType: 'deal.propertyChange',
      propertyName: 'dealstage',
      propertyValue: 'appointmentscheduled',
      objectId: 111,
    });
    await new Promise((resolve) => setImmediate(resolve));
    // No fetch call expected at all; mock throws if one happens.
  });

  test('rejects dispatch with no HubSpot signature headers', async () => {
    const res = await originalFetch(`${baseUrl}/webhooks/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscriptionType: 'deal.propertyChange',
        propertyName: 'dealstage',
        propertyValue: 'closedwon',
        objectId: 1,
      }),
    });

    assert.equal(res.status, 401);
  });

  test('cost guardrail: blocks the Distance Matrix call once the daily cap is hit, without erroring the request', async () => {
    process.env.MAPS_DAILY_CALL_CAP = '1';
    let distanceMatrixCalls = 0;

    global.fetch = async (url, opts) => {
      const urlStr = url.toString();

      if (urlStr.includes('/deals/')) {
        return {
          ok: true,
          json: async () => ({
            properties: {
              job_site_address: '123 Test St, Detroit, MI',
              number_of_trips: '1',
              dealname: 'Capped Deal',
              total_miliage: null,
            },
          }),
        };
      }

      if (urlStr.includes('distancematrix')) {
        distanceMatrixCalls += 1;
        return {
          ok: true,
          json: async () => ({
            status: 'OK',
            origin_addresses: ['origin'],
            destination_addresses: ['dest'],
            rows: [{ elements: [{ status: 'OK', distance: { value: 1609 } }] }],
          }),
        };
      }

      if (opts?.method === 'PATCH') {
        return { ok: true, json: async () => ({}) };
      }

      throw new Error(`Unexpected fetch call in test: ${urlStr}`);
    };

    // First closed-won event: within cap (cap=1), should call Distance Matrix.
    await postDispatch({
      subscriptionType: 'deal.propertyChange',
      propertyName: 'dealstage',
      propertyValue: 'closedwon',
      objectId: 201,
    });
    await new Promise((resolve) => setImmediate(resolve));

    // Second closed-won event same day: cap already hit, should be skipped.
    await postDispatch({
      subscriptionType: 'deal.propertyChange',
      propertyName: 'dealstage',
      propertyValue: 'closedwon',
      objectId: 202,
    });
    await new Promise((resolve) => setImmediate(resolve));

    assert.equal(distanceMatrixCalls, 1, 'expected only one Distance Matrix call before the cap blocked the second');
  });
});
