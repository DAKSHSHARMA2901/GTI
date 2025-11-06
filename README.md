# Green Trade India – Website (2025 refresh)

Mobile‑first static site built with HTML, CSS, and a tiny bit of vanilla JS (no frameworks). Images are loaded from the `public/` folder and wired automatically.

## Structure
- `index.html` – main page with sections: hero, products, about, contact, and a bottom nav.
- `styles.css` – refreshed design system (brand colors, buttons, cards, gallery, carousel).
- `script.js` – lightweight carousel + automatic wiring of images from `public/` and a simple gallery.
- `public/` – put your photos here (already contains the provided `IMG-*.jpg` files).

## Run
No build required. Easiest options:

- Right‑click `index.html` → “Open with Live Server” in VS Code, or
- Use the included script (requires internet for first run):

```powershell
npm run dev
```

This serves the site at http://127.0.0.1:5500.

## Customize
- Replace or add images in `public/`. Filenames are listed near the end of each page (window.__PUBLIC_IMAGES__). You can add more entries or remove some.
- Edit text labels (phone, email, address) directly in `index.html`.
- Colors are defined as CSS variables at the top of `styles.css`.
- Favicon/logo is `public/logogti_.jpg`. Swap this file to update everywhere.
 - To change auto-play speed, edit the `data-auto` attribute on any `.carousel` (ms). Motion-sensitive users are respected and autoplay pauses automatically when `prefers-reduced-motion` is on.

## Notes
- The carousel auto-plays and pauses on hover. Dots can be tapped to jump to a slide.
- Everything is responsive and optimized for mobile first, but also looks good on desktop.
