import { atomicRequest } from "../../_lib/atomic";
import { authenticSignature, settleCaptured } from "../../_lib/razorpay";
export const POST = atomicRequest(async (request: Request) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const raw = await request.text();
  if (!secret || raw.length > 1000000 || !authenticSignature(raw, request.headers.get("x-razorpay-signature"), secret)) return Response.json({ error: "Invalid webhook signature." }, { status: 401 });
  let event;
  try { event = JSON.parse(raw); } catch { return Response.json({ error: "Invalid event." }, { status: 400 }); }
  // Capture is the authoritative event. Failed attempts never regress a captured order.
  if (event.event === "payment.captured") await settleCaptured(event.payload?.payment?.entity || {});
  return Response.json({ accepted: true });
});
