# brittneysauerwein.com

Personal landing page for Brittney Sauerwein. Plain HTML/CSS/JS — no build step, no dependencies.

## Status — site temporarily offline

The live site is currently parked. The real landing page is preserved, untouched,
in the `site/` folder. What's deployed at the root is a minimal "Coming soon"
placeholder, and crawling is blocked.

**To bring the site back:**

```bash
rm index.html robots.txt _redirects   # remove the placeholder + offline files
git mv site/* .                        # move the real site back to the root
rmdir site
git add -A && git commit -m "Restore site"
git push origin main                   # Cloudflare Pages redeploys automatically
```

## Files

While the site is offline:

- `index.html` — minimal "Coming soon" placeholder (the deployed homepage)
- `robots.txt` — blocks all crawling while offline
- `_redirects` — bounces any `/site/*` request to the placeholder
- `CNAME` — custom domain marker for GitHub Pages (harmless for Cloudflare Pages too)
- `site/` — the full landing page, parked for future use:
  - `site/index.html` — page structure + content
  - `site/styles.css` — all styling (design tokens, layout, animations)
  - `site/script.js` — reveal-on-scroll, nav compaction, hero parallax
  - `site/favicon.svg` — monogram favicon
  - `site/assets/` — portrait images (hero, about, og)
  - `site/tools/og-card.html` — source template for the 1200×630 social preview card
  - `site/robots.txt` / `site/sitemap.xml` — SEO basics (used once restored)

Paths in the sections below are written relative to the live site root — once
restored, they sit at the repo root; while offline, they live under `site/`.

## Editing content

All copy lives in `index.html`. The most common edits:

| What | Where |
|---|---|
| Hero tagline | `<p class="hero-tagline">` block |
| About paragraph / bio | `.about-heading` and `.about-body` blocks |
| Work rows | inside `<ol class="work-list">` — each `<li class="work-row">` is one entry |
| Focus areas | inside `<ul class="clients-list">` |
| Social links | inside `<ul class="socials">` |
| Photos | replace files in `assets/` (keep the same filenames) |

## Local preview

Open `index.html` directly in a browser:

```bash
open index.html
```

Or serve with a simple local server if you want to test fetches/fonts over http:

```bash
python3 -m http.server 8080
# then visit http://localhost:8080
```

## Regenerating the social preview card

The `og-card.jpg` is what LinkedIn / iMessage / Slack show when the URL is shared. It's rendered from `tools/og-card.html` using headless Chrome:

```bash
# 1x (1200x630)
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --hide-scrollbars --window-size=1200,630 \
  --screenshot="assets/og-card.png" \
  "file://$(pwd)/tools/og-card.html"
sips -s format jpeg -s formatOptions 85 assets/og-card.png --out assets/og-card.jpg
rm assets/og-card.png

# 2x retina (2400x1260)
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=2 --window-size=1200,630 \
  --screenshot="assets/og-card@2x.png" \
  "file://$(pwd)/tools/og-card.html"
sips -s format jpeg -s formatOptions 85 assets/og-card@2x.png --out assets/og-card@2x.jpg
rm assets/og-card@2x.png
```

After pushing a change, paste the URL into [LinkedIn's Post Inspector](https://www.linkedin.com/post-inspector/) to force it to refetch.

## Deploy — Cloudflare Pages (recommended)

### 1. Push to GitHub

The repo `karthvp/britt-website` already exists:

```bash
cd "Britt's site"
git init
git add .
git commit -m "Initial site"
git branch -M main
git remote add origin git@github.com:karthvp/britt-website.git
git push -u origin main
```

### 2. Connect to Cloudflare Pages

1. Log in to the Cloudflare dashboard → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
2. Authorize GitHub and pick the `britt-website` repo.
3. **Framework preset:** None. **Build command:** leave blank. **Build output directory:** `/` (root).
4. Click **Save and Deploy**. In ~30 seconds you'll get a live URL like `britt-website.pages.dev`.

Every `git push` to `main` redeploys automatically.

### 3. Point `brittneysauerwein.com` at Cloudflare

Easiest path — **move DNS to Cloudflare** (free, also gets you DDoS + analytics):

1. In Cloudflare dashboard → **Add a site** → enter `brittneysauerwein.com` → free plan.
2. Cloudflare will auto-import existing DNS records. Verify they look right.
3. Cloudflare shows you **two nameservers** (e.g. `ana.ns.cloudflare.com`, `bob.ns.cloudflare.com`).
4. Log in to the registrar → **Domains** → `brittneysauerwein.com` → **DNS / Nameservers** → **Use Custom Nameservers** → paste Cloudflare's two NS values → save.
5. Propagation takes 5 min – 24 hrs. Cloudflare will email you when it's active.

Then in Cloudflare Pages → your project → **Custom domains** → **Set up a custom domain** → enter `brittneysauerwein.com`. Repeat for `www.brittneysauerwein.com`. SSL cert is issued automatically.

### 4. Verify

- `https://brittneysauerwein.com` → loads the site with valid SSL
- `https://www.brittneysauerwein.com` → redirects (or loads) with valid SSL
- Paste the URL into LinkedIn's post composer — confirm the Open Graph image renders
- iMessage the URL to yourself — confirm the preview card looks right

## Swapping photos later

Replace any file in `assets/` with the same filename, commit, push. That's it.

```bash
# Example: resize a larger source image into place
sips -Z 1800 -s format jpeg -s formatOptions 85 \
  ~/Downloads/new-hero.jpg --out assets/portrait-hero.jpg
```

## What's intentionally NOT here

- No analytics yet. If you want some, add Cloudflare Web Analytics (one snippet in `index.html`) — privacy-friendly and free.
- No contact form — social links are enough for a landing page.
- No CMS — for a site that changes once or twice a year, the HTML *is* the CMS.
