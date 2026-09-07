import { HelpPage, paragraphs } from "../help-page";

export default function InstagramPage() {
  return <HelpPage eyebrow="P&R / STUDIO" title="Instagram" sections={[
    { title: "P&R Studio", body: paragraphs("Follow P&R for new drops, behind-the-scenes studio notes, fit references and customer styling. Our official Instagram handle will be linked here shortly.") },
    { title: "Stay in the loop", body: paragraphs("For order help, delivery updates, returns or refunds, please use your P&R account or the Contact page instead of social media messages.") },
  ]} />;
}
