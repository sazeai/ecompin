import type { Metadata } from "next"

import { LegalPage } from "@/components/marketplace/legal-page"

export const metadata: Metadata = { title: "Refund Policy — STEAL.LOL" }

export default function RefundPolicy() {
  return <LegalPage eyebrow="PAYMENTS" title="Refund policy." intro="The $9 fee purchases immediate publication of one competitor offer on one active customer listing.">
    <section><h2>Before publication</h2><p>If payment fails or is abandoned, the pending offer stays private and no paid placement is delivered.</p></section>
    <section><h2>After publication</h2><p>Because publication is delivered immediately after payment confirmation, completed placements are generally non-refundable. If a technical failure charges you but never publishes the offer, contact <a href="mailto:support@steal.lol">support@steal.lol</a> with the payment email.</p></section>
    <section><h2>Moderated content</h2><p>Offers removed for fraud, abuse, unlawful content, impersonation, or an unwillingness to honor the stated terms are not eligible for a refund.</p></section>
  </LegalPage>
}
