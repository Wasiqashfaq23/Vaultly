const crypto = require("crypto");

const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getMasterKey() {
  const key = process.env.VAULT_MASTER_KEY;
  if (!key) {
    throw new Error(
      "VAULT_MASTER_KEY is required. Generate one with: openssl rand -hex 32"
    );
  }
  const normalized = key.startsWith("0x") ? key.slice(2) : key;
  if (!/^[0-9a-fA-F]{64}$/.test(normalized)) {
    throw new Error(
      "VAULT_MASTER_KEY must be 32 bytes (64 hex characters). Generate one with: openssl rand -hex 32"
    );
  }
  return Buffer.from(normalized, "hex");
}

function encrypt(plainText) {
  if (plainText === undefined || plainText === null) {
    throw new Error("Nothing to encrypt");
  }
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-gcm", getMasterKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(String(plainText), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted]
    .map((buf) => buf.toString("hex"))
    .join(":");
}

function decrypt(data) {
  const parts = String(data).split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted payload");
  }
  const [ivHex, tagHex, dataHex] = parts;
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getMasterKey(),
    Buffer.from(ivHex, "hex")
  );
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

function tryDecrypt(data) {
  try {
    return decrypt(data);
  } catch {
    return null;
  }
}

module.exports = { encrypt, decrypt, tryDecrypt };