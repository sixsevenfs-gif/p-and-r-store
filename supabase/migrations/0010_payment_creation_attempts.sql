BEGIN;
CREATE TABLE IF NOT EXISTS public.payment_creation_attempts (
  order_id bigint PRIMARY KEY REFERENCES public.orders(id),
  status text NOT NULL CHECK (status IN ('started','complete','unknown')),
  gateway_order_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_creation_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.payment_creation_attempts FROM anon, authenticated;
COMMIT;
