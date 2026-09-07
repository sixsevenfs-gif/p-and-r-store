import { HelpPage, paragraphs } from "../help-page";

export default function TermsPage() {
  return <HelpPage eyebrow="P&R / LEGAL" title="Terms" updated="7 September 2026" sections={[
    { title: "Orders", body: paragraphs("Orders are subject to product availability and confirmation. We may contact you if an item, payment or delivery detail needs clarification before fulfilment.") },
    { title: "Pricing & payments", body: paragraphs("Prices are shown in Indian Rupees and include applicable taxes where stated. P&R Wallet credit can be used at checkout against eligible purchases.") },
    { title: "Returns & refunds", body: paragraphs("Returns and refund eligibility are governed by our Shipping & Returns and Refund Policy pages. Approved return refunds are credited to the P&R Wallet connected to the original customer account.") },
  ]} />;
}
