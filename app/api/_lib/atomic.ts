import { env } from "@/db/runtime";

class RejectedRequest extends Error {
  constructor(readonly response: Response) { super("Request rolled back"); }
}
/** A conservative store-wide commerce lock serializes financial/stock writers.
 * All participating routes use the same lock; narrow locks only after measured
 * load testing and a documented ordering across customer/order/variant rows. */
export function atomicRequest<Args extends unknown[]>(handler: (...args: Args) => Promise<Response>) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await env.DB.transaction(async () => {
        await env.DB.prepare("SET LOCAL lock_timeout = '5s'").run();
        await env.DB.prepare("SET LOCAL statement_timeout = '20s'").run();
        await env.DB.prepare("SELECT pg_advisory_xact_lock(72401931)").all();
        const response = await handler(...args);
        if (!response.ok) throw new RejectedRequest(response);
        return response;
      });
    } catch (error) {
      if (error instanceof RejectedRequest) return error.response;
      return Response.json({ error: "The operation could not be completed. Please retry safely." }, { status: 503 });
    }
  };
}
