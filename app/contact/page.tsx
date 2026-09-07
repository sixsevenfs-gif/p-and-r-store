import { HelpPage, paragraphs } from "../help-page";

export default function ContactPage() {
  return <HelpPage eyebrow="P&R / CUSTOMER CARE" title="Contact" sections={[
    { title: "Order support", body: paragraphs("For delivery, return, refund or wallet questions, contact us from your P&R account and include your order number. This helps us find your order quickly.") },
    { title: "Product support", body: paragraphs("Need help choosing a size, fit or product? Send us the product name and your preferred fit, and we will guide you.") },
    { title: "Response time", body: paragraphs("Our support team responds as soon as possible during business hours. Keep an eye on your P&R order timeline for delivery and refund updates.") },
  ]} />;
}
