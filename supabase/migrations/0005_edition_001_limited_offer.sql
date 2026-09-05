-- Launch offer for Edition 001. Prices are stored in paise.
-- Administrators can change or remove the offer later in the product editor.
UPDATE products
SET price = 129900,
    compare_at_price = 149900,
    edition_number = coalesce(edition_number, 1),
    updated_at = extract(epoch from now())::bigint
WHERE edition_number = 1 OR slug = 'allergic-to-people-tee';
