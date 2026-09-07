import { HelpPage, paragraphs } from "../help-page";

export default function RefundPolicyPage() {
  return <HelpPage eyebrow="P&R / CUSTOMER CARE" title="Refund Policy" updated="7 September 2026" sections={[
    { title: "Returns", body: paragraphs("If your order is eligible for return, contact P&R support within 7 days of delivery. Returned pieces must be unworn, unwashed, undamaged and sent back with their original tags and packaging.", "Once the returned piece reaches us and passes inspection, we will approve the refund.") },
    { title: "Refunds to P&R Wallet", body: paragraphs("Approved return refunds are issued as P&R Wallet credit for the full eligible order amount. Wallet credit is added to the same customer account used to place the order.", "You can use this credit at checkout on a future P&R purchase. It is visible under Account → Wallet and can be applied together with the rest of your payment at checkout.") },
    { title: "Timing", body: paragraphs("After the return is received and approved, wallet credit is normally added immediately. You will see a refund update in your order timeline and in your wallet transaction history.") },
    { title: "Non-returnable items", body: paragraphs("Items marked final sale, worn or washed pieces, products without original tags, and items damaged after delivery are not eligible for return or refund.") },
    { title: "Need help?", body: paragraphs("For a return or refund question, contact P&R support with your order number. We will help you with the next step.") },
  ]} />;
}
