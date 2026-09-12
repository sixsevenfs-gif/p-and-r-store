BEGIN;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS checkout_fingerprint text;
COMMENT ON COLUMN public.orders.checkout_fingerprint IS 'Server hash binding checkout idempotency key to its original request; NULL for legacy orders';
COMMIT;
