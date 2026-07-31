import { getDb } from "../../../db";
import { newsletterSubscribers } from "../../../db/schema";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { email?: string };
    const email = payload.email?.trim().toLowerCase() ?? "";

    if (!emailPattern.test(email)) {
      return Response.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    await getDb()
      .insert(newsletterSubscribers)
      .values({ email })
      .onConflictDoNothing();

    return Response.json({ subscribed: true }, { status: 201 });
  } catch {
    return Response.json({ error: "Unable to save your email right now." }, { status: 500 });
  }
}
