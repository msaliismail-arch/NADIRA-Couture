import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import type { Administrateur } from "@prisma/client";

const ADMIN_SECRET =
  process.env.ADMIN_SECRET || "nadira-couture-secret-2024";

type AdminPublic = {
  id: number;
  nom: string;
  email: string;
  role: string;
};

/**
 * Create a signed token for an admin.
 * Token = base64(JSON{payload}) + "." + HMAC-SHA256(payload)
 */
export function createToken(admin: AdminPublic): string {
  const payload = {
    id: admin.id,
    email: admin.email,
    role: admin.role,
    ts: Date.now(),
  };
  const payloadStr = JSON.stringify(payload);
  const payloadB64 = Buffer.from(payloadStr, "utf8").toString("base64url");
  const signature = sign(payloadB64);
  return `${payloadB64}.${signature}`;
}

/**
 * Verify a token. Returns {id, email, role} or null.
 */
export function verifyToken(
  token: string
): { id: number; email: string; role: string } | null {
  try {
    const [payloadB64, signature] = token.split(".");
    if (!payloadB64 || !signature) return null;
    if (!verifySignature(payloadB64, signature)) return null;
    const payloadStr = Buffer.from(payloadB64, "base64url").toString("utf8");
    const payload = JSON.parse(payloadStr);
    if (
      typeof payload.id !== "number" ||
      typeof payload.email !== "string" ||
      typeof payload.role !== "string"
    ) {
      return null;
    }
    return { id: payload.id, email: payload.email, role: payload.role };
  } catch {
    return null;
  }
}

/**
 * Extract Bearer token from Authorization header, verify, and return the
 * Administrateur row (or null if not authorized).
 */
export async function requireAdmin(
  request: Request
): Promise<Administrateur | null> {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) return null;
    const token = match[1];
    const decoded = verifyToken(token);
    if (!decoded) return null;
    const admin = await db.administrateur.findUnique({
      where: { id: decoded.id },
    });
    if (!admin) return null;
    return admin;
  } catch {
    return null;
  }
}

/**
 * Verify a password against a hash using bcryptjs.
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

/**
 * Hash a password with bcryptjs (for seeding / creating new admins).
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// --- HMAC helpers using Node crypto (available server-side) ---
function sign(data: string): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require("crypto") as typeof import("crypto");
  return crypto
    .createHmac("sha256", ADMIN_SECRET)
    .update(data)
    .digest("base64url");
}

function verifySignature(data: string, signature: string): boolean {
  const expected = sign(data);
  // constant-time-ish comparison
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < signature.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}
