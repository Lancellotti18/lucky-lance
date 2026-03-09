import bcryptjs from "bcryptjs";

export async function hashPassword(plain: string): Promise<string> {
  return bcryptjs.hash(plain, 12);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcryptjs.compare(plain, hash);
}

export function generateSessionToken(): string {
  // 48 bytes → 64-char hex string
  const array = new Uint8Array(48);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function sessionExpiresAt(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d;
}
