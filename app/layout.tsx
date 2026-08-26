import type { Metadata } from "next"
import localFont from "next/font/local"

import "./globals.css"

const inter = localFont({ src: "./api/render-pin/fonts/Inter.ttf", variable: "--font-inter", display: "swap" })
const instrumentSerif = localFont({ src: "./api/render-pin/fonts/PlayfairDisplay.ttf", variable: "--font-instrument-serif", display: "swap" })

const fineNoise = `data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='2.5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E`

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://steal.lol"),
  title: { default: "STEAL.LOL — Steal Customers From Your Competitors", template: "%s" },
  description: "People leaving SaaS products list themselves here. Competitors pay to win their business.",
  applicationName: "STEAL.LOL",
  icons: { icon: "/icon.svg" },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${inter.variable} ${instrumentSerif.variable} antialiased`}>
      <body className="font-sans antialiased" style={{ backgroundImage: `url("${fineNoise}")`, backgroundRepeat: "repeat" }}>
        {children}
      </body>
    </html>
  )
}
