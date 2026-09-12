import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./account.css";
import "./unique-finds.css";
import "./product-layout-fixes.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.RENDER_EXTERNAL_URL || "http://localhost:3000";
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "P&R — Oversized Essentials",
  description: "Considered oversized essentials. Less Noise. More Presence.",
  icons:{icon:"/favicon.svg"},
  openGraph:{title:"P&R — Oversized Essentials",description:"Less Noise. More Presence.",images:["/og.png"]},
  twitter:{card:"summary_large_image",title:"P&R — Oversized Essentials",description:"Less Noise. More Presence.",images:["/og.png"]}
};
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body className={inter.variable}>{children}</body></html> }
