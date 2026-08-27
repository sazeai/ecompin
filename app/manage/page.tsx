import type { Metadata } from "next"

import { Footer } from "@/components/marketplace/footer"
import { FramedSection, MarketplaceFrame } from "@/components/marketplace/frame"
import { Header } from "@/components/marketplace/header"
import { ManageLinkRequest } from "@/components/marketplace/manage-link-request"

export const metadata: Metadata = {
  title: "Manage your placement",
  description: "Request a fresh private management link for a FIXTHIS placement.",
  robots: { index: false, follow: false },
}

export default function ManageRequestPage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#fafafa] font-sans text-[#111]">
      <div className="flex min-h-screen flex-col items-center">
        <MarketplaceFrame>
          <Header back />
          <main className="relative z-10 mt-28 flex w-full flex-col items-center">
            <FramedSection contentClassName="px-5 py-14 sm:px-10 sm:py-20">
              <div className="mx-auto max-w-md">
                <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#d84d37]">Advertiser access</p>
                <h1 className="mt-3 font-serif text-[34px] leading-[1.05] tracking-[-0.04em] text-[#111] sm:text-[42px]">Lost your management link?</h1>
                <p className="mt-4 text-[14px] leading-6 text-[#666]">
                  Management runs on private links, not accounts. Enter the email you used at checkout and we will send a fresh one for every product it manages.
                </p>
                <div className="mt-8"><ManageLinkRequest /></div>
              </div>
            </FramedSection>
            <FramedSection><Footer /></FramedSection>
          </main>
        </MarketplaceFrame>
      </div>
    </div>
  )
}
