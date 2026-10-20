# Practicum Photography

A single-page landscape photography portfolio. Assignment 1 was plain HTML and CSS; Assignment 2 rebuilds the same site with Vite, React and Tailwind CSS v4. Plain JavaScript, no other libraries, and all content is hardcoded in the source.

## Running it

You need Node.js 20.19+ or 22.12+ (what Vite 8 requires).

```sh
cd client
npm install
npm run dev
```

Then open the address Vite prints (usually http://localhost:5173).

- `npm run build` builds the production site into `client/dist/`.
- `npm run preview` serves that build locally.
- `npm run lint` checks the code with oxlint.

## Project structure

```
Practicum-2026/
├── README.md
└── client/
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

## State: the category filter and the shortlist

**Category filter (`useState` in `Gallery.jsx`).** The only thing stored is the chosen category: `const [activeCategory, setActiveCategory] = useState("all")`. The list of visible photos is not stored; it is worked out from `photos` and `activeCategory` on every render, so it can never get out of step with the buttons. `FilterBar` draws one button per category with `aria-pressed` on the active one and reports clicks through an `onChange` prop. Above the grid, "Showing n of 8" counts the visible photos.

**Shortlist (`ShortlistToggle.jsx`, a controlled component).** `ShortlistToggle` takes three props, `value`, `onChange` and `label`, and owns no state. It shows whatever `value` it is given, and when clicked it calls `onChange(!value)`; the parent decides and passes the new value back. Every `PhotoTile` renders one, as a sibling of the tile's link rather than inside it (a button inside an `<a>` is invalid HTML).

The shortlist itself, an array of photo ids, lives in `App.jsx`, not in `Gallery` or the tiles. That way it:

- survives filtering, because hiding a tile doesn't throw away its state;
- reaches `Header`, which shows "Shortlist (n)";
- reaches `BookingForm`, which lists the shortlisted titles, sends them with the request and has a Clear shortlist button.

## Responsive layout (mobile-first)

Every component is written for a phone first. Unprefixed Tailwind classes are the phone layout, and `sm:` (40rem / 640px), `md:` (48rem / 768px) and `lg:` (64rem / 1024px) classes are added on top as the screen gets wider. There are no `max-*:` variants, so nothing has to be undone for small screens.

| Width | What changes |
| --- | --- |
| phone (default) | one column everywhere; form fields stacked; `px-4` gutters |
| `sm:` 640px+ | gallery goes to 2 columns and wide/feature tiles span 2; form fields pair up side by side; bigger headings and spacing; `px-6` gutters |
| `md:` 768px+ | About photo sits beside the text |
| `lg:` 1024px+ | gallery goes to 4 columns; hero heading and intro side by side; booking text and form side by side; `px-10` gutters |

The gallery grid is `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`, with `grid-flow-dense` so smaller tiles fill the gaps. The `sizes` attribute built in `src/lib/unsplash.js` matches these breakpoints, so the browser picks the right image width.

Column spans start at `sm:` on purpose (`wide` is `sm:col-span-2`, `feature` is `row-span-2 sm:col-span-2`). On a phone the grid has one column, and a `col-span-2` there would make the grid add a second column wider than the screen, so the page would scroll sideways. Row spans are fine at every width.

The page was checked at 320, 375, 414, 640, 768, 1024, 1280 and 1440px wide, after clicking every filter and toggling the shortlist: no horizontal scroll at any width.

## Photos

The gallery loads its photos from [Unsplash](https://unsplash.com) by URL, used under the Unsplash License. Each tile's caption credits the photographer and links to the original.

To use your own photos instead, put the files in `client/public/images/`. Anything in `public/` is served from the site root, so `public/images/dune.jpg` is referenced as `/images/dune.jpg`. Right now `imageFor()` in `src/lib/unsplash.js` always builds Unsplash URLs, so give the photo object a path (for example `src: "/images/dune.jpg"`) and have `imageFor()` return that path when it is set. Any shape of photo works: `object-cover` crops it to fit the tile.

## Booking form

The form posts to [Formspree](https://formspree.io). Create a free form there and replace `YOUR_FORM_ID` in `FORM_ACTION` at the top of `src/components/BookingForm.jsx`. Until then, submitting shows a message that the form isn't connected yet and nothing is sent. Shortlisted photo titles are sent with the request in a hidden field.
