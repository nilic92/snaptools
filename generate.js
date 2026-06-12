#!/usr/bin/env node
// Static site generator for SnapTools.
// Reads tools.json and writes: tools/<slug>.html, index.html, sitemap.xml, robots.txt
// Run:  node generate.js
//
// To add a tool: add an entry to tools.json and re-run. No HTML by hand.

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools.json'), 'utf8'));
const { brand, domain, tagline } = cfg.site;
const analytics = cfg.site.analytics || ''; // raw <script> snippet, injected before </head>
const tools = cfg.tools;

const heicScript =
  '<script src="https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js"></script>';

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function logoMarkup(rel) {
  return `<a class="logo" href="${rel}index.html">Snap<span>Tools</span></a>`;
}

function header(rel) {
  return `<header class="site">
  <div class="container">
    ${logoMarkup(rel)}
    <nav><a href="${rel}index.html">All tools</a></nav>
  </div>
</header>`;
}

function footer() {
  return `<footer class="site"><div class="container">${esc(brand)} · ${esc(tagline)}</div></footer>`;
}

function qualityControls(t) {
  const slider = t.quality
    ? `<label>Quality: <span id="qualityVal">90%</span></label>
    <input type="range" id="quality" min="40" max="100" value="90">`
    : '';
  return `<div class="controls">
    ${slider}
    <button class="btn secondary" id="downloadAll" disabled>Download all</button>
  </div>`;
}

function seoBlock(t) {
  return t.seo
    .map((s) => `    <h2>${esc(s.h2)}</h2>\n    <p>${esc(s.p)}</p>`)
    .join('\n');
}

function toolPage(t) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(t.title)} | ${esc(brand)}</title>
<meta name="description" content="${esc(t.metaDesc)}">
<link rel="canonical" href="${domain}/tools/${t.slug}.html">
<link rel="stylesheet" href="../style.css">
${t.heic ? heicScript + '\n' : ''}${analytics ? analytics + '\n' : ''}</head>
<body>
${header('../')}

<main class="container">
  <h1>${esc(t.h1)}</h1>
  <p class="sub">${esc(t.sub)}</p>

  <div class="dropzone" id="dropzone">
    <div class="big">${esc(t.drop)}</div>
    <div class="small">${esc(t.small)}</div>
    <input type="file" id="fileInput" accept="${esc(t.accept)}" multiple>
  </div>

  ${qualityControls(t)}

  <div class="privacy-note">🔒 <span><b>100% private.</b> Conversion runs in your browser — nothing is uploaded.</span></div>

  <div class="results" id="results"></div>

  <div class="ad-slot">Ad slot (728×90) — replace with AdSense unit after approval</div>

  <section class="seo">
${seoBlock(t)}
  </section>
</main>

${footer()}

<script src="../converter.js"></script>
<script>initConverter({ outputMime: '${t.outputMime}', outputExt: '${t.outputExt}' });</script>
</body>
</html>
`;
}

function indexPage() {
  const cards = tools
    .map(
      (t) => `    <a class="tool-card" href="tools/${t.slug}.html">
      <div class="t">${esc(t.h1)}</div>
      <div class="d">${esc(t.sub)}</div>
    </a>`
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(brand)} — Free Online Image Converters (Private, No Upload)</title>
<meta name="description" content="Free in-browser image tools: HEIC to JPG, WebP to PNG, PNG to WebP, compress image and more. Fast, batch-capable, and 100% private — files never leave your device.">
<link rel="canonical" href="${domain}/">
<link rel="stylesheet" href="style.css">
${analytics ? analytics + '\n' : ''}</head>
<body>
${header('')}

<main class="container">
  <h1>Free image tools that respect your privacy</h1>
  <p class="sub">Convert and compress images right in your browser. No upload, no sign-up, no limits.</p>

  <div class="tools-grid">
${cards}
  </div>

  <div class="ad-slot">Ad slot — replace with AdSense after approval</div>

  <section class="seo">
    <h2>Why ${esc(brand)}?</h2>
    <p><strong>Private by design.</strong> Most online converters upload your files to a server. ${esc(brand)} does everything inside your browser, so your photos never leave your device. It's faster too — no upload, no wait.</p>
    <h2>Free and unlimited</h2>
    <p>No accounts, no watermarks, no daily limits. Convert as many files as you want.</p>
  </section>
</main>

${footer()}
</body>
</html>
`;
}

function sitemap() {
  const urls = [`${domain}/`].concat(
    tools.map((t) => `${domain}/tools/${t.slug}.html`)
  );
  const body = urls
    .map((u) => `  <url><loc>${u}</loc></url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

function robots() {
  return `User-agent: *
Allow: /

Sitemap: ${domain}/sitemap.xml
`;
}

// --- write everything ---
fs.mkdirSync(path.join(ROOT, 'tools'), { recursive: true });
let count = 0;
for (const t of tools) {
  fs.writeFileSync(path.join(ROOT, 'tools', `${t.slug}.html`), toolPage(t));
  count++;
}
fs.writeFileSync(path.join(ROOT, 'index.html'), indexPage());
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap());
fs.writeFileSync(path.join(ROOT, 'robots.txt'), robots());

console.log(`✓ Generated ${count} tool pages + index.html + sitemap.xml + robots.txt`);
console.log(`  Domain: ${domain}  (edit tools.json → site.domain before deploy)`);
