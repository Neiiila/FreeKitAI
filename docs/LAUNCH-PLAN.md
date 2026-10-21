# 90-day launch and monetization plan

This is a working plan, not a forecast. It contains **no traffic, conversion, or income estimates**, because there is no data yet to base them on. Decide each next step from your own numbers.

## Metrics to watch (and where)

| Metric | What it tells you | Where to find it |
| --- | --- | --- |
| **Impressions** | Whether Google shows your pages at all | Search Console → Performance |
| **Clicks and CTR** | Whether titles and descriptions attract people | Search Console → Performance |
| **Search queries** | The words real people use, which become ideas for pages and improvements | Search Console → Performance → Queries |
| **Indexed pages** | Whether Google has accepted your pages | Search Console → Pages |
| **Visits per page** | Which tools people actually open | Cloudflare Web Analytics |
| **Engaged visits / tool usage** | Whether people use the tool, not just land on it | Not tracked today, by design. To measure it, add a privacy-friendly event tool *and* update the privacy policy. Count events such as "generate clicked" only, never the text. |
| **Returning visitors** | Real usefulness | Analytics (approximate without cookies) |
| **Affiliate clicks and revenue** | Whether recommendations help people | Each affiliate dashboard (once approved) |
| **Revenue per 1,000 visits** | Whether a revenue source is worth its UX cost | Your own spreadsheet, monthly |

Keep a simple weekly log (date, impressions, clicks, top queries, top pages, notes). Trends over several weeks matter more than single days.

---

## Days 1–30: build, launch, get indexed

- [ ] Choose the final name, check domain and trademark availability, and update `site.config.json`.
- [ ] Set `contactEmail`, `operator`, and `jurisdiction`. Review the privacy policy and terms, then remove the draft banners.
- [ ] Deploy to Cloudflare Pages ([DEPLOYMENT.md](DEPLOYMENT.md)) and run through every tool on a real phone.
- [ ] Set up Search Console, submit the sitemap, and request indexing for the homepage and the 5 tool pages.
- [ ] Optional: turn on Cloudflare Web Analytics.
- [ ] Publish 2–3 more guides from [EDITORIAL-PLAN.md](EDITORIAL-PLAN.md) (3 are already live). Quality matters more than count.
- [ ] Ask 5–10 real people (friends, classmates, colleagues) to use one tool for a real task, and note where they get stuck.

## Days 31–60: learn from real behavior

- [ ] Every week, review Search Console queries. For each query with impressions but few clicks, improve that page's title and description. For a query you don't answer yet, add a section or FAQ if it fits.
- [ ] Fix every point of confusion from user feedback.
- [ ] Share genuinely useful demonstrations, not ads:
  - Pinterest: "before/after" resume bullet graphics, email templates.
  - YouTube Shorts / TikTok: 30-second screen recordings (e.g. "fix messy PDF text in 5 seconds").
  - Communities (Reddit, LinkedIn, forums): answer the actual question and link only where the tool helps. Follow each community's self-promotion rules.
- [ ] Don't buy traffic, followers, or reviews.
- [ ] By day 60, **identify the most promising tool** from impressions, clicks, and direct feedback.

## Days 61–90: double down on what works

- [ ] Improve the best tool: more templates, more options people asked for, better examples.
- [ ] Write 2–3 supporting guides around the best tool's real search queries.
- [ ] **Affiliate test:** only if there is a natural fit (e.g. a resume template service on the resume page), apply to 1–2 programs. Add clearly labeled links, update `/affiliate-disclosure/`, and measure clicks for a month.
- [ ] **Digital product test:** only if people ask for it (e.g. repeated requests for email templates). Make one small template pack, sell it through a hosted checkout, and add a product page ([SERVICES.md](SERVICES.md)).
- [ ] **Advertising readiness:** consider applying to an ad network only when the site has consistent organic traffic, original content on every page, and complete policy pages. Read the network's current program policies first. Ads must never cover or push down the tools.

## Monetization stages (summary)

1. **Free tools** (now): build trust and traffic.
2. **Affiliate links**: relevant, optional, and clearly disclosed. No invented offers.
3. **Digital products**: template packs and content calendars, sold through a hosted checkout.
4. **Advertising**: after approval. Keep the layout clean, with ads below the tool output, never between the form and the results.
5. **Optional AI features**: only through a secure backend, labeled honestly ([FUTURE-AI.md](FUTURE-AI.md)).

## Decision rules

- If a tool gets no impressions after ~8 weeks of being indexed, check its title and description and whether the topic is too competitive. Consider a more specific angle.
- If a revenue source makes the tools slower or more confusing, remove it.
- Add a new tool only when you see demand for it (queries, requests), not just because it's easy to build.
