import { readFile, mkdir, writeFile, copyFile, readdir } from 'node:fs/promises';

const config = JSON.parse(await readFile(new URL('./site.config.json', import.meta.url), 'utf8'));
const strict = process.argv.includes('--check');
const url = value => { try { const parsed = new URL(value); return parsed.protocol === 'https:' ? value : ''; } catch { return ''; } };
const escape = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const json = value => JSON.stringify(value).replaceAll('<', '\\u003c').replaceAll('>', '\\u003e').replaceAll('&', '\\u0026');
const image = (asset, className = '') => {
  if (!asset) return '';
  if (!url(asset.url) || !Number.isInteger(asset.width) || !Number.isInteger(asset.height) || asset.width < 1 || asset.height < 1) throw new Error('Each image needs an HTTPS url and its positive integer width and height.');
  return `<amp-img class="${escape(className)}" src="${escape(asset.url)}" width="${asset.width}" height="${asset.height}" layout="responsive" alt="${escape(asset.alt || '')}"></amp-img>`;
};

const required = {
  canonicalUrl: url(config.canonicalUrl), faviconUrl: url(config.faviconUrl),
  signupUrl: url(config.signupUrl), loginUrl: url(config.loginUrl),
  ga4MeasurementId: /^G-[A-Z0-9]+$/.test(config.ga4MeasurementId) ? config.ga4MeasurementId : '',
  logo: config.logo?.url && config.logo?.width && config.logo?.height ? 'present' : '',
  heroImage: config.heroImage?.url && config.heroImage?.width && config.heroImage?.height ? 'present' : ''
};
const missing = Object.entries(required).filter(([, value]) => !value).map(([key]) => key);
if (strict && JSON.stringify(config).includes('Content Doc')) missing.push('final content from Content Doc');
if (strict && missing.length) throw new Error(`Missing required project data: ${missing.join(', ')}`);
if (!Array.isArray(config.faq) || config.faq.length < 3 || config.faq.length > 5) throw new Error('Provide 3–5 FAQ entries.');

const canonical = required.canonicalUrl || 'https://example.com/';
const schema = [
  { '@context': 'https://schema.org', '@type': 'WebSite', name: config.brand, url: canonical },
  { '@context': 'https://schema.org', '@type': 'Organization', name: config.organization.name || config.brand, url: url(config.organization.url) || canonical,
    ...(url(config.organization.logoUrl) ? { logo: url(config.organization.logoUrl) } : {}) },
  { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: config.faq.map(item => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })) }
];

const markup = `<!doctype html>
<html amp lang="th">
<head>
  <meta charset="utf-8">
  <script async src="https://cdn.ampproject.org/v0.js"></script>
  <script async custom-element="amp-accordion" src="https://cdn.ampproject.org/v0/amp-accordion-0.1.js"></script>
  ${required.ga4MeasurementId ? '<script async custom-element="amp-analytics" src="https://cdn.ampproject.org/v0/amp-analytics-0.1.js"></script>' : ''}
  <title>${escape(config.title)}</title>
  <link rel="canonical" href="${escape(canonical)}">
  <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1">
  <meta name="description" content="${escape(config.description)}">
  ${required.faviconUrl ? `<link rel="icon" href="${escape(config.faviconUrl)}">` : ''}
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escape(config.title)}">
  <meta property="og:description" content="${escape(config.description)}">
  <meta property="og:url" content="${escape(canonical)}">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${escape(config.title)}">
  <meta name="twitter:description" content="${escape(config.description)}">
  ${config.heroImage ? `<meta property="og:image" content="${escape(config.heroImage.url)}">` : ''}
  <script type="application/ld+json">${json(schema)}</script>
  <style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style><noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
  <style amp-custom>
    :root{--bg:#260008;--panel:#43070d;--gold:#f6b537;--text:#fff3dd;--muted:#dbb9a2}
    *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:radial-gradient(circle at 0 4%,#801c28 0,transparent 19rem),radial-gradient(circle at 99% 86%,#6f1227 0,transparent 15rem),var(--bg);color:var(--text);font-family:system-ui,-apple-system,"Noto Sans Thai",sans-serif;font-size:16px;line-height:1.65}
    a{color:inherit;text-decoration:none}a:focus-visible{outline:3px solid #fff;outline-offset:3px}.wrap{max-width:990px;margin:auto;padding:0 20px}.site-header{background:linear-gradient(90deg,#5b080b,#b53016,#5a0b0a);border-bottom:2px solid var(--gold)}.header-inner{min-height:72px;display:flex;align-items:center;justify-content:space-between;gap:18px}.brand{font-size:1.55rem;font-weight:900;color:var(--gold);letter-spacing:.04em;white-space:nowrap}.brand amp-img{width:160px}.header-actions{display:flex;gap:9px;align-items:center}.small-link{font-size:.875rem;font-weight:700;padding:8px 13px;border:1px solid #fbc35f;border-radius:7px}.small-link.primary{background:var(--gold);color:#321006}
    main{max-width:760px;margin:0 auto;padding:24px 16px 115px}.intro{text-align:center;border:1px solid #b47a30;border-radius:16px;padding:35px 22px;background:radial-gradient(circle at 50% -20%,#b73a14,#55100d 50%,#300508);box-shadow:inset 0 0 45px #e16d1940,0 12px 30px #12000466}.eyebrow{color:#f7c969;font-size:.9rem;font-weight:700;letter-spacing:.08em}.intro h1{font-size:clamp(2rem,6vw,3.2rem);line-height:1.2;margin:6px 0 8px;color:#ffe099;text-shadow:0 2px 15px #e4661d}.intro p{margin:0;color:#ffebd3}.hero{margin:14px 0 26px;border:2px solid #b77b28;border-radius:14px;overflow:hidden;background:linear-gradient(140deg,#321152,#1b287b 45%,#860d2b);min-height:180px}.hero amp-img{display:block}.hero-fallback{min-height:260px;display:grid;place-items:center;text-align:center;padding:22px;color:#ffe4ab;font-size:clamp(1.4rem,5vw,2.8rem);font-weight:900;text-shadow:0 3px 22px #ea4b36}
    .section-title{margin:32px 0 13px;border-left:4px solid var(--gold);padding-left:12px;font-size:1.35rem;line-height:1.4;color:#ffd474}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.card,.copy,.faq section{border:1px solid #a65d29;border-radius:12px;background:linear-gradient(135deg,#681711,#350509 70%);box-shadow:inset 0 1px #f8a64830}.card{padding:21px}.card h2{font-size:1.15rem;margin:0 0 8px;color:#ffd983}.card p,.copy p{margin:0;color:#f2d8c4}.card amp-img{border-radius:8px;margin-bottom:13px;overflow:hidden}.copy{padding:22px}.faq{display:grid;gap:10px}.faq h3{font-size:1rem;margin:0;padding:15px 18px;color:#ffe08f;cursor:pointer}.faq h3:after{content:'+';float:right;font-size:1.25rem;line-height:1}.faq [expanded] h3:after{content:'−'}.faq .answer{padding:0 18px 17px;color:#f3d8c3}.site-footer{text-align:center;padding:25px 15px 105px;color:var(--muted);border-top:1px solid #863b2b}.sticky{position:fixed;bottom:0;left:0;right:0;z-index:10;background:#23050deD;border-top:1px solid #a46c2d;padding:10px max(12px,env(safe-area-inset-right)) calc(10px + env(safe-area-inset-bottom));display:flex;justify-content:center;gap:10px;backdrop-filter:blur(12px)}.sticky a{display:block;text-align:center;width:min(220px,48%);padding:11px 8px;border-radius:8px;font-weight:800;background:linear-gradient(#ffbd38,#e8750b);color:#351200;box-shadow:0 0 18px #ff9d2740}.sticky a.secondary{background:linear-gradient(#245843,#10352b);color:#e7fff1;border:1px solid #7daa61}
    @media(max-width:600px){.header-inner{min-height:64px}.brand{font-size:1.1rem}.brand amp-img{width:112px}.small-link{font-size:.75rem;padding:6px 8px}.intro{padding:24px 12px}.grid{grid-template-columns:1fr 1fr;gap:10px}.card{padding:14px}.card h2{font-size:1rem}.card p{font-size:.9rem}}
    @media(max-width:370px){.header-actions .small-link:first-child{display:none}.grid{grid-template-columns:1fr}}
  </style>
</head>
<body>
  <header class="site-header"><div class="wrap header-inner"><a class="brand" href="${escape(canonical)}" aria-label="${escape(config.brand)}">${image(config.logo, 'logo') || escape(config.brand)}</a><nav class="header-actions" aria-label="บัญชีผู้ใช้">${required.loginUrl ? `<a class="small-link" href="${escape(config.loginUrl)}">เข้าสู่ระบบ</a>` : ''}${required.signupUrl ? `<a class="small-link primary" href="${escape(config.signupUrl)}">สมัครสมาชิก</a>` : ''}</nav></div></header>
  <main>
    <section class="intro" aria-labelledby="page-title"><div class="eyebrow">${escape(config.intro.eyebrow)}</div><h1 id="page-title">${escape(config.intro.h1)}</h1><p>${escape(config.intro.text)}</p></section>
    <div class="hero">${image(config.heroImage, 'hero-image') || `<div class="hero-fallback">${escape(config.brand)}</div>`}</div>
    <section aria-labelledby="content-title"><h2 class="section-title" id="content-title">ข้อมูลเว็บไซต์</h2><div class="grid">${config.sections.map(item => `<article class="card">${image(item.image)}<h2>${escape(item.h2)}</h2><p>${escape(item.text)}</p></article>`).join('')}</div></section>
    <section aria-labelledby="about-title"><h2 class="section-title" id="about-title">รายละเอียดเพิ่มเติม</h2><div class="copy"><p>${escape(config.description)}</p></div></section>
    <section aria-labelledby="faq-title"><h2 class="section-title" id="faq-title">คำถามที่พบบ่อย</h2><amp-accordion class="faq" expand-single-section>${config.faq.map(item => `<section><h3>${escape(item.question)}</h3><div class="answer">${escape(item.answer)}</div></section>`).join('')}</amp-accordion></section>
  </main>
  <footer class="site-footer">${escape(config.brand)}</footer>
  ${required.signupUrl && required.loginUrl ? `<nav class="sticky" aria-label="ทางลัดบัญชีผู้ใช้"><a class="secondary" href="${escape(config.signupUrl)}">สมัครสมาชิก</a><a href="${escape(config.loginUrl)}">เข้าสู่ระบบ</a></nav>` : ''}
  ${required.ga4MeasurementId ? `<amp-analytics type="gtag" data-credentials="include"><script type="application/json">${json({ vars: { gtag_id: config.ga4MeasurementId, config: { [config.ga4MeasurementId]: { groups: 'default' } } }, triggers: { pageview: { on: 'visible', request: 'pageview' } } })}</script></amp-analytics>` : ''}
</body>
</html>`;
await mkdir(new URL('./dist/', import.meta.url), { recursive: true });
await writeFile(new URL('./dist/index.html', import.meta.url), markup);

// Copy assets/images → dist/images
const imgSrc = new URL('./assets/images/', import.meta.url);
const imgDest = new URL('./dist/images/', import.meta.url);
await mkdir(imgDest, { recursive: true });
const imageFiles = await readdir(imgSrc).catch(() => []);
await Promise.all(imageFiles.map(f => copyFile(new URL(f, imgSrc), new URL(f, imgDest))));
if (imageFiles.length) console.log(`Copied ${imageFiles.length} image(s) to dist/images/`);

console.log(`Built dist/index.html${missing.length ? `; awaiting: ${missing.join(', ')}` : '; ready for AMP and live URL validation'}`);
