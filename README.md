# Practicum Photography

A single-page landscape photography portfolio. Assignment 1 was plain HTML and CSS; Assignment 2 rebuilds the same site with Vite, React and Tailwind CSS v4. Plain JavaScript, no other libraries, and all content is hardcoded in the source.

## Running it

You need Node.js 20.19+ or 22.12+ (what Vite 8 requires).

```sh
cd "Photography Portfolio"
npm install
npm run dev
```

Then open the address Vite prints (usually http://localhost:5173).

- `npm run build` builds the production site into `Photography Portfolio/dist/`.
- `npm run preview` serves that build locally.
- `npm run lint` checks the code with oxlint.

## Project structure

```
Practicum-2026/
├── README.md
└── Photography Portfolio/
    ├── index.html            page shell: fonts, favicon, the #root div
    ├── vite.config.js        React + Tailwind plugins
    ├── public/
    │   ├── favicon.svg
    │   └── images/           your own photos
    └── src/
        ├── main.jsx          mounts <App /> into #root
        ├── App.jsx           assembles the page and holds the shortlist state
        ├── index.css         Tailwind import, @theme tokens, dark mode
        ├── data/photos.js    every gallery photo, plus the filter categories
        ├── lib/unsplash.js   builds src / srcSet / sizes for each photo
        └── components/
            ├── Container.jsx        shared centred max-width wrapper
            ├── Header.jsx           brand, nav, shortlist count
            ├── Hero.jsx             the h1 and intro
            ├── Gallery.jsx          filter state + the photo grid
            ├── FilterBar.jsx        the category buttons
            ├── PhotoTile.jsx        one photo in the grid
            ├── ShortlistToggle.jsx  the reusable shortlist button
            ├── About.jsx
            ├── BookingForm.jsx
            ├── FormField.jsx        label + control pair used by the form
            ├── Eyebrow.jsx          small section label
            └── Footer.jsx
```

- **`src/data/photos.js`** is the single array of photo objects (id, title, category, alt, shape, unsplashId, credit, link). The gallery maps over it, so adding a photo means adding an object, not copying markup. The `categories` array for the filter buttons is exported from the same file.
- **`src/lib/unsplash.js`** turns a photo's `unsplashId` and `shape` into a `src`, a `srcSet` and a `sizes` attribute, so each tile downloads an image cropped to its own shape and phones get smaller files.
- **`src/index.css`** holds the design tokens in Tailwind's `@theme` block (`--color-paper`, `--color-ink`, `--color-accent`, the three fonts, …). Each one becomes utilities such as `bg-paper`, `text-ink` and `font-display`. Dark mode follows the visitor's system setting: a `prefers-color-scheme: dark` block swaps the token values and every utility follows.

## Photos

The gallery loads its photos from [Unsplash](https://unsplash.com) by URL, used under the Unsplash License. Each tile's caption credits the photographer and links to the original.

To use your own photos instead, put the files in `Photography Portfolio/public/images/`. Anything in `public/` is served from the site root, so `public/images/dune.jpg` is referenced as `/images/dune.jpg`. Right now `imageFor()` in `src/lib/unsplash.js` always builds Unsplash URLs, so give the photo object a path (for example `src: "/images/dune.jpg"`) and have `imageFor()` return that path when it is set. Any shape of photo works: `object-cover` crops it to fit the tile.

## Booking form

The form posts to [Formspree](https://formspree.io). Create a free form there and replace `YOUR_FORM_ID` in `FORM_ACTION` at the top of `src/components/BookingForm.jsx`. Until then, submitting shows a message that the form isn't connected yet and nothing is sent. Shortlisted photo titles are sent with the request in a hidden field.
