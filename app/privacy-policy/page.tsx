import type { Metadata } from "next"

import { LegalPage } from "@/components/marketplace/legal-page"

export const metadata: Metadata = { title: "Privacy Policy — STEAL.LOL" }

export default function PrivacyPolicy() {
  return <LegalPage eyebrow="LEGAL" title="Privacy policy." intro="The short version: listings are public, identities are not, and we collect only what the marketplace needs to work.">
    <section><h2>What we collect</h2><p>Customers provide the SaaS they are leaving, monthly spend, reason, and email. Offer makers provide a product name, URL, offer, and email. We may process basic request information such as IP address for security and rate limiting.</p></section>
    <section><h2>What becomes public</h2><p>The SaaS name, monthly spend, leaving reason, listing time, and paid competitor offers are public. Customer and provider email addresses are never displayed publicly or shared between the parties.</p></section>
    <section><h2>How we use data</h2><p>We use listing data to run the marketplace, provider details to administer paid placements, and customer email addresses to notify customers when paid offers arrive. Supabase stores marketplace data, Dodo Payments processes payments, and Resend delivers transactional email.</p></section>
    <section><h2>Payments</h2><p>Payment details are collected and processed by Dodo Payments. STEAL.LOL does not store complete card details.</p></section>
    <section><h2>Removal and access</h2><p>To request access, correction, or deletion of your personal data, email <a href="mailto:support@steal.lol">support@steal.lol</a>. We may retain transaction records where law or fraud prevention requires it.</p></section>
  </LegalPage>
}
