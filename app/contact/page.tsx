"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

const supportEmail = "support@pnr.com";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const subject = `[P&R Support] ${form.get("topic")} — ${form.get("order") || "No order number"}`;
    const body = [`Name: ${form.get("name")}`, `Email: ${form.get("email")}`, `Order number: ${form.get("order") || "Not available"}`, "", "Issue:", String(form.get("message") || "")].join("\n");
    await fetch("/api/email-contacts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: form.get("email"), source: "support" }) }).catch(() => undefined);
    setSent(true);
    window.location.href = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };
  return <main className="help-shell support-page">
    <header className="help-nav"><Link href="/" aria-label="P&R home">P<span>&</span>R</Link><Link href="/shop">Shop</Link></header>
    <article className="support-layout">
      <header><p>P&R / CUSTOMER CARE</p><h1>How can we<br/>help?</h1><span>Share your complaint, order issue, return request or product question. Your email app will open with all the details ready for <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.</span></header>
      <form className="support-form" onSubmit={submit}>
        <div className="support-form-head"><p>CONTACT SUPPORT</p><small>We reply as soon as possible during business hours.</small></div>
        <label>Your name<input name="name" autoComplete="name" required placeholder="Your full name"/></label>
        <label>Email address<input name="email" type="email" autoComplete="email" required placeholder="you@example.com"/></label>
        <label>What do you need help with?<select name="topic" defaultValue="Order issue"><option>Order issue</option><option>Delivery or tracking</option><option>Return or refund</option><option>Wallet or payment</option><option>Product, size or fit</option><option>Complaint</option><option>Other</option></select></label>
        <label>Order number <small>Optional, but it helps us locate your order faster.</small><input name="order" placeholder="Example: PR1234"/></label>
        <label>Tell us what happened<textarea name="message" required rows={7} placeholder="Please include the issue and any details that will help us resolve it."/></label>
        <button className="primary" type="submit">Email P&amp;R Support</button>
        {sent && <p className="support-sent" role="status">Your email app should be open. If it did not open, email <a href={`mailto:${supportEmail}`}>{supportEmail}</a> directly.</p>}
      </form>
    </article>
    <section className="support-quick-links"><Link href="/shipping-returns">Shipping &amp; returns</Link><Link href="/refund-policy">Refund policy</Link><Link href="/size-guide">Size guide</Link></section>
    <footer className="help-footer"><Link href="/shipping-returns">Shipping &amp; Returns</Link><Link href="/refund-policy">Refund Policy</Link><Link href="/size-guide">Size Guide</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></footer>
  </main>;
}
