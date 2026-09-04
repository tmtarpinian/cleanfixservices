const fs = require("node:fs");
const path = require("node:path");

// Storage strategy interface. Both backends expose the same four async
// methods so publisher.js is oblivious to where objects land:
//   put({ key, body, contentType, cacheControl })
//   get(key) -> string
//   list(prefix) -> string[]
//   delete(key)

class LocalDirStorage {
  constructor(rootDir) {
    this.rootDir = rootDir;
  }

  _abs(key) {
    return path.join(this.rootDir, key);
  }

  async put({ key, body }) {
    const abs = this._abs(key);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, body);
  }

  async get(key) {
    return fs.readFileSync(this._abs(key), "utf8");
  }

  async list(prefix) {
    const keys = [];
    const walk = (dir) => {
      if (!fs.existsSync(dir)) return;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const abs = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(abs);
        else keys.push(path.relative(this.rootDir, abs).split(path.sep).join("/"));
      }
    };
    walk(this.rootDir);
    return keys.filter((k) => k.startsWith(prefix)).sort();
  }

  async delete(key) {
    fs.rmSync(this._abs(key), { force: true });
  }
}

class R2Storage {
  constructor({ accountId, accessKeyId, secretAccessKey, bucket }) {
    // Lazy require keeps @aws-sdk/client-s3 out of unit tests entirely.
    const sdk = require("@aws-sdk/client-s3");
    this._sdk = sdk;
    this.bucket = bucket;
    this.client = new sdk.S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  static fromEnv(env = process.env) {
    const required = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"];
    const missing = required.filter((k) => !env[k]);
    if (missing.length > 0) {
      throw new Error(`Missing R2 credentials in environment/.env: ${missing.join(", ")}`);
    }
    return new R2Storage({
      accountId: env.R2_ACCOUNT_ID,
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      bucket: env.R2_BUCKET,
    });
  }

  async put({ key, body, contentType, cacheControl }) {
    await this.client.send(
      new this._sdk.PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: cacheControl,
      })
    );
  }

  async get(key) {
    const res = await this.client.send(
      new this._sdk.GetObjectCommand({ Bucket: this.bucket, Key: key })
    );
    return res.Body.transformToString();
  }

  async list(prefix) {
    const keys = [];
    let ContinuationToken;
    do {
      const res = await this.client.send(
        new this._sdk.ListObjectsV2Command({ Bucket: this.bucket, Prefix: prefix, ContinuationToken })
      );
      for (const obj of res.Contents ?? []) keys.push(obj.Key);
      ContinuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
    } while (ContinuationToken);
    return keys.sort();
  }

  async delete(key) {
    await this.client.send(new this._sdk.DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}

module.exports = { LocalDirStorage, R2Storage };
