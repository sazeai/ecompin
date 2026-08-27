Yes. **I think the “people post problems” direction is much stronger than the current “customer leaving SaaS” model.**

Your screenshot looks good. The problem is not the UI. **The business object itself is wrong.**

Right now you're effectively saying:

> “Trust me. This anonymous person is a real $299/month customer. Pay me $9 for access to them.”

The paying founder has contributed nothing, owns nothing, and has no proof the customer is valuable. That's why it feels weak even though the page looks polished.

I would pivot **without throwing away what you've built.**

### Change the thing being sold

Don't sell **customers**.

Sell **ownership of the solution to a real problem.**

Imagine the homepage:

> ## What are people trying to solve?
>
> **“I need a tool that turns 2-hour podcasts into 10 usable shorts automatically.”**
>
> 🔥 **184 people have this problem**
>
> Current solution: **OpusClip**
>
> **Take this spot — $37**

Another:

> **“I need to restore old family photos without changing people's faces.”**
>
> **73 people have this problem**
>
> Current solution: **BringBack**
>
> **Take this spot — $19**

Another:

> **“I want an alternative to Intercom that doesn't cost $500/month.”**
>
> **261 people have this problem**
>
> Current solution: **Crisp**
>
> **Outbid Crisp — $74**

Now think about what changed.

The founder isn't buying **one suspicious stranger**.

They're buying placement in front of **everyone who has that exact problem now and everyone who lands on that problem later.**

That's a real asset.

And users don't need to upload invoices or prove anything.

They just:

> **Describe your problem**

Then other visitors can hit:

**+ I HAVE THIS TOO**

That's it.

Now demand accumulates.

---

### And NOW the Outbid-style escalating price makes sense

Every problem has **one featured solution**.

Say:

> “Need a simple alternative to Google Analytics.”

Nobody owns it.

**Claim solution — $5**

Plausible pays $5.

Now:

> **Current solution: Plausible**
>
> Replace them — **$10**

Simple Analytics pays $10.

Next:

**$20**

Then:

**$40**

Then:

**$80**

Exactly the behavior you're chasing — but the object being fought over has meaning.

The more people say **“I have this problem too”**, the more valuable that piece of internet real estate becomes.

You can even make price depend partly on demand later.

---

### The user side finally has a reason to exist too

Someone comes with a problem:

> “I need software that automatically follows up with unpaid invoices.”

They post it.

Maybe immediately there's already a solution.

They click it.

Or founders notice the demand and fight to occupy it.

And other people see it and say:

**Holy shit, I need that too.**

Click.

Now the site isn't:

**people supposedly leaving SaaS → SaaS founders**

It's:

# **PROBLEMS → PEOPLE WITH SAME PROBLEM → PRODUCTS FIGHTING TO SOLVE THEM**

That's much larger.

It includes people who aren't currently paying for anything.

It includes completely new product ideas.

It includes existing SaaS replacements.

It includes founders searching for startup ideas.

It includes SaaS founders looking for acquisition.

And it generates its own content.

---

Your current design barely even needs rebuilding.

Change:

**Customers up for grabs**

to:

### **Problems up for grabs**

Your current card:

> sleek.design
> CUSTOMER LEAVING
> $29/mo

becomes:

> #01
>
> **“I need unlimited web design without paying $3k/month.”**
>
> **42 PEOPLE WANT THIS**
>
> 🔥 Current solution: Designjoy
>
> **STEAL THIS PROBLEM — $29**

And I'd probably drop **STEAL** eventually because you're no longer stealing customers.

Something like **solve.lol**, **need.lol**, **wanted.lol**, **pain.lol**, etc. But don't waste tonight obsessing over the domain.

The critical conceptual shift is:

> **Don't monetize an unverifiable individual.**
>
> **Monetize aggregated demand around a problem.**

That solves the exact thing currently bothering you.

And there's another huge benefit: **even with zero paying founders, the website is useful.** People can browse problems, discover tools, click “I have this too,” and founders can browse unmet demand for startup ideas.

Your current version without buyers is an empty lead marketplace.

This version without buyers is already **a live database of what people want**.

That's a much healthier foundation.

I would pivot the build **now**, before you spend another hour adding trust systems to the customer-leaving model.



Yes — **with that framing, I’d stop worrying about “are these 284 people qualified buyers?”** You’re right.

The mistake in my critique was judging this like a lead marketplace.

It isn’t.

It’s closer to:

> **Outbid, but every advertising slot is attached to a specific problem instead of a generic category.**

That is actually the moat.

Outbid says:

> SEO → here are companies paying for attention.

You say:

> **“I need an easier way to turn long videos into shorts.”**
> 284 people agree → here is the company paying to be shown as the solution.

The founder pays for **contextual visibility**, not guaranteed customers.

That works.

But now we need to design the mechanics properly.

---

# 1. Do NOT show four SaaS listings under every problem

That will destroy the feed.

Each problem card should have **exactly ONE visible solution at a time.**

Something like:

> **“I need an Intercom alternative that doesn't cost $500/month.”**
>
> 🔥 **284 people have this problem**
>
> ### Featured solution
>
> **Crisp**
> Customer support without insane seat pricing.
>
> `VISIT →`  **1,284 clicks**
>
> **4 companies competing**
>
> `OUTBID $42 →`

The entire card stays compact.

There may be 10 companies fighting for that problem.

The user sees **one**.

---

# 2. But don't make winner-takes-all

This is where I'd make our mechanic different from Outbid.

If the highest bidder gets 100% of impressions forever until outbid, everyone else becomes worthless.

Instead:

## **Exposure rotation**

Every impression of a problem chooses one paid solution.

But the current #1 receives the majority.

For example:

**#1 bidder → 60% of impressions**

**#2 bidder → 25%**

**everyone else → remaining 15%**

So:

Crisp paid $80
HelpScout paid $50
Tidio paid $30
Chatwoot paid $20

Approximately:

> Crisp — 60% visibility
> HelpScout — 25%
> Tidio + Chatwoot — split 15%

This gives us something very important:

### Being outbid doesn't erase your purchase.

You still receive traffic.

But there is a very strong incentive to become #1.

That's healthier than pure winner-takes-all.

---

# 3. The visible solution changes between visitors

You load homepage:

> Problem: cheaper Intercom
> **Crisp**

I load it:

> Same problem
> **HelpScout**

Another user:

> Same problem
> **Crisp**

So the page constantly feels alive.

No carousel animation necessary.

No four giant listings.

One problem.

One solution.

One CTA.

---

# 4. Clicking “4 companies competing” opens the full battlefield

Not inline.

Modal/bottom sheet:

> ### Companies fighting for this problem
>
> 🥇 Crisp — $80
> 1,421 clicks
>
> 🥈 HelpScout — $50
> 673 clicks
>
> Tidio — $30
> 294 clicks
>
> Chatwoot — $20
> 181 clicks

Then:

### **TAKE #1 — $81+**

Now founders get the competitive/status part.

Normal users aren't forced to look at all that shit.

---

# 5. Bidding logic

I'd keep this stupidly simple.

First solution:

**$5**

Someone pays $5.

Next minimum:

**$10**

Then allow the founder to enter anything ≥ $10.

Someone bids $25.

Now minimum:

**$30**

I'd use:

> **minimum next bid = current #1 + $5**

rather than doubling forever.

Why?

Because:

$5 → $10 → $20 → $40 → $80 → $160 → $320

will eventually murder activity on mediocre problems.

Let humans decide how much the problem is worth.

So:

> Current leader: $47
> **Take #1 for $52+**

Founder can type:

`$100`

if they really want it.

---

# 6. And THIS is where problem demand helps pricing

Imagine:

### Problem A

**12 people have this problem**

Current #1: $10.

Fine.

### Problem B

🔥 **3,841 people have this problem**

Current #1: $310.

Now bidding naturally follows demand.

We don't need some artificial formula saying:

> 284 users therefore price = $73.24

The market sets it.

That is much more Outbid-like.

---

# 7. Fake “I HAVE THIS TOO” clicks

Yes, solve it — but invisibly.

Absolutely **no login** and no verification.

A vote should count only once per problem using several signals:

* browser/device identifier
* cookie/localStorage
* hashed IP server-side
* rate limits
* invisible bot protection
* reject obvious datacenter/bot traffic
* don't allow repeat vote from same browser
* unusual voting patterns can simply be excluded from public count

And importantly:

### Don't make each vote financially valuable by itself.

Founder can't redeem 284 votes for something.

It's just a public interest signal.

That drastically reduces the incentive for normal users to cheat.

Founders *will* try to manipulate it, but basic anti-abuse is enough for MVP.

---

# 8. Click numbers matter more than “people have this problem”

This is where you were completely right about Outbid.

Show both:

> **284 people have this problem**
>
> Featured solution: Crisp
>
> **1,482 clicks**

Now founders have something concrete.

The problem count says:

**interest**

The click count says:

**traffic**

And if someone is considering paying $150 to take #1, they can see:

> This problem has generated 4,871 outbound clicks.

That's actually compelling.

---

# 9. Track clicks per problem AND per advertiser

Example battlefield:

| Solution  |  Bid |  Views | Clicks |
| --------- | ---: | -----: | -----: |
| Crisp     | $120 | 18,421 |  1,408 |
| HelpScout |  $75 |  8,102 |    681 |
| Tidio     |  $40 |  3,118 |    194 |

Now the next bidder knows what they're fighting over.

And this creates another loop.

Founder tweets:

> Paid $60 to own “Intercom is too expensive” on some weird website.
>
> Got 412 clicks in two days.
>
> Apparently I'm still #1 😂

That's MUCH better than promising leads.

---

# 10. We shouldn't pretend the paying company is “the best solution”

Your third point is right too.

There might be 100 legitimate solutions.

**We don't owe all 100 free distribution.**

The language simply needs to be accurate.

Not:

> **Best solution**

Not:

> **Recommended solution**

Use:

### **Featured solution**

or perhaps even more aligned with the product:

### **Currently claiming this problem**

That sounds fucking good:

> **284 people have this problem**
>
> 🏴 **Crisp currently claims it**
>
> 1,482 clicks
>
> **STEAL THIS PROBLEM — $85**

Now we're not pretending to be Wirecutter.

It's an advertising battleground.

Everyone understands it.

---

# The other circulation issue: problems themselves

We also cannot let the same ten huge problems live at the top forever.

I'd have three signals:

**Freshness + activity + demand velocity.**

Don't rank by total lifetime “ME TOO.”

Otherwise:

> “Need a CRM”

gets 20,000 and owns homepage forever.

Instead look at **recent activity**.

Example:

> 37 new ME TOOs in last hour

is more important than:

> 8,000 lifetime / 2 this week

So homepage ranking can be roughly:

**recent unique ME TOOs + recent outbound clicks + recent bid activity + freshness decay**

No need to expose formula.

And re-rank every few minutes.

That makes the marketplace move.

---

# I think the product is becoming clearer

The public unit isn't:

**a startup**

and it isn't:

**a customer**

It's:

# **A PROBLEM**

Every problem has:

**Demand**

> 284 people have this too

**Attention**

> 4,291 solution clicks

**Competition**

> 5 SaaS companies fighting

**Ownership**

> Crisp currently #1 at $120

**Economics**

> Take #1 for $125+

That's actually a very clean system.

And the beautiful part is your current UI is **already 70% of the way there.**

You don't need to rebuild the site.

Your current card changes from:

> **sleek.design**
> CUSTOMER LEAVING
> $29/mo
> Make offer $9

into something like:

> **“I need good web design without paying an agency $5k/month.”**
>
> 🔥 **31 people have this problem**
>
> 🏴 **Sleek.design claims this problem**
>
> **128 clicks**
>
> **3 companies competing**
>
> ### **OUTBID — $24**

**That finally feels like the same addictive primitive as Outbid while having a legitimate differentiator.**

And I would *not* add another marketplace concept now. This one is worth tightening rather than restarting again.


"Every impression of a problem chooses one paid solution.
But the current #1 receives the majority.
For example:
#1 bidder → 60% of impressions
#2 bidder → 25%
everyone else → remaining 15%
So:
Crisp paid $80
HelpScout paid $50
Tidio paid $30
Chatwoot paid $20
Approximately:
Crisp — 60% visibility
HelpScout — 25%
Tidio + Chatwoot — split 15%

How do you make this happen, what will make this visibility distribute"

It should **not** be the frontend randomly deciding. The backend should treat every legitimate display of a problem card as an **impression** and choose which advertiser gets that impression.

And I would **not use pure random**, because 60% probability does not mean someone will actually get 60% over a small number of views. You could accidentally give #2 six views in a row.

Use a **rotating impression bucket** instead.

Say this problem has:

* Crisp #1 — $80
* HelpScout #2 — $50
* Tidio #3 — $30
* Chatwoot #4 — $20

Backend creates a hidden pool of **100 impression slots**:

```text
Crisp       × 60
HelpScout   × 25
Tidio       × 8
Chatwoot    × 7
```

Shuffle those 100 slots.

Now every time a **real visitor** is served that problem:

```text
visitor 1   → Crisp
visitor 2   → Tidio
visitor 3   → Crisp
visitor 4   → HelpScout
visitor 5   → Crisp
...
```

After all 100 slots are consumed, generate/shuffle another batch.

So after roughly every 100 legitimate impressions:

> Crisp ≈ 60
> HelpScout ≈ 25
> Tidio ≈ 8
> Chatwoot ≈ 7

That's what actually distributes the visibility.

### What counts as an impression?

This matters.

**Not every refresh.**

I'd define one impression as:

> This unique browser sees this specific problem card once within, say, **30 minutes**.

Store something like:

```text
problem_id
visitor_id
advertiser_id
served_at
```

Give the browser an anonymous visitor ID cookie/localStorage ID.

If the same guy refreshes 50 times, don't count 50 new impressions and don't keep changing the advertised SaaS.

For 30 minutes he continues seeing the same featured solution.

That also prevents the page looking schizophrenic on reload.

---

### What happens on the homepage?

Suppose homepage has 8 problem cards.

User opens homepage.

Backend effectively does this:

```text
Problem 1 → select advertiser
Problem 2 → select advertiser
Problem 3 → select advertiser
...
Problem 8 → select advertiser
```

So their page might show:

> Podcast clipping problem → OpusClip
> Intercom problem → Crisp
> SEO reporting problem → SE Ranking
> Image restoration problem → BringBack

Another visitor might see:

> Podcast clipping → Klap
> Intercom problem → HelpScout
> SEO reporting → Semrush
> Image restoration → BringBack

**Same problems, rotating paid solutions.**

That's how competitors below #1 continue receiving value.

---

## When someone outbids #1

Let's say HelpScout pays $85.

Ranking changes:

1. HelpScout — $85
2. Crisp — $80
3. Tidio — $30
4. Chatwoot — $20

Immediately generate a **new rotation epoch**:

```text
HelpScout   60%
Crisp       25%
Tidio        8%
Chatwoot     7%
```

You don't need to preserve the old 100-slot sequence.

The moment the leaderboard changes, future impressions use the new distribution.

That's also the reward for outbidding:

> **Your visibility instantly jumps from 25% → 60%.**

That's a much clearer reason to pay than some abstract ranking.

---

## And show this to founders

When they're considering an outbid, tell them exactly what they're buying:

> **Currently #2**
>
> Estimated visibility: **25%**
>
> Outbid Crisp for $85
>
> ### Become #1 → ~60% of impressions

Now the financial action makes sense.

The table could show:

| Position | Visibility |
| -------- | ---------: |
| #1       |       ~60% |
| #2       |       ~25% |
| #3+      | Share ~15% |

And once someone pays:

> **You now control ~60% of this problem's exposure.**

That's tangible.

---

### One tweak I'd make

If there are only **two advertisers**, don't waste 15%.

Use:

**#1 = 70%**
**#2 = 30%**

One advertiser:

**100%**

Three or more:

**#1 = 60%**
**#2 = 25%**
**everyone else shares 15%**

So your function is basically:

```text
1 bidder:
100

2 bidders:
70 / 30

3 bidders:
60 / 25 / 15

4 bidders:
60 / 25 / 7.5 / 7.5

5 bidders:
60 / 25 / 5 / 5 / 5
```

Although I'd eventually put a minimum threshold on lower positions because if there are 30 advertisers, 0.5% exposure is meaningless.

But **do not solve that tonight**.

For the MVP, cap each problem at maybe **5 competing products**.

That gives you scarcity and keeps the rotation meaningful.

So technically, the key system your agent needs is:

**weighted impression rotation per problem + anonymous visitor/session deduplication + reset rotation when bidding positions change.**

That's a pretty small backend feature. It's not complicated marketplace logic.


Okay I see all these outbid.lol competitor are showing the live visitors, total visitors in 24 hrs, clicks on each saas listing. How do we do that reliablly

Yes. And this is one of those things where **we should track it ourselves**, not trust Google Analytics/PostHog numbers for the public counters.

You need three different systems:

### 1. LIVE VISITORS

Give every browser an anonymous UUID stored in a cookie, for example:

```text
visitor_id = 8b27f3...
```

No login.

While the website is open and **visible**, frontend sends a heartbeat every ~20 seconds:

```text
POST /api/presence
visitor_id
```

Backend upserts:

```text
visitor_presence

visitor_id
last_seen_at
```

Then:

```sql
LIVE VISITORS =
count visitors
where last_seen_at > NOW() - 45 seconds
```

So if somebody closes the tab, stops internet, backgrounds the browser, etc., they disappear automatically after ~45 seconds.

**Do not depend on `beforeunload`.** It's unreliable.

Also stop heartbeats when:

```js
document.visibilityState === "hidden"
```

So 20 tabs sitting in someone's background don't count as live visitors.

Your header can then show:

> 🟢 **127 LIVE**

Poll this number every 10–15 seconds.

---

# 2. VISITORS IN LAST 24 HOURS

Use the **same anonymous visitor ID**.

Have:

```text
visitors

visitor_id
first_seen_at
last_seen_at
```

When they visit:

```sql
INSERT ...
ON CONFLICT(visitor_id)
UPDATE last_seen_at = now()
```

Then:

```sql
SELECT COUNT(*)
FROM visitors
WHERE last_seen_at >= NOW() - INTERVAL '24 hours';
```

This means:

One visitor refreshing 100 times = **1 visitor**

Same person opening 5 tabs = **1 visitor**

Same person coming back 6 hours later = **1 visitor**

Different browser/device = another visitor.

That's perfectly acceptable. Nobody can measure literal human beings perfectly without login.

So display:

> **8,492 visitors / 24h**

I'd actually call it:

> **8,492 unique visitors / 24h**

That gives the number more credibility.

---

# 3. CLICKS ON EACH SaaS

This one is VERY important:

### Never increment clicks just because someone loaded the SaaS card.

Only increment from an actual human click event.

Each paid placement has:

```text
placement_id
problem_id
product_id
url
```

When someone clicks:

> VISIT CRISP →

Frontend sends:

```text
POST /api/click

placement_id
visitor_id
```

Then immediately sends them to:

```text
https://crisp.chat
```

Use `navigator.sendBeacon()` if possible because it's designed for exactly this situation: send analytics while the browser navigates away.

Something conceptually like:

```js
navigator.sendBeacon(
  "/api/click",
  JSON.stringify({
    placementId
  })
);

window.location.href = productUrl;
```

The server already knows `visitor_id` from the cookie.

---

## Do NOT count unlimited clicks

Otherwise founder can sit there clicking their own product:

1000 times.

Create:

```text
placement_clicks

id
placement_id
visitor_id
created_at
```

Then only count **one unique click per visitor per placement within 24 hours**.

So:

Crisp:

> 👁 4,821 impressions
> ↗ **392 clicks**

If the same visitor clicks Crisp six times that day:

**1 click.**

Tomorrow they can count again.

That's much more defensible publicly.

---

# You should ALSO track impressions

This becomes valuable for bidders.

Whenever your rotation system actually serves Crisp as the featured solution to a visitor:

```text
placement_impressions

placement_id
visitor_id
problem_id
created_at
```

Again dedupe sensibly.

Now you can show founders:

> **Crisp**
>
> 8,421 impressions
> 731 clicks
> **8.7% CTR**

🔥

That makes bidding much more rational.

Imagine a founder sees:

> ### “I need a cheaper Intercom alternative”
>
> **829 people have this problem**
>
> Last 24h:
>
> 4,281 solution impressions
> 684 solution clicks
>
> Crisp currently controls 60% visibility
>
> **Outbid Crisp — $85**

Now $85 has context.

That's far stronger than:

> Pay $85 because we said so.

---

# Fake traffic/bots

Don't go crazy tonight.

Do these five things:

**Cookie UUID**

Prevents simple refresh inflation.

**IP rate limiting**

Don't accept hundreds of visits/clicks from the same IP in seconds.

You don't need to publicly store IPs. Hash them if you use them for abuse detection.

**Ignore obvious bots**

User agents containing things like:

```text
Googlebot
bingbot
facebookexternalhit
Twitterbot
Slackbot
Discordbot
```

should not affect public visitor/click numbers.

This is especially important because sharing FIXTHIS links on X will cause X's crawler to fetch the page.

**Human click event**

Don't make a GET `/go/crisp` automatically equal one click.

Link preview bots and scanners may visit URLs.

Count the browser's explicit click event.

**Visibility heartbeat**

Only count live visitors while the page is actually active.

That's plenty for an MVP.

---

# Don't write every heartbeat forever

For tonight with hundreds/thousands of users, Supabase will handle this fine.

But don't create a new DB row every 20 seconds.

Use:

```text
visitor_presence

visitor_id PRIMARY KEY
last_seen_at
```

and **UPDATE the same row**.

For example:

```sql
INSERT INTO visitor_presence(visitor_id, last_seen_at)
VALUES ($visitor_id, NOW())

ON CONFLICT(visitor_id)
DO UPDATE SET last_seen_at = NOW();
```

So 500 live people means approximately **500 rows**, not millions.

Eventually delete stale presence rows older than 24 hours.

---

# Your minimal analytics tables

I'd keep it to roughly:

```text
visitors
---------
visitor_id
first_seen_at
last_seen_at


visitor_presence
----------------
visitor_id
last_seen_at


placement_impressions
---------------------
id
placement_id
problem_id
visitor_id
created_at


placement_clicks
----------------
id
placement_id
problem_id
visitor_id
created_at
```

That's enough.

---

# The numbers I'd publicly expose

Header:

> 🟢 **187 LIVE**
> **12,481 VISITORS / 24H**

Problem card:

> 🔥 **284 HAVE THIS PROBLEM**

Featured solution:

> **Crisp**
>
> 👁 4,821 impressions
> ↗ **638 clicks**

Competition:

> **4 companies competing**
>
> 🥇 Crisp — $80
> **60% visibility**

That starts making FIXTHIS feel like an **actual live advertising market**, instead of another static directory.

And one important thing: **never fake those counters at launch.** Zero looks slightly embarrassing for a few hours; getting caught fabricating “1,842 LIVE” can permanently poison founder trust.

For the first few visitors, simply hide `LIVE` until it crosses something like 5. The 24h counter can show from visitor #1."



"Now comes the main part who lists the problems.... Intially no one might come list problems and there will be no saas ...page will feel dead"

Yes. **This is the actual cold-start problem.** And I would not wait for users to create the marketplace.

The answer is: **FIXTHIS itself creates the initial problem inventory — but never pretends those problems came from users.**

At launch, the homepage should already contain maybe **40–60 real, obvious SaaS pains**:

> “Intercom gets insanely expensive as the team grows.”

> “I need a simple analytics tool without cookie banners.”

> “AI photo restorers keep changing people's faces.”

> “I want a CRM that doesn't require a week to configure.”

> “I need to turn long videos into shorts without manually editing them.”

These are **problem statements**, not fake customer testimonials.

Mark them subtly:

> **CURATED BY FIXTHIS**

And initially:

> **0 people have this too**

That's completely honest.

The first person who clicks **I HAVE THIS TOO** makes it 1.

---

## More importantly: a problem does NOT need a user before a SaaS can claim it

This is key.

Imagine the launch homepage:

> ### “I need an Intercom alternative that doesn't become insanely expensive.”
>
> **12 people have this too**
>
> **No solution has claimed this yet**
>
> ### CLAIM THIS PROBLEM — $5

A founder can immediately pay.

So you don't need:

**user comes → posts → founder finds it**

The inventory already exists.

You're launching an **advertising market around known problems**, and users gradually improve the demand signal.

---

# Where do the initial problems come from?

For launch night, **you manually create them.**

Don't overengineer this.

Pick maybe 8 SaaS categories:

* CRM
* customer support
* SEO
* analytics
* design
* AI content/video
* developer tools
* productivity

Create 5–8 sharp problems in each.

That's 40–60 cards.

You can derive them from obvious/common complaints or public discussions, but rewrite them into generic problem statements.

Don't write:

> “John from Reddit says Intercom robbed him.”

Write:

> “Customer support software gets too expensive as seats increase.”

Much cleaner.

---

# But then how does FIXTHIS eventually get user-generated supply?

Everywhere on the site:

### **Can't find your problem?**

**POST IT →**

Form should be ridiculously small:

> **What's pissing you off?**
>
> `[ I need ______ ]`
>
> **POST PROBLEM**

No signup.

Maybe optional email afterward:

> Want updates when someone claims this problem?

Email is optional.

Post first.

---

# There's another supply engine hiding here

When someone presses:

### I HAVE THIS TOO

give them an optional field:

> **What specifically sucks about it?**

They can add one sentence.

So one broad problem can evolve.

Example:

> **“Intercom is too expensive.”**
>
> 284 people agree
>
> Common complaints:
>
> * seat pricing
> * AI add-ons
> * pricing jumps with contacts

Now the problem page becomes more useful without requiring people to create completely new listings.

---

# And founders themselves can create problems — with one restriction

Suppose I own BringBack and don't see:

> “AI restoration tools change people's faces.”

I should be able to click:

### **ADD A PROBLEM**

and create it.

But immediately label it:

> **0 people have this too**

I can then claim it for $5.

What I **cannot** do is create:

> “BringBack is clearly the best photo restoration software.”

Problems should be written from the buyer's perspective.

So founder-created problems are okay because **the public demand count remains independent**.

If nobody agrees with me, it sits there:

> 0 people have this too

That's the market telling me something. 😂

---

# I would also change the homepage structure for launch

Don't show:

> **NEWEST PROBLEMS**

That will expose emptiness immediately.

Use:

### 🔥 TRENDING PROBLEMS

Activity recently.

### ⚔️ BEING FOUGHT OVER

Problems with active SaaS bidders.

### 🆕 NEW PAINS

Fresh user submissions.

### 🏴 UNCLAIMED

Problems with demand but no SaaS solution yet.

Now even with relatively little activity, the website feels like a **market**, not a chronological database.

---

## The first 24 hours

I would launch with approximately:

**50 curated problems**

**5–10 real user-posted problems**, ideally from people you can get before launching publicly

and ideally **5–10 founder friends given free claim credits**.

Important: their bids can be `$0 launch credits`, but the UI can simply show:

> **Founding claim**

Don't fake that they paid money.

Then your homepage on launch already has:

> 50 problems
> 8 solutions
> 14 active claims
> real clicks beginning to accumulate

The machine is moving when X arrives.

---

And I think this gives us the correct philosophical answer:

**Users don't create FIXTHIS's inventory.**

They **validate, expand and create additional inventory.**

FIXTHIS begins with a useful map of problems itself.

That's exactly how you avoid the two-sided marketplace death spiral.

If we relied on random people arriving first and thoughtfully writing problems, **I'd tell you not to launch this.**


Yes. I did this as **actual seed research**, not “ChatGPT invent 30 SaaS problems.”

I searched Reddit heavily and cross-checked X where indexing gave usable posts. I weighted each problem roughly by: **repetition across independent users, pain intensity/time or money lost, number of SaaS companies that could legitimately advertise against it, and how instantly understandable/clickable the problem is.** I also deliberately downgraded obvious “I built X because…” validation-bait posts unless there was independent evidence behind the pain.

One caveat: **X is much worse than Reddit for searchable/indexable historical conversations**, so Reddit ended up carrying more of the evidence. I still found useful X corroboration for several themes such as CAPTCHA friction, Adobe pricing, PDF extraction, scattered feedback, etc.

## The 30 problems I would seed FIXTHIS with

| #  | Problem statement I'd actually put on FIXTHIS                                                                                                                    |      Score | Research signal                                                                                                                                                                                 |
| -- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1  | **“I hate chasing clients for unpaid invoices. I want the reminders and escalation handled automatically without sounding like an asshole.”**                    |  **10/10** | This came up repeatedly from freelancers and small businesses: forgetting reminders, wasting hours, uncertainty over tone, and wanting escalating email/SMS/WhatsApp automation. ([Reddit][1])  |
| 2  | **“I keep forgetting to follow up with potential clients. I want something simpler than a CRM that just tells me who needs a follow-up today.”**                 | **9.8/10** | Direct small-business and freelancer pain: spreadsheets/reminders don't stick, leads quietly die, full CRMs feel like overkill. ([Reddit][2])                                                   |
| 3  | **“QuickBooks has become way too expensive and bloated for my small business. I just need simple accounting.”**                                                  | **9.7/10** | Very current complaint. Small operators explicitly looking for cheaper replacements as QBO prices rise while features they don't want are added. ([Reddit][3])                                  |
| 4  | **“Bookkeeping shouldn't mean hunting through my email for receipts and attaching them to transactions one by one.”**                                            | **9.6/10** | Real workflow pain involving receipt discovery, uploads and transaction matching. ([Reddit][4])                                                                                                 |
| 5  | **“Social media schedulers are ridiculously expensive, and somehow each one is still missing one feature I need.”**                                              | **9.6/10** | Multiple direct requests mentioning Hootsuite/Later/Buffer/Sprout, pricing and missing Stories/Reels/features. ([Reddit][5])                                                                    |
| 6  | **“My customers message us on email, WhatsApp, Instagram and website chat. I need ONE inbox where my team can answer everything.”**                              | **9.6/10** | Extremely clean SaaS problem. Users describe missed messages because staff must watch several apps. ([Reddit][6])                                                                               |
| 7  | **“I need an Intercom alternative that doesn't become insanely expensive and actually handles the channels I use.”**                                             | **9.5/10** | Direct Intercom replacement request citing price/experience and routing limitations, including WhatsApp. ([Reddit][7])                                                                          |
| 8  | **“Form builders get expensive exactly when your forms start getting real traffic. I want simple pricing that doesn't punish responses.”**                       | **9.4/10** | Typeform pricing is repeatedly the objection; response limits and scaling costs are explicitly mentioned. ([Reddit][8])                                                                         |
| 9  | **“Google Analytics is way too complicated. I just want understandable website stats without a giant dashboard and annoying cookie mess.”**                      | **9.4/10** | Multiple recent users independently describe GA4 as bloated, overwhelming or clunky and ask for simpler/privacy-friendly analytics. ([Reddit][9])                                               |
| 10 | **“Zapier becomes stupidly expensive once automations actually start running at volume.”**                                                                       | **9.3/10** | Current automation users specifically looking to switch because costs climb as workflows grow. ([Reddit][10])                                                                                   |
| 11 | **“Why am I paying a full Airtable seat for people who barely touch the database?”**                                                                             | **9.1/10** | Very concrete B2B pricing pain with teams paying for light collaborators/editors. ([Reddit][11])                                                                                                |
| 12 | **“I keep learning about competitor pricing and feature changes from my own customers. I want automatic meaningful alerts.”**                                    | **9.5/10** | Founders describe manually checking pricing pages weekly and being surprised by competitor changes. ([Reddit][12])                                                                              |
| 13 | **“Customer feedback is scattered across email, surveys, reviews and social media. I need one place that tells me what people are actually complaining about.”** | **9.5/10** | A Series B GTM operator described exactly this problem; it also appears in other product-feedback discussions and on X. ([Reddit][13])                                                          |
| 14 | **“Meeting notes are useless if I still forget the action items. I want the summary, next steps AND context from our previous meetings before the next call.”**  | **9.2/10** | Managers explicitly requested meeting summaries, action plans and pre-meeting reminders from previous conversations. ([Reddit][14])                                                             |
| 15 | **“Scheduling a meeting across four time zones should not require everyone doing timezone math in their head.”**                                                 | **9.1/10** | Multiple posts and strong user reactions around finding fair overlap across global teams. ([Reddit][15])                                                                                        |
| 16 | **“I need to pull tables out of PDFs into Excel without destroying the rows and columns.”**                                                                      | **9.3/10** | Direct complaint that copy/paste and converters scramble tables; the same technical pain appears on X. ([Reddit][16])                                                                           |
| 17 | **“I have 100+ browser tabs because every one feels important. I need to save the context without creating another graveyard of bookmarks.”**                    | **9.2/10** | Very high-engagement Reddit threads show this is widespread rather than a niche founder complaint. ([Reddit][17])                                                                               |
| 18 | **“I dump useful links, screenshots and posts into Slack and then can never properly organize or rediscover them.”**                                             | **8.9/10** | Users explicitly describe using Slack as an accidental knowledge store and wanting clustering/search/indexing. ([Reddit][18])                                                                   |
| 19 | **“My screenshots are basically a second camera roll. I want them automatically organized and searchable by what is inside them.”**                              | **8.7/10** | Existing user projects and responses show recurring interest in app-based grouping, keyword search and cleanup. ([Reddit][19])                                                                  |
| 20 | **“A notes/wiki app is useless to me if I lose access to everything when the internet sucks. I need proper offline-first Notion.”**                              | **9.3/10** | One of the strongest repeated Notion complaints, with large threads and people switching products over it. ([Reddit][20])                                                                       |
| 21 | **“I know the note exists in Notion. Search just refuses to find the damn thing.”**                                                                              | **8.9/10** | Direct detailed complaints about nested text and unreliable/inconsistent search results. ([Reddit][21])                                                                                         |
| 22 | **“I need a way to capture a thought instantly into my knowledge base without opening the app, finding the vault/page and organizing it first.”**                | **8.6/10** | Obsidian users describe capture friction and wanting quick text/voice dumping for later organization. ([fi.reddit.com][22])                                                                     |
| 23 | **“Canva turns a 30-minute video edit into two hours because it keeps loading, freezing and failing to export.”**                                                | **8.8/10** | Direct Canva Pro user looking for alternatives after severe performance/export problems. ([Reddit][23])                                                                                         |
| 24 | **“Reading hundreds of App Store reviews manually is a terrible way to discover what users actually hate or what changed after a release.”**                     | **9.0/10** | Multiple developers independently built workflows around review triage, trend detection, replies and complaint clustering because App Store Connect/review analysis is painful. ([Reddit][24])  |
| 25 | **“People on Reddit and X are literally asking for products like mine, but finding those conversations manually is impossible.”**                                | **9.0/10** | Direct request from a business wanting automated Reddit prospect discovery; other founders are actively building around the same intent signal. ([Reddit][25])                                  |
| 26 | **“I have no idea whether ChatGPT/Claude recommend my company or my competitors—or what I need to change to appear there.”**                                     | **8.9/10** | Very current SaaS request asking specifically for GEO/AIO/LLM visibility auditing. ([Reddit][26])                                                                                               |
| 27 | **“I need bot protection that doesn't randomly block real users or cost a fortune.”**                                                                            | **9.0/10** | Strong X signal: Theo described Turnstile as effective against abuse but having significant failures, while considering reCAPTCHA too expensive; the post had substantial engagement. ([X][27]) |
| 28 | **“Adobe costs too much, and cancelling or changing plans feels deliberately hostile. I need a serious alternative, not a toy.”**                                | **9.2/10** | Both Reddit and X contain direct high-engagement frustration around Creative Cloud pricing/cancellation economics. ([Reddit][28])                                                               |
| 29 | **“Skype disappeared, but I still need cheap international calls to actual mobile and landline numbers—not another video meeting app.”**                         | **8.5/10** | A very specific underserved behavior surfaced after Skype's shutdown; a weekend MVP reportedly found paying demand around exactly this feature. ([Reddit][29])                                  |
| 30 | **“VMware pricing no longer makes sense for a small deployment. I need something reliable without enterprise-scale licensing.”**                                 | **8.8/10** | Sysadmins describe dramatic licensing increases and moving smaller sites away from VMware. High-value, narrower B2B pain. ([Reddit][30])                                                        |

### What I would actually launch with

I **wouldn't dump all 30 onto the homepage equally**.

Your first screen should have problems where a visitor understands the pain in **under two seconds** and where multiple recognizable SaaS companies can fight over the placement.

My strongest launch batch would be **invoice chasing, lead follow-ups, QuickBooks cost, social scheduling, unified inbox, Intercom cost, Typeform pricing, GA4 complexity, Zapier cost, competitor monitoring, scattered feedback, timezone meetings, PDF tables, browser-tab hell, Notion offline, and Adobe pricing.**

Those have the cleanest combination of:

**“Oh fuck yes, I have this problem” + multiple companies capable of bidding to solve it.**

Something like VMware is legitimate and valuable, but it belongs deeper in the feed because only a small percentage of random X traffic will understand it.

And I would preserve the research provenance inside FIXTHIS itself. Each curated problem could have a tiny:

> **Sourced from public user discussions ↗**

Clicking it can eventually reveal the Reddit/X source posts.

That gives FIXTHIS something Outbid doesn't have:

**the problems aren't invented marketing categories. There are receipts showing people actually complaining about them.**

That may become a surprisingly important trust layer.

I also found enough material during this research that we could easily build **100+ legitimate problems**, but I stopped at the ones I'd actually be comfortable putting on launch day rather than padding the number with weak shit.

[1]: https://www.reddit.com/r/freelanceuk/comments/1qis45h/how_do_you_follow_up_on_unpaid_invoices_without/?utm_source=chatgpt.com "How do you follow up on unpaid invoices without making it awkward?"
[2]: https://www.reddit.com/r/sideprojects/comments/1rya8md/i_kept_forgetting_to_follow_up_with_potential/?utm_source=chatgpt.com "I kept forgetting to follow up with potential clients, so I mocked up a simple solution"
[3]: https://www.reddit.com/r/smallbusiness/comments/1uq9ejx/cheaper_alternatives_to_quickbooks/?utm_source=chatgpt.com "Cheaper alternatives to Quickbooks"
[4]: https://www.reddit.com/r/Bookkeeping/comments/1nu1j94/how_can_i_do_bookkeeping_faster/?utm_source=chatgpt.com "How can I do bookkeeping faster?"
[5]: https://www.reddit.com/r/SocialMediaMarketing/comments/19756fd/sick_of_pricey_featureless_sm_schedulers_looking/?utm_source=chatgpt.com "Sick of pricey, featureless SM schedulers. Looking for alternative to Hootsuite"
[6]: https://www.reddit.com/r/EmailProspecting/comments/1vqxjki/getting_support_questions_on_email_instagram_dms/?utm_source=chatgpt.com "Getting support questions on email, Instagram DMs, WhatsApp AND our website chat, how o manage all of this in one place?"
[7]: https://www.reddit.com/r/SaaS/comments/zl4dkc/any_suggestions_to_replace_intercom_were_done/?utm_source=chatgpt.com "Any suggestions to replace Intercom? We're done with it."
[8]: https://www.reddit.com/r/SaaS/comments/1qvv5ku/i_started_building_a_form_tool_after_realizing/?utm_source=chatgpt.com "I started building a form tool after realizing pricing becomes the real bottleneck, not features"
[9]: https://www.reddit.com/r/SaaS/comments/1u91vsu/best_google_analytics_alternatives_for_a_newly/?utm_source=chatgpt.com "Best Google Analytics alternatives for a newly launched SaaS?"
[10]: https://www.reddit.com/r/automation/comments/1t78cd0/what_are_people_switching_to_instead_of_zapier/?utm_source=chatgpt.com "what are people switching to instead of Zapier?"
[11]: https://www.reddit.com/r/Airtable/comments/1m8wpvh/airtable_per_user_pricing_model_is_too_high/?utm_source=chatgpt.com "Airtable per user pricing model is too high"
[12]: https://www.reddit.com/r/SaaS/comments/1rwn9kh/how_do_you_track_competitor_pricingfeatures/?utm_source=chatgpt.com "How do you track competitor pricing/features? Manual checks or is there a better way?"
[13]: https://www.reddit.com/r/SaaS/comments/1qu1nm2/what_do_you_use_to_collect_customer_feedback/?utm_source=chatgpt.com "What do you use to collect customer feedback across multiple different channels?"
[14]: https://www.reddit.com/r/ITManagers/comments/1gm0ymf/tools_for_meeting_summary_and_reminders_for/?utm_source=chatgpt.com "Tools for meeting summary and reminders for managers"
[15]: https://www.reddit.com/r/SideProject/comments/1vib3d4/simple_tool_that_shows_the_best_times_to_meet/?utm_source=chatgpt.com "Simple tool that shows the best times to meet when people are in different time zones around the world"
[16]: https://www.reddit.com/r/SideProject/comments/1tm08p6/i_built_a_free_pdf_table_extractor_because_every/?utm_source=chatgpt.com "I built a free PDF table extractor because every tool I tried destroyed the formatting"
[17]: https://www.reddit.com/r/ADHD/comments/1bury3i/you_have_how_many_tabs_open/?utm_source=chatgpt.com "You have HOW MANY tabs open?"
[18]: https://www.reddit.com/r/Slack/comments/zjg0ba?utm_source=chatgpt.com "Does anyone else use slack to manage bookmarks, screenshots etc?"
[19]: https://www.reddit.com/r/tasker/comments/1ua7ak2/project_share_tagly_v10_organize_screenshots_and/?utm_source=chatgpt.com "[Project Share] Tagly v1.0 – Organize screenshots and screen recordings by app, find media using AI-powered keyword search, and automate old media cleanup"
[20]: https://www.reddit.com/r/Notion/comments/ljy0h1?utm_source=chatgpt.com "The Reason Notion's Flaws Frustrate Me So Much is Because it's Such an Amazing Product"
[21]: https://www.reddit.com/r/Notion/comments/14rzqtx/notions_search_function_is_frustrating_and/?utm_source=chatgpt.com "Notion's Search Function is Frustrating and Unreliable"
[22]: https://fi.reddit.com/r/ObsidianMD/comments/1gu5day/ive_built_a_quick_capture_app_for_obsidian_that/?utm_source=chatgpt.com "I’ve built a quick capture app for obsidian that let you send notes to Obsidian 10x faster + supports voice notes and many other features :ObsidianMD"
[23]: https://www.reddit.com/r/canva/comments/1901mkk/canva_is_frustrating_alternative_websites/?utm_source=chatgpt.com "Canva is frustrating, alternative Websites?"
[24]: https://www.reddit.com/r/Appstore/comments/1ttsx73/i_built_a_tool_that_runs_llm_analysis_on_app/?utm_source=chatgpt.com "I built a tool that runs LLM analysis on App Store reviews. Looking for feedback before I tell anyone about it"
[25]: https://www.reddit.com/r/SaaS/comments/1u5ivq4/looking_for_a_reddit_tool/?utm_source=chatgpt.com "Looking for a Reddit tool"
[26]: https://www.reddit.com/r/SaaS/comments/1tl9mce/looking_for_a_tool_to_audit_my_saas_for_geoaio/?utm_source=chatgpt.com "Looking for a tool to audit my SaaS for GEO/AIO whatever you call it"
[27]: https://x.com/theo/status/1889885678839931350?utm_source=chatgpt.com "X 上的 Theo - t3.gg：“CloudFlare's Turnstile is a really, really good captcha solution. It pretty much fully stopped abuse of T3 Chat. Sadly, it has a pretty high failure rate 🙃 would love some alternatives to consider. Recaptcha is too expensive imo” / X"
[28]: https://www.reddit.com/r/FuckAdobe/comments/1rkvbss/adobe_is_too_fcking_expensive/?utm_source=chatgpt.com "Adobe is too f*cking expensive"
[29]: https://www.reddit.com/r/SaaS/comments/1kakpmh/my_nonai_app_made_8000_usd_in_2_months_heres_how/?utm_source=chatgpt.com "My non-AI app made $8000 USD in 2 months. Here’s how I did it"
[30]: https://id.reddit.com/r/sysadmin/comments/1sudhzb/vmware_alternatives/?utm_source=chatgpt.com "VMWare alternatives : sysadmin"



