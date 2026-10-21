# What needs an account, manual setup, or (later) money

The initial launch needs **no paid service, no API key, no custom domain, and no paid hosting**. The table lists everything else.

## Needed to launch: free accounts, manual setup

| Item | Why | Cost | Where to set it |
| --- | --- | --- | --- |
| Cloudflare account | Hosting | Free | [DEPLOYMENT.md](DEPLOYMENT.md) |
| GitHub account | Auto-deploy from Git (optional, direct upload works too) | Free | [DEPLOYMENT.md](DEPLOYMENT.md) |
| **Contact email address** | The contact page, privacy policy, and terms show a placeholder until you set one. A free mailbox works (e.g. a new Gmail/Outlook address just for the site). | Free | `site.config.json` → `contactEmail` |
| **Operator name and jurisdiction** | Legal pages show placeholders until set | Free | `site.config.json` → `operator`, `jurisdiction` |
| **Legal review** | Privacy policy and terms are drafts. They must match the services you actually use and the laws that apply to you (e.g. GDPR if you have EU visitors). Remove the yellow "Draft" banners after review. | Free (self-review) to paid (lawyer) | `src/pages/privacy.html`, `terms.html` |
| Name / trademark check | "FreeKit AI" is provisional | Free to search | `site.config.json` → `name` |

## Optional but recommended: free

| Item | Notes |
| --- | --- |
| Google Search Console / Bing Webmaster Tools | Indexing and search query data. See DEPLOYMENT.md. |
| Cloudflare Web Analytics | Cookie-free visit counts. Set the token in `site.config.json`. |

## Contact form (not built yet, on purpose)

The brief says to provide a form only if it can actually send messages. Free options for later:

- **Formspree / Web3Forms / Getform**: free tiers with monthly limits. Point a `<form action="...">` at their endpoint, add their domain to `form-action` (and `connect-src`, if you use fetch) in `src/static/_headers`, and update the privacy policy, because they process the messages.
- **Cloudflare Pages Functions + an email-sending API**: more work. The free tiers of email APIs vary.

Until then, the contact page shows the email address from the config.

## Future services: may cost money or need approval

| Item | Notes |
| --- | --- |
| Custom domain | About $10–15/year. Not required: `*.pages.dev` works. |
| **Google AdSense** or other ad networks | Requires an application and approval, and ongoing compliance with their program policies (content quality, original content, policy pages, sufficient traffic). Ads that use personalization need a consent banner (a certified CMP) for EEA/UK/Swiss visitors. Update the CSP, privacy policy, and cookie section when you add them. |
| Affiliate programs | Each program decides whether to accept the site. Many require existing traffic. Disclose links on the page and update `/affiliate-disclosure/`. Don't add placeholder or fake affiliate offers. |
| Selling digital products | Use a hosted checkout (e.g. Gumroad, Lemon Squeezy, Stripe Payment Links), so card data never touches your site. Cloudflare's free terms forbid processing card data on the site itself. These platforms charge per-sale fees. |
| Email newsletter | Free tiers exist (e.g. Buttondown, MailerLite). Needs a consent checkbox and a privacy policy update. |
| Real AI features | Needs a paid model API and a backend proxy. See [FUTURE-AI.md](FUTURE-AI.md). |

## Adding product pages later (no payment system needed now)

1. Create `src/pages/products/index.html` and one page per product (copy a guide page for the layout). Each page should show the real product preview, what's included, the price, and a "Buy on <platform>" link to the hosted checkout.
2. Add a "Templates" link to the header in `src/partials/layout.html`.
3. Only publish a product page once the product exists. A "coming soon" page is thin content and does not help users.
