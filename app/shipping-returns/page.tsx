import { HelpPage, paragraphs } from "../help-page";

export default function ShippingReturnsPage() {
  return <HelpPage eyebrow="P&R / CUSTOMER CARE" title="Shipping & Returns" updated="7 September 2026" sections={[
    { title: "Shipping", body: paragraphs("We ship across India. Once your order is confirmed, you will receive updates in My Orders as it is prepared, dispatched and delivered.", "Delivery timing can vary by PIN code, courier coverage and order volume. Tracking details are added to your order as soon as they are available.") },
    { title: "Returns", body: paragraphs("To request a return, contact P&R support within 7 days of delivery with your order number and the reason for return. Pieces must be unworn, unwashed, undamaged and returned with original tags and packaging.") },
    { title: "Return approval", body: paragraphs("After the returned piece reaches us, our team checks it before approving the return. Eligible approved returns are refunded as P&R Wallet credit.") },
  ]} />;
}
