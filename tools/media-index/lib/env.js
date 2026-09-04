const fs = require("node:fs");
const path = require("node:path");

const REPO_ENV_PATH = path.resolve(__dirname, "..", "..", "..", ".env");

// Minimal .env loader so the tooling doesn't need the dotenv package.
// Existing process.env values always win over file values.
function loadEnv(filePath = REPO_ENV_PATH) {
  if (!fs.existsSync(filePath)) return {};
  const loaded = {};
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    // Strip one layer of matching quotes, like dotenv does.
    if (value.length >= 2 && (value[0] === '"' || value[0] === "'") && value.at(-1) === value[0]) {
      value = value.slice(1, -1);
    }
    loaded[key] = value;
    if (!(key in process.env)) process.env[key] = value;
  }
  return loaded;
}

module.exports = { loadEnv, REPO_ENV_PATH };
