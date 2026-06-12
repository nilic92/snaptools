# SnapTools — free in-browser image tools

Static site. Every tool runs 100% in the browser (files never leave the user's device),
so hosting is free and there is no per-use cost — ideal for an ad-supported model.

## Structure

```
snaptools/
├── tools.json      ← single source of truth: edit this to add/change tools
├── generate.js     ← run to (re)build all pages
├── converter.js    ← shared conversion engine (used by every tool)
├── style.css       ← shared styles
├── index.html      ← generated
├── sitemap.xml     ← generated
├── robots.txt      ← generated
└── tools/*.html    ← generated (one page per tool)
```

## Add a new tool (no HTML by hand)

1. Add an object to the `tools` array in `tools.json`.
2. Run:
   ```
   node generate.js
   ```
3. Done — new page, index card, and sitemap entry are created.

`outputMime` options that work client-side everywhere: `image/jpeg`, `image/png`, `image/webp`.
`image/avif` *encoding* only works in newer Chrome, so keep AVIF as input-only (avif → jpg/png).
Set `"heic": true` only for HEIC/HEIF inputs (loads the heic2any decoder).

## Run locally

```
python3 -m http.server 8765
# open http://localhost:8765
```

## Deploy (free) — Cloudflare Pages

1. Buy a domain (~$10/yr) — short, brandable, ideally with a keyword.
2. Push this folder to a GitHub repo.
3. Cloudflare dashboard → Pages → Connect to Git → pick the repo.
   - Build command: *(leave empty — it's static)*
   - Output directory: `/`
4. Add your custom domain in Pages settings.

Alternative: Netlify (drag-and-drop the folder) or GitHub Pages.

> Before deploying, set `site.domain` in `tools.json` to your real domain and re-run
> `node generate.js` so canonical URLs and the sitemap are correct.

## After deploy — get traffic & revenue

1. **Google Search Console** → add the site → submit `sitemap.xml`.
2. **Bing Webmaster Tools** → same (don't skip Bing; easy extra traffic).
3. Build more tools (aim for 20–30) — each targets its own keyword.
4. **AdSense**: apply once you have ~10+ real pages and some traffic. Replace each
   `<div class="ad-slot">` with your AdSense unit code.
5. Later, when traffic grows, switch to **Ezoic / Mediavine / Raptive** for much higher RPM.
6. Get a few backlinks (Reddit answers, forum posts where people ask "how do I convert X").

## Honest expectations

- General-utility RPM is low (~$1–3). ~$1,000/mo ≈ **300k–500k pageviews/month**.
- SEO ramp is typically **6–12 months**. Revenue is near zero until pages rank.
- The moat is **execution**: faster, cleaner, more private, more tools than the weak
  incumbents — not the idea itself.
```
