import { env } from "@/db/runtime";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeContactEmail(value: unknown) {
  const email = String(value ?? "").trim().toLowerCase();
  return emailPattern.test(email) && email.length <= 254 ? email : "";
}

/** Stores one canonical row per email while retaining where it was last supplied. */
export async function captureEmailContact(value: unknown, source: string) {
  const email = normalizeContactEmail(value);
  if (!email) return null;

  await env.DB.prepare(`INSERT INTO email_contacts(email,first_source,last_source,first_seen_at,last_seen_at)
    VALUES (?,?,?,unixepoch(),unixepoch())
    ON CONFLICT(email) DO UPDATE SET last_source=excluded.last_source,last_seen_at=unixepoch()`)
    .bind(email, source.slice(0, 48), source.slice(0, 48)).run();
  return email;
}
