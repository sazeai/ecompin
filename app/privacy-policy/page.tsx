import type { Metadata } from "next"

import { LegalPage } from "@/components/marketplace/legal-page"

export const metadata: Metadata = { title: "Privacy Policy" }

export default function PrivacyPolicy() {
  return <LegalPage eyebrow="LEGAL" title="Privacy policy." intro="The short version: browsing and voting need no account, we measure traffic with an anonymous token rather than a profile, and we never publish anyone's email.">
    <section><h2>No accounts for the public</h2><p>You do not create an account to browse problems, post a problem, or say you have a problem too. We set one anonymous, HTTP-only visitor cookie so the same browser is not counted twice. It contains a random value, not your identity.</p></section>
    <section><h2>How we count</h2><p>Analytics tables never store the raw cookie value. We store a keyed HMAC derived from it, so the stored key cannot be reversed back into your cookie. We use this to enforce one support per problem per visitor, to keep the featured solution stable for 30 minutes, and to count one outbound click per placement per visitor per 24 hours.</p></section>
    <section><h2>IP addresses</h2><p>We process your IP address transiently for rate limiting and abuse detection. Where an IP signal is retained for abuse detection it is stored only as a rotating keyed hash, never in plain text and never in public counters.</p></section>
    <section><h2>What becomes public</h2><p>The problem statement, its category, its demand count, its traffic counts, and the paid placements competing on it are public. An optional one-sentence complaint detail becomes public only after moderation. Email addresses, visitor tokens, IP addresses, payment identifiers, and moderation metadata are never public.</p></section>
    <section><h2>Email</h2><p>Email is always optional. If you ask to hear when a problem is first claimed, we send one confirmation email and only subscribe you if you confirm. Advertisers provide an email at checkout to receive their private management link. You can unsubscribe or request deletion at any time.</p></section>
    <section><h2>Retention</h2><p>Presence rows are kept for at most 24 hours. Anonymous impression and click records are kept for 90 days, after which only daily aggregate totals remain. Payment records are kept as long as tax and fraud-prevention obligations require.</p></section>
    <section><h2>Processors</h2><p>Supabase stores marketplace data, Dodo Payments processes payments, Cloudflare Turnstile provides bot protection, and Resend delivers transactional email. We do not sell data or run third-party advertising trackers.</p></section>
    <section><h2>Bots and crawlers</h2><p>Requests from known crawlers and link-preview bots are excluded from every public counter. Sharing a FIXTHIS link does not inflate its numbers.</p></section>
    <section><h2>Access and deletion</h2><p>To request access, correction, or deletion, email <a href="mailto:support@fixthis.example">support@fixthis.example</a>. Because public activity is anonymous, we may be unable to link a request to specific votes or impressions.</p></section>
  </LegalPage>
}
