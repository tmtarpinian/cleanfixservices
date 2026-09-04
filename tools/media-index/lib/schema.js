const fs = require("node:fs");
const path = require("node:path");

const MEDIA_TYPES = ["photo", "video", "timelapse"];
const PORTFOLIO_STATUSES = ["draft", "published", "archived"];
// Letters plus the punctuation real US city names use (St. Clair Shores,
// O'Fallon, Winston-Salem). No digits: a zip or state abbreviation in the
// city field would fragment the byCity feeds.
const CITY_RE = /^[A-Za-z][A-Za-z .'-]*[A-Za-z.]$/;
const KEY_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif", "mp4", "mov", "webm"];
const REQUIRED_FIELDS = ["serviceType", "mediaType", "portfolioStatus", "facts", "date", "storageKey"];

// CleanfixMedia/[SKU]/[SKU]-[MEDIATYPE]-[YYYYMMDD]-[SHORTDESC].ext
// The \1 backreference forces the filename's SKU to match the prefix SKU exactly,
// which is what disambiguates hyphenated SKUs (FIXTURE-FAN-TO-FAN) from the
// hyphen-delimited MEDIATYPE segment that follows.
const STORAGE_KEY_RE = new RegExp(
  "^CleanfixMedia/([A-Z0-9]+(?:-[A-Z0-9]+)*)/" +
    "\\1-(PHOTO|VIDEO|TIMELAPSE)-(\\d{8})-([a-z0-9]+(?:-[a-z0-9]+)*)\\." +
    `(${KEY_EXTENSIONS.join("|")})$`
);

const DEFAULT_CATEGORY_MAP_PATH = path.resolve(__dirname, "..", "categoryMap.json");

function loadCategoryMap(filePath = DEFAULT_CATEGORY_MAP_PATH) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function skuToServiceType(categoryMap) {
  const map = {};
  for (const [serviceType, skus] of Object.entries(categoryMap)) {
    for (const sku of skus) map[sku] = serviceType;
  }
  return map;
}

function isRealDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

// Validator registry: each entry is a named, independently testable rule that
// returns a list of error strings. New rules plug in without touching validateAsset.
const validators = [];
function validator(name, fn) {
  validators.push({ name, fn });
}

validator("serviceType", (asset, ctx) => {
  const allowed = Object.keys(ctx.categoryMap);
  return allowed.includes(asset.serviceType)
    ? []
    : [`serviceType "${asset.serviceType}" must be one of: ${allowed.join(" | ")}`];
});

validator("mediaType", (asset) =>
  MEDIA_TYPES.includes(asset.mediaType)
    ? []
    : [`mediaType "${asset.mediaType}" must be one of: ${MEDIA_TYPES.join(" | ")}`]
);

validator("portfolioStatus", (asset) =>
  PORTFOLIO_STATUSES.includes(asset.portfolioStatus)
    ? []
    : [`portfolioStatus "${asset.portfolioStatus}" must be one of: ${PORTFOLIO_STATUSES.join(" | ")}`]
);

validator("date", (asset) =>
  typeof asset.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(asset.date) && isRealDate(asset.date)
    ? []
    : [`date "${asset.date}" must be a real calendar date in YYYY-MM-DD form`]
);

// city is required on all new adds (media:add enforces it), but entries that
// predate the field carry null and stay publishable — they appear with
// city: null and simply don't join any byCity feed.
validator("city", (asset) => {
  if (asset.city == null) return [];
  if (typeof asset.city !== "string" || asset.city.trim().length === 0) {
    return ["city must be a non-empty string (or null on legacy entries)"];
  }
  if (asset.city !== asset.city.trim().replace(/\s+/g, " ")) {
    return [`city "${asset.city}" must be trimmed with single spaces between words`];
  }
  return CITY_RE.test(asset.city)
    ? []
    : [`city "${asset.city}" may only contain letters, spaces, periods, apostrophes, and hyphens`];
});

validator("facts", (asset) =>
  typeof asset.facts === "string" && asset.facts.trim().length > 0
    ? []
    : ["facts must be a non-empty narrative string"]
);

validator("portfolioUrl", (asset) => {
  if (asset.portfolioStatus !== "published") {
    return asset.portfolioUrl == null
      ? []
      : [`portfolioUrl must be null while portfolioStatus is "${asset.portfolioStatus}"`];
  }
  if (asset.portfolioUrl == null) return [];
  return /^https:\/\/\S+$/.test(asset.portfolioUrl)
    ? []
    : [`portfolioUrl "${asset.portfolioUrl}" must be an https URL`];
});

validator("storageKey", (asset, ctx) => {
  const match = STORAGE_KEY_RE.exec(asset.storageKey || "");
  if (!match) {
    return [
      `storageKey "${asset.storageKey}" does not match ` +
        "CleanfixMedia/[SKU]/[SKU]-[MEDIATYPE]-[YYYYMMDD]-[SHORTDESC].ext " +
        `(SKU uppercase, SHORTDESC lowercase kebab, ext one of ${KEY_EXTENSIONS.join("/")})`,
    ];
  }
  const [, sku, mediaSegment, dateSegment] = match;
  const errors = [];
  const mappedService = ctx.skuToService[sku];
  if (!mappedService) {
    errors.push(`SKU "${sku}" is not in categoryMap.json — add it under its serviceType first`);
  } else if (asset.serviceType && mappedService !== asset.serviceType) {
    errors.push(`SKU "${sku}" maps to serviceType "${mappedService}", not "${asset.serviceType}"`);
  }
  if (asset.mediaType && mediaSegment !== asset.mediaType.toUpperCase()) {
    errors.push(`storageKey media segment "${mediaSegment}" disagrees with mediaType "${asset.mediaType}"`);
  }
  if (asset.date && dateSegment !== asset.date.replaceAll("-", "")) {
    errors.push(`storageKey date segment "${dateSegment}" disagrees with date "${asset.date}"`);
  }
  return errors;
});

function validateAsset(asset, categoryMap = loadCategoryMap()) {
  const missing = REQUIRED_FIELDS.filter((f) => asset[f] === undefined);
  if (missing.length > 0) return [`missing required fields: ${missing.join(", ")}`];
  const ctx = { categoryMap, skuToService: skuToServiceType(categoryMap) };
  return validators.flatMap(({ name, fn }) => fn(asset, ctx).map((e) => `[${name}] ${e}`));
}

module.exports = {
  MEDIA_TYPES,
  PORTFOLIO_STATUSES,
  KEY_EXTENSIONS,
  CITY_RE,
  STORAGE_KEY_RE,
  loadCategoryMap,
  skuToServiceType,
  validateAsset,
};
