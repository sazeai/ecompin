import type { Metadata } from "next"

import { LegalPage } from "@/components/marketplace/legal-page"

export const metadata: Metadata = { title: "Terms of Service" }

export default function TermsPage() {
  return <LegalPage eyebrow="LEGAL" title="Terms of use." intro="FIXTHIS sells rotating paid exposure against a specific problem. It does not sell customers, leads, endorsements, exclusivity, or guaranteed results.">
    <section><h2>What the service is</h2><p>Anyone can publish a problem written from the buyer&apos;s perspective and anyone can signal that they share it. Products pay a one-time fee to appear as the featured solution on a problem. FIXTHIS does not broker, verify, or take commission on anything that happens after a visitor leaves this site.</p></section>
    <section><h2>What a payment buys</h2><p>A settled bid buys a position in a rotating exposure pool for that problem. Only the top five placements rotate. Exposure is approximate, is shared with other paying products, and can fall when someone else bids higher. Nothing here is a guarantee of impressions, clicks, traffic, revenue, or permanent placement.</p></section>
    <section><h2>Featured is not recommended</h2><p>A featured solution is a paid placement, not an endorsement, review, ranking, or statement that the product is the best answer. We label it as paid everywhere it appears, and we do not claim to have evaluated it.</p></section>
    <section><h2>Your submissions</h2><p>Problems must describe a need, not pitch a product. Do not submit links, contact details, credentials, confidential information, impersonation, harassment, or anything unlawful or infringing. You grant FIXTHIS permission to display your submitted public fields to operate the marketplace.</p></section>
    <section><h2>Advertiser obligations</h2><p>You must own or be authorised to represent the destination domain you bid with. Product names, taglines, and destinations must be accurate and safe. A placement is tied to its registrable domain, and a management link cannot move a placement to a different domain.</p></section>
    <section><h2>Manipulation</h2><p>Do not attempt to inflate demand, impressions, or clicks by automation, repeat identities, or coordinated activity. We exclude suspicious activity from public counters and may suspend placements or hide problems involved in it, without refund.</p></section>
    <section><h2>Moderation</h2><p>We may hide, edit for clarity, merge, or refuse any problem, complaint detail, or placement that is misleading, promotional, unsafe, unlawful, or inconsistent with these terms. Paid placement does not exempt content from moderation.</p></section>
    <section><h2>Liability</h2><p>The marketplace is provided as available. To the extent permitted by law, FIXTHIS is not liable for business outcomes, third-party products, advertising performance, indirect loss, or anything that happens after a visitor leaves this site.</p></section>
  </LegalPage>
}
