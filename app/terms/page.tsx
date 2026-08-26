import type { Metadata } from "next"

import { LegalPage } from "@/components/marketplace/legal-page"

export const metadata: Metadata = { title: "Terms — STEAL.LOL" }

export default function TermsPage() {
  return <LegalPage eyebrow="LEGAL" title="Terms of use." intro="STEAL.LOL sells paid offer placement. It does not broker, verify, or guarantee the resulting SaaS deal.">
    <section><h2>The service</h2><p>Customers may anonymously publish that they are leaving a SaaS product. Competitors may pay a one-time fee to publish an offer on that listing. STEAL.LOL does not process a later SaaS purchase, take commission, or confirm whether a switch occurs.</p></section>
    <section><h2>Your submissions</h2><p>You must submit accurate, lawful content and must not include credentials, confidential data, impersonation, harassment, or material that violates another party&apos;s rights. You grant STEAL.LOL permission to display submitted public fields as needed to operate the marketplace.</p></section>
    <section><h2>Offers</h2><p>Offer makers are responsible for the accuracy and fulfillment of their offers. Customers decide independently whether to visit or buy from an offer maker. STEAL.LOL does not endorse products mentioned on the site.</p></section>
    <section><h2>Moderation</h2><p>We may hide listings or offers that are misleading, unsafe, abusive, unlawful, or inconsistent with these terms. Paid placement does not guarantee permanent publication.</p></section>
    <section><h2>Liability</h2><p>The marketplace is provided as available. To the extent permitted by law, STEAL.LOL is not liable for business outcomes, third-party products, unfulfilled offers, indirect loss, or interactions after a user leaves this site.</p></section>
  </LegalPage>
}
