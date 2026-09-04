const test = require("node:test");
const assert = require("node:assert/strict");

const { validateAsset } = require("../lib/schema");

const CATEGORY_MAP = {
  Electrical: ["SWITCH-REPLACE", "FIXTURE-FAN-TO-FAN"],
  Plumbing: ["TOILET-TANK-REPAIR"],
  "Gutter Cleaning": ["GUTTER-CLEAN"],
};

function validAsset(overrides = {}) {
  return {
    serviceType: "Electrical",
    mediaType: "photo",
    portfolioStatus: "published",
    facts: "Replaced a failing 3-way switch pair controlling the stair lights.",
    date: "2026-08-14",
    city: "Ann Arbor",
    storageKey: "CleanfixMedia/SWITCH-REPLACE/SWITCH-REPLACE-PHOTO-20260814-stair-3way.jpg",
    portfolioUrl: null,
    ...overrides,
  };
}

test("valid published asset passes", () => {
  assert.deepEqual(validateAsset(validAsset(), CATEGORY_MAP), []);
});

test("hyphenated SKU parses against the MEDIATYPE segment", () => {
  const asset = validAsset({
    storageKey: "CleanfixMedia/FIXTURE-FAN-TO-FAN/FIXTURE-FAN-TO-FAN-VIDEO-20260814-master-bedroom.mp4",
    mediaType: "video",
  });
  assert.deepEqual(validateAsset(asset, CATEGORY_MAP), []);
});

test("missing required fields reported as a unit", () => {
  const errors = validateAsset({ serviceType: "Electrical" }, CATEGORY_MAP);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /missing required fields/);
});

test("unknown serviceType rejected", () => {
  const errors = validateAsset(validAsset({ serviceType: "Roofing" }), CATEGORY_MAP);
  assert.ok(errors.some((e) => e.includes('[serviceType]')));
});

test("unknown SKU in storageKey rejected", () => {
  const asset = validAsset({
    storageKey: "CleanfixMedia/DECK-BUILD/DECK-BUILD-PHOTO-20260814-stair-3way.jpg",
  });
  const errors = validateAsset(asset, CATEGORY_MAP);
  assert.ok(errors.some((e) => e.includes('SKU "DECK-BUILD" is not in categoryMap.json')));
});

test("SKU/serviceType disagreement rejected", () => {
  const asset = validAsset({
    storageKey: "CleanfixMedia/TOILET-TANK-REPAIR/TOILET-TANK-REPAIR-PHOTO-20260814-stair-3way.jpg",
  });
  const errors = validateAsset(asset, CATEGORY_MAP);
  assert.ok(errors.some((e) => e.includes('maps to serviceType "Plumbing"')));
});

test("key media segment must agree with mediaType", () => {
  const errors = validateAsset(validAsset({ mediaType: "timelapse" }), CATEGORY_MAP);
  assert.ok(errors.some((e) => e.includes('disagrees with mediaType "timelapse"')));
});

test("key date segment must agree with date field", () => {
  const errors = validateAsset(validAsset({ date: "2026-08-15" }), CATEGORY_MAP);
  assert.ok(errors.some((e) => e.includes('disagrees with date "2026-08-15"')));
});

test("impossible calendar date rejected", () => {
  const asset = validAsset({
    date: "2026-02-30",
    storageKey: "CleanfixMedia/SWITCH-REPLACE/SWITCH-REPLACE-PHOTO-20260230-stair-3way.jpg",
  });
  const errors = validateAsset(asset, CATEGORY_MAP);
  assert.ok(errors.some((e) => e.includes("[date]")));
});

test("draft asset must not carry a portfolioUrl", () => {
  const asset = validAsset({
    portfolioStatus: "draft",
    portfolioUrl: "https://cleanfixservices.com/portfolio/x",
  });
  const errors = validateAsset(asset, CATEGORY_MAP);
  assert.ok(errors.some((e) => e.includes("portfolioUrl must be null")));
});

test("published asset may have null portfolioUrl, and https when set", () => {
  assert.deepEqual(validateAsset(validAsset({ portfolioUrl: null }), CATEGORY_MAP), []);
  assert.deepEqual(
    validateAsset(validAsset({ portfolioUrl: "https://cleanfixservices.com/portfolio#x" }), CATEGORY_MAP),
    []
  );
  const errors = validateAsset(validAsset({ portfolioUrl: "http://insecure" }), CATEGORY_MAP);
  assert.ok(errors.some((e) => e.includes("https URL")));
});

test("empty facts rejected", () => {
  const errors = validateAsset(validAsset({ facts: "   " }), CATEGORY_MAP);
  assert.ok(errors.some((e) => e.includes("[facts]")));
});

test("legacy entries without a city still validate", () => {
  assert.deepEqual(validateAsset(validAsset({ city: null }), CATEGORY_MAP), []);
  const { city, ...withoutCity } = validAsset();
  assert.deepEqual(validateAsset(withoutCity, CATEGORY_MAP), []);
});

test("city punctuation real names use is accepted", () => {
  for (const city of ["St. Clair Shores", "O'Fallon", "Winston-Salem"]) {
    assert.deepEqual(validateAsset(validAsset({ city }), CATEGORY_MAP), [], city);
  }
});

test("empty, untrimmed, or non-letter city rejected", () => {
  for (const city of ["", "   ", " Ann Arbor", "Ann  Arbor", "Ann Arbor MI 48103", "48103"]) {
    const errors = validateAsset(validAsset({ city }), CATEGORY_MAP);
    assert.ok(errors.some((e) => e.includes("[city]")), `"${city}" must be rejected`);
  }
});
