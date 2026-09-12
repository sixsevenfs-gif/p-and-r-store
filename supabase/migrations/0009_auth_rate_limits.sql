-- Additive migration. No customer/order rows are rewritten or deleted.
BEGIN;
CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
  bucket text PRIMARY KEY,
  window_start bigint NOT NULL,
  attempts integer NOT NULL DEFAULT 1 CHECK (attempts > 0)
);
ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.auth_rate_limits FROM anon, authenticated;
-- Server database role must own this table or be explicitly granted access.
COMMIT;
