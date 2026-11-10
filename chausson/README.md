# Chausson Reims — The Slate, Decoded

A bilingual (EN / FR) mobile web page for **Chausson**, a vegetarian tearoom and cantine in Reims.
Visitors wipe a photo of today's handwritten chalkboard with their finger to reveal the menu,
translated into English or French, with the slate's codes decoded (SG = gluten-free, VG = vegan).

Built for the Group 6 final project, Digital Marketing Strategy, NEOMA Business School (Fall 2026).
Part of the campaign "Your Daily Chausson Moment".

## Live demo

Hosted with GitHub Pages:

```
https://<your-github-username>.github.io/<repo-name>/
```

Open it on a phone for the real experience (it is designed for vertical mobile screens).
In the real campaign, the page would live on the café's own site (for example `chausson-reims.fr/ardoise`)
so that it benefits from the domain's existing Google ranking.

## What's in this repo

| File | What it does |
| --- | --- |
| `index.html` | Page structure, SEO tags and structured data (schema.org café, address, hours, menu) |
| `style.css` | Visual identity matched to chausson-reims.fr (green #008651, orange #EC660E, blush #F1E4DD) |
| `script.js` | Wipe interaction, EN/FR language switch, today's menu content |
| `assets/board-today.jpg` | Photo of today's slate, the layer people wipe |
| `assets/logo-chausson.svg` | Chausson logo |
| `assets/chausson-pie.png` | Pie icon (Instagram avatar) |
| `assets/cafe-illustration.jpg` | Illustration of the café, also used as the link preview image |
| `assets/favicon.png`, `assets/apple-touch-icon.png` | Browser and home-screen icons |

## How to publish it (5 minutes)

1. On GitHub, click **New repository**. Name it, for example, `chausson-slate-decoder`, set it to **Public**,
   and leave "Add a README" unticked.
2. On the empty repository page, click **uploading an existing file**. Drag in `index.html`, `style.css`,
   `script.js`, `README.md` and the whole `assets` folder, then click **Commit changes**.
3. Go to **Settings → Pages**. Under "Build and deployment", choose **Deploy from a branch**,
   branch `main`, folder `/ (root)`, and click **Save**.
4. After a minute or two the page is live at the address above. Turn it into a QR code for the slides.

## Updating the menu every day

1. Replace `assets/board-today.jpg` with the photo of today's slate (portrait photos fill the board best).
2. Edit the `MENU` block at the top of `script.js`: item names in EN/FR, codes `sg` / `vg`,
   and an optional price (`null` hides it).
3. Commit the changes. GitHub Pages updates within a minute or two.

## Notes

- Fonts: Fraunces, Noto Sans and Caveat from Google Fonts.
- Works on iOS Safari and Android Chrome; uses Pointer Events with a touch fallback.
- Menu items, prices and opening hours in the demo should be confirmed with the café.
- Logo, photos and brand assets belong to Chausson Reims and are used for this student project only.
