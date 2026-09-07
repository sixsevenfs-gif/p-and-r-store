import Link from "next/link";
import type { ReactNode } from "react";

type Section = { title: string; body: ReactNode };

export function HelpPage({ eyebrow, title, updated, sections }: { eyebrow: string; title: string; updated?: string; sections: Section[] }) {
  return <main className="help-shell">
    <header className="help-nav"><Link href="/" aria-label="P&R home">P<span>&</span>R</Link><Link href="/shop">Shop</Link></header>
    <article className="policy-page">
      <header><p>{eyebrow}</p><h1>{title}</h1>{updated && <span>Last updated: {updated}</span>}</header>
      {sections.map((section) => <section key={section.title}><h2>{section.title}</h2>{section.body}</section>)}
    </article>
    <footer className="help-footer"><Link href="/shipping-returns">Shipping &amp; Returns</Link><Link href="/refund-policy">Refund Policy</Link><Link href="/size-guide">Size Guide</Link><Link href="/contact">Contact</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></footer>
  </main>;
}

export const paragraphs = (...items: string[]) => <>{items.map((item) => <p key={item}>{item}</p>)}</>;
