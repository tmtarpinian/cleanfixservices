// webhook/handlers/closedWon.js
const { allowMapsCall } = require('../mapsUsageGuard');

const CLEANFIX_ADDRESS = '21015 Saint Francis St, Farmington Hills, MI 48336'; // replace with your actual origin address

async function handleClosedWon(event) {
  console.log(`[closed-won] Deal ${event.objectId} closed-won`);

  // Fetch deal — make sure job_site_address and number_of_trips are in your deal properties
  const dealResp = await fetch(
    `https://api.hubapi.com/crm/v3/objects/deals/${event.objectId}?properties=job_site_address,number_of_trips,dealname,total_miliage`,
    { headers: { Authorization: `Bearer ${process.env.HUBSPOT_TOKEN}` } }
  );
  const deal = await dealResp.json();

  if (!dealResp.ok || !deal.properties) {
    console.error(
      `[closed-won] Deal fetch failed or returned no properties for objectId=${event.objectId}: ` +
        `HTTP ${dealResp.status} — ${JSON.stringify(deal)}`
    );
    return;
  }

  const { job_site_address, number_of_trips, dealname } = deal.properties || {};
  // NOTE: `total_miliage` is the actual HubSpot internal property name
  // (typo, can't be renamed without a property migration) — not a
  // stand-in for a "real" spelling. Every reference to it in this file
  // is intentional.
  const existingTotalMileage = deal.properties?.total_miliage || null;

  if (!job_site_address) {
    console.log(`[closed-won] No job_site_address on deal ${dealname}, skipping mileage calc`);
    return;
  }

  const trips = parseInt(number_of_trips, 10) || 1;

  if (!allowMapsCall()) {
    console.error(`[closed-won] Skipping Distance Matrix call for deal ${dealname} — daily cost cap reached`);
    return;
  }

  // Google Maps Distance Matrix
  const origin = encodeURIComponent(CLEANFIX_ADDRESS);
  const dest = encodeURIComponent(job_site_address);
  const mapsResp = await fetch(
    `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${dest}&units=imperial&key=${process.env.GOOGLE_MAPS_KEY}`
  );
  const mapsData = await mapsResp.json();
  console.log(`[closed-won] Distance Matrix response for "${job_site_address}":`, JSON.stringify(mapsData, null, 2));

  // Prefer element status but also check overall status
  const element = mapsData.rows?.[0]?.elements?.[0];
  if (!element || mapsData.status !== 'OK' || element.status !== 'OK') {
    console.error(`[closed-won] Distance lookup failed for "${job_site_address}":`, mapsData.status || element?.status);
    return;
  }

  // Distance comes back in meters (value) even though text is in miles
  const distanceMeters = element.distance && element.distance.value;
  if (typeof distanceMeters !== 'number') {
    console.error('[closed-won] Unexpected distance value from Maps API:', element.distance);
    return;
  }

  const oneWayMiles = distanceMeters / 1609.34;
  const totalMileage = Math.round(oneWayMiles * 2 * trips * 100) / 100; // round-trip × trips

  console.log(
    `[closed-won] ${dealname}: origin="${mapsData.origin_addresses?.[0]}", ` +
      `destination="${mapsData.destination_addresses?.[0]}", ${oneWayMiles.toFixed(1)} mi one-way × ${trips} trips × 2 = ${totalMileage} total miles`
  );

  if (existingTotalMileage && parseFloat(existingTotalMileage) === totalMileage) {
    return console.log(`[closed-won] Mileage already up to date on deal ${dealname}, skipping writeback`);
  }

  // Write back to HubSpot
  const updateResp = await fetch(`https://api.hubapi.com/crm/v3/objects/deals/${event.objectId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${process.env.HUBSPOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        total_miliage: String(totalMileage),
      },
    }),
  });

  if (!updateResp.ok) {
    console.error(`[closed-won] Writeback failed: ${updateResp.status} ${await updateResp.text()}`);
  } else {
    console.log(`[closed-won] Deal ${event.objectId} mileage updated: ${totalMileage} mi`);
  }
}

module.exports = { handleClosedWon };
