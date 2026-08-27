import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"

const inter = localFont({ src: "../public/fonts/Inter.ttf", variable: "--font-inter", display: "swap" })
const oxanium = localFont({ src: "../public/fonts/Oxanium.ttf", variable: "--font-oxanium", weight: "200 800", display: "swap" })
const fineNoise = `data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='2.5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E`

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://fixthis.example"),
  title: { default: "FIXTHIS — Problems worth solving", template: "%s — FIXTHIS" },
  description: "Real problems accumulate demand. Products compete for paid exposure as the featured solution.",
  applicationName: "FIXTHIS",
  icons: { icon: "/icon.svg" },
  openGraph: { type: "website", siteName: "FIXTHIS", title: "FIXTHIS — Problems worth solving", description: "A live market for problems, demand, and the products competing to solve them." },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-scroll-behavior="smooth" className={`${inter.variable} ${oxanium.variable} antialiased`}><body className="font-sans antialiased" style={{ backgroundImage: `url("${fineNoise}")`, backgroundRepeat: "repeat" }}>{children}</body></html>
}
