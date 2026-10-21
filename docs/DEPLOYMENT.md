# Deploying FreeKit AI for free

## Which free host?

Checked in October 2026. Re-check the terms yourself before launch, because they change.

| Host | Free plan allows ads and affiliate links? | Notes |
| --- | --- | --- |
| **Cloudflare Pages** ✅ recommended | Yes. Cloudflare's self-serve terms do not limit free plans to non-commercial use. | 500 builds/month, 20,000 files/site, 25 MiB per file, 100 custom domains per project. Static requests are free and unmetered. |
| Vercel (Hobby) ❌ | **No.** Hobby is "non-commercial personal use only". Ads (e.g. AdSense) and affiliate-focused sites count as commercial. | Needs the paid Pro plan for this project. |
| GitHub Pages ❌ | **No** for this use. GitHub says Pages is not meant to run an online business or commercial SaaS. | Fine for personal or portfolio sites. |
| Netlify (Free) | Check the current terms before choosing it. | It's a possible alternative if you prefer it. |

Sources: [Cloudflare Pages limits](https://developers.cloudflare.com/pages/platform/limits/), [Cloudflare self-serve terms](https://www.cloudflare.com/terms/), [Vercel fair use / commercial usage](https://vercel.com/docs/limits/fair-use-guidelines), [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits).

Two Cloudflare terms worth knowing: free-plan sites must not process credit card details on the site itself (use a payment provider's hosted checkout later), and Cloudflare may set security cookies. The privacy policy already mentions those cookies.

---

## Option A: Deploy from GitHub (recommended, auto-deploys on every push)

1. **Create a free GitHub account** and a new repository (it can be private).
2. **Push this folder** to the repository. `dist/` is ignored by `.gitignore`, because Cloudflare builds it.
   ```bash
   git init
   git add .
   git commit -m "Initial site"
   git branch -M main
   git remote add origin https://github.com/<you>/freekit-ai.git
   git push -u origin main
   ```
3. **Create a free Cloudflare account** at dash.cloudflare.com.
4. Go to **Workers & Pages → Create → Pages → Connect to Git**, and choose the repository.
   (If the dashboard steers you toward a *Worker* instead, look for the "Pages" tab or "Import an existing Git repository" option. This site is plain static files and works with either product.)
5. Build settings:
   | Setting | Value |
   | --- | --- |
   | Framework preset | None |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Environment variable (optional) | `SITE_URL` = your final URL, e.g. `https://freekit-ai.pages.dev` |
6. Select **Save and Deploy**. Your site will be live at `https://<project-name>.pages.dev` within a minute or two.
7. **Set the real base URL.** Put your `*.pages.dev` address (or custom domain) in `site.config.json` → `baseUrl` and push again. This updates canonical URLs, `sitemap.xml`, and `robots.txt`.

## Option B: Direct upload (no Git)

> A Direct Upload project **cannot be switched to Git later**; you would create a new project. Drag and drop allows up to 1,000 files (this site has about 40).

1. Run `npm run check` locally. It builds `dist/` and verifies it.
2. In Cloudflare: **Workers & Pages → Create application → Get started → Drag and drop your files**.
3. Enter a project name (it becomes `<name>.pages.dev`), then select **Deploy site**.
4. Drag the `dist` folder into the upload area (or click to browse and pick it), then select **Save and Deploy**.
5. If the address you got isn't `https://freekit-ai.pages.dev`, put the real one in `site.config.json` → `baseUrl`, run `npm run check` again, and redeploy.
6. To update: open the project → **Create a new deployment** → **Production** → upload the new `dist` folder. You can also use the CLI (it asks you to log in once):
   ```bash
   npx wrangler pages deploy dist --project-name freekit-ai
   ```

## After the first deploy

1. **Check the live site.** Open every tool, try the examples, and check `/sitemap.xml`, `/robots.txt`, and a made-up URL (it should show the 404 page).
2. **Security headers.** `src/static/_headers` sets a strict Content-Security-Policy and other headers on Cloudflare Pages. If you later add a third-party script (ads, analytics, a form service), add its domain to the CSP there, or it will be blocked.
3. **Custom domain (optional, about $10/year).** It's not needed to launch. In the Pages project, open **Custom domains → Set up a domain**. Then update `baseUrl` and rebuild.

## Google Search Console (free)

1. Go to <https://search.google.com/search-console> and add a **URL prefix** property with your exact site URL.
2. Choose **HTML tag** verification, and copy only the `content="..."` value into `site.config.json` → `searchConsoleVerification`. Rebuild and deploy, then select **Verify**.
   (With a custom domain on Cloudflare you can use DNS verification instead.)
3. In **Sitemaps**, submit `sitemap.xml`.
4. Use **URL Inspection → Request indexing** for the homepage and the five tool pages.
5. Bing Webmaster Tools can import your Search Console setup in a few clicks.

Indexing can take days to weeks, and nothing guarantees rankings.

## Privacy-friendly analytics (optional, free)

Cloudflare Web Analytics doesn't use cookies and is free.

1. Cloudflare dashboard → **Analytics & Logs → Web Analytics → Add a site**, choose the manual JavaScript snippet, and copy the `token` value.
2. Put it in `site.config.json` → `analytics.cloudflareWebAnalyticsToken`, then rebuild and deploy.
3. The build then automatically:
   - adds the beacon script to every page,
   - allows its domains in the Content-Security-Policy,
   - switches the privacy policy text to describe the analytics.

(For Pages projects you can also turn on Web Analytics from the project's **Metrics** tab, without changing code. If you do, update the privacy policy by setting the token as above anyway, so the policy stays accurate.)
