import type { Metadata } from "next"

import { LegalPage } from "@/components/marketplace/legal-page"

export const metadata: Metadata = { title: "Refund Policy" }

export default function RefundPolicy() {
  return <LegalPage eyebrow="PAYMENTS" title="Refund policy." intro="A bid is a full, one-time, non-refundable advertising purchase. It buys a rotating position on one problem, and previous spend is never credited toward a later bid.">
    <section><h2>Before settlement</h2><p>A bid is held as a quote for 15 minutes. If you abandon or cancel checkout, or payment never completes, nothing is published and you are not charged. A bid becomes real only when our signed payment webhook verifies it, never from the return page alone.</p></section>
    <section><h2>After settlement</h2><p>Exposure begins immediately once the payment is verified, so settled bids are generally non-refundable. Each bid is charged in full at the amount you entered; being outbid later is the expected behaviour of the market and is not a defect.</p></section>
    <section><h2>What being outbid means</h2><p>A higher settled bid moves you down the ranking and reduces your share of exposure. It does not delete your placement: positions two through five continue to receive rotating exposure, and you can bid again at any time.</p></section>
    <section><h2>When we do refund</h2><p>If a technical failure charges you without ever activating exposure, or charges you twice for the same quote, contact <a href="mailto:support@fixthis.example">support@fixthis.example</a> with the payment email and we will refund it.</p></section>
    <section><h2>Removed placements</h2><p>Placements suspended for fraud, manipulation of counters, unsafe or unlawful destinations, impersonation, or misrepresenting the product are not eligible for a refund.</p></section>
    <section><h2>Refunds and disputes</h2><p>A refund or a lost or accepted chargeback revokes that bid. The placement then falls back to your highest remaining valid bid, rankings are recalculated, and exposure is redistributed. An open dispute suspends the placement until it is resolved.</p></section>
  </LegalPage>
}
