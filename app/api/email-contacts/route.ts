import { captureEmailContact, normalizeContactEmail } from "../_lib/email-contacts";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: unknown; source?: unknown };
    const email = normalizeContactEmail(body.email);
    // Public submissions are deliberately limited to the support form. Other
    // sources are recorded inside their respective server-side routes.
    if (!email || body.source !== "support") return Response.json({ error: "Enter a valid email address." }, { status: 400 });
    await captureEmailContact(email, "support");
    return Response.json({ saved: true });
  } catch {
    return Response.json({ error: "Unable to save your email right now." }, { status: 500 });
  }
}
