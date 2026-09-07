import { getDb } from "../../../db";
import { newsletterSubscribers } from "../../../db/schema";
import { captureEmailContact, normalizeContactEmail } from "../_lib/email-contacts";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { email?: string };
    const email = normalizeContactEmail(payload.email);

    if (!email) {
      return Response.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    await getDb()
      .insert(newsletterSubscribers)
      .values({ email })
      .onConflictDoNothing();
    await captureEmailContact(email, "newsletter");

    return Response.json({ subscribed: true }, { status: 201 });
  } catch {
    return Response.json({ error: "Unable to save your email right now." }, { status: 500 });
  }
}
