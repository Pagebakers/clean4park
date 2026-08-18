# clean4park

Landing page for [clean4park.com](https://clean4park.com) — an independent vanlife project by Beatriz and Eelco. Built with [Astro](https://astro.build) and [Tailwind CSS](https://tailwindcss.com), ready to deploy on Cloudflare.

## Local development

Requires Node.js 22.12 or later.

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Static files land in `dist/`.

## Deploy on Cloudflare

This is a static Astro site. You can ship it with Cloudflare Workers (assets) or Cloudflare Pages.

### Cloudflare Pages

1. Connect this GitHub repository in the Cloudflare dashboard.
2. Set the build command to `npm run build`.
3. Set the output directory to `dist`.
4. Attach the `clean4park.com` custom domain.

### Cloudflare Workers

```bash
npx wrangler login
npm run deploy
```

`wrangler.jsonc` serves the `dist` folder and a Worker that powers `/api/instagram.json`. After the first deploy, add `clean4park.com` as a custom domain on the Worker.

## Instagram feed

The community section loads public posts that mention [@clean4park](https://www.instagram.com/clean4park/) or use `#clean4park`.

- Build time and `/api/instagram.json` fetch the public Instagram profile and hashtag.
- On Cloudflare, the Worker (or Pages Function) refreshes that feed live.
- Optional official Graph API: set `INSTAGRAM_ACCESS_TOKEN` and `INSTAGRAM_USER_ID` if `@clean4park` is converted to a professional account. That also picks up tagged/mentioned media more reliably.

## Amazon affiliate links

Product cards in `src/data/products.ts` search Amazon and append the affiliate tag.

Replace `AMAZON_TAG` (and `AMAZON_HOST` if you prefer Amazon.de / Amazon.nl) before going live.

## Photo credits

Hero and story photos are from [Unsplash](https://unsplash.com).
