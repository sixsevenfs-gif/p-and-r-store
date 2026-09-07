import { HelpPage, paragraphs } from "../help-page";

export default function PrivacyPage() {
  return <HelpPage eyebrow="P&R / LEGAL" title="Privacy" updated="7 September 2026" sections={[
    { title: "Information we use", body: paragraphs("We use the information you provide—such as your name, mobile number, delivery address and order details—to process purchases, deliver your order, provide support and manage your P&R account.") },
    { title: "Keeping your information safe", body: paragraphs("We use reasonable safeguards to protect account and order information. Access is limited to what is needed to operate the store and support customers.") },
    { title: "Your choices", body: paragraphs("You can update your account details from your P&R account. Contact us if you need help with your personal information or an order record.") },
  ]} />;
}
