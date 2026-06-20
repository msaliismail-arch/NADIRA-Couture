/**
 * Generate a NADIRA order reference: NAD-YYYYMMDD-XXXX
 * XXXX = 4 random digits.
 */
export function generateReference(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const rand = String(Math.floor(1000 + Math.random() * 9000));
  return `NAD-${yyyy}${mm}${dd}-${rand}`;
}

/**
 * Compute a unique reference (re-rolls on collision).
 */
export async function uniqueReference(
  exists: (ref: string) => Promise<boolean>
): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const ref = generateReference();
    if (!(await exists(ref))) return ref;
  }
  // Fallback with extra random segment
  return generateReference() + Math.floor(Math.random() * 100);
}
