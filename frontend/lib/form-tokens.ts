import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const guestCookie = "boundaries-guest-session";
export const guestLifetime = 7 * 24 * 60 * 60;
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
export const validToken = (token?: string) => Boolean(typeof token === "string" && /^[a-zA-Z0-9_-]{43}$/.test(token));
export class FormAccessConfigurationError extends Error {
  public readonly reason: "missing" | "invalid";
  constructor(reason: "missing" | "invalid") {
    super(`FORM_ACCESS_KEY configuration is ${reason}`);
    this.name = "FormAccessConfigurationError";
    this.reason = reason;
  }
}
function key() {
  const value = process.env.FORM_ACCESS_KEY?.trim();
  if (!value) throw new FormAccessConfigurationError("missing");
  if (!/^[a-fA-F0-9]{64}$/.test(value)) throw new FormAccessConfigurationError("invalid");
  return Buffer.from(value, "hex");
}
export function createInvite() {
  const token = randomBytes(32).toString("base64url");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return { inviteHash: hashToken(token), inviteEncrypted: Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url") };
}
export function revealInvite(value: string) {
  const bytes = Buffer.from(value, "base64url");
  const cipher = createDecipheriv("aes-256-gcm", key(), bytes.subarray(0, 12));
  cipher.setAuthTag(bytes.subarray(12, 28));
  return Buffer.concat([cipher.update(bytes.subarray(28)), cipher.final()]).toString("utf8");
}
export function matchesInvite(token: string | undefined, expectedHash: string) {
  return validToken(token) && timingSafeEqual(Buffer.from(hashToken(token!), "hex"), Buffer.from(expectedHash, "hex"));
}
// A lost submission response can replay its random request key and recover the same
// server-issued guest credential, without storing plaintext session tokens.
export const submissionGuestToken = (requestKey: string) => createHmac("sha256", key()).update(`guest:${requestKey}`).digest("base64url");
