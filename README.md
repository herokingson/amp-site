# AMP landing page for Cloudflare Pages

The screenshot supplied is a visual reference. `site.config.json` currently contains provisional copy; it must be replaced from the Content Doc before publishing. The provided screenshot is too small to recover all its text accurately.

## Supply project data

- Set the real HTTPS `canonicalUrl`, `faviconUrl`, signup and login URLs, and `ga4MeasurementId` (`G-...`).
- Supply `logo`, `heroImage`, and optional section images as `{ "url": "https://...", "width": 1200, "height": 600, "alt": "..." }`. Use the actual pixel dimensions. The generator emits responsive `amp-img` with the correct aspect ratio.
- Replace all provisional headings, descriptions, cards, and 3–5 FAQs with the Content Doc. FAQ JSON-LD comes from the same entries shown on the page.
- Add the business name, canonical URL and logo URL to `organization`. Do not invent identity details.

## Build and publish

Run `npm run build` to preview provisional layout, then `npm run check` to require all essential data. Deploy the `dist` directory through Cloudflare Pages Git integration; build command `npm run check`, output directory `dist`. `dist` is generated and should not be edited directly.

After the actual public URL and supplied images resolve, run AMP Validator and Google Rich Results Test against the live URL, capture their result screens, and verify GA4 pageview in DebugView. These live checks have not yet been performed. FAQPage markup does not guarantee a Google FAQ rich result.
