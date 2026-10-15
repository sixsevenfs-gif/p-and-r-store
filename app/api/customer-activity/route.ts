import { atomicRequest } from "../_lib/atomic";
import { requireApiCustomer } from "../_lib/account";
import { env } from "@/db/runtime";
import { recordCartActivity } from "../_lib/customer-activity";

async function handlePOST(request: Request) {
  const customer = await requireApiCustomer(request);
  if (!customer) return Response.json({ error: "Sign in required." }, { status: 401 });
  const body = await request.json().catch(() => ({})) as { event?: string };
  if (body.event !== "checkout_started" && body.event !== "checkout_back") return Response.json({ error: "Unsupported activity event." }, { status: 400 });
  const cart = await env.DB.prepare("SELECT id FROM carts WHERE customer_id=?").bind(customer.id).first<{ id: number }>();
  if (!cart) return Response.json({ recorded: false });
  await recordCartActivity(customer.id, cart.id, body.event);
  return Response.json({ recorded: true });
}

export const POST = atomicRequest(handlePOST);
