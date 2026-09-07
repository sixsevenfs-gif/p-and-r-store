import descriptions from "./product-copy.json";

export const uc22Fabric = "240 GSM, 100% super-combed cotton. Pre-shrunk and bio-washed, with a Lycra-ribbed neckline and double-stitched construction. Full-length, unisex oversized fit.";
export const printCare = "Turn inside out and wash cold on a gentle cycle with mild detergent and similar colours. Hang dry in shade, or tumble dry on low. Use a cool iron on the reverse only; keep it off the print. Do not dry clean. Avoid chlorine bleach.";
export const shippingAndReturns = "We deliver across India. Shipping charges are shown at checkout, and tracking appears in My Orders after dispatch. Delivery time depends on your PIN code and courier coverage. Request an eligible return within 7 days of delivery; items must be unworn, unwashed and returned with tags and packaging. After inspection and approval, the refund is credited to your P&R Wallet for future purchases.";

export function productInformation(product: {slug:string; name:string; note:string}) {
  const known = descriptions[product.slug as keyof typeof descriptions];
  const isCropped = /baby-tee|crop-tee/.test(product.slug);
  const oversized = Boolean(known) && !isCropped;
  return {
    summary: product.note.split("\n\n")[0] || known || product.name,
    details: product.note || [known, oversized ? uc22Fabric : ""].filter(Boolean).join("\n\n"),
    oversized,
    fit: oversized ? "Choose by garment measurements in the size guide. Compare them with a T-shirt you already own; the cut already includes extra room." : "This style has its own fit. Contact us for garment measurements before ordering; the oversized size chart does not apply.",
  };
}
