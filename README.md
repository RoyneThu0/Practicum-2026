# Practicum Photography

A single-page landscape photography portfolio. Assignment 1 was plain HTML and CSS; Assignment 2 rebuilt it with Vite, React and Tailwind CSS v4. Assignment 3 adds a real backend: an Express API, a Neon Postgres database, signup and login with Better Auth, and deployment to Render (API) and Vercel (site). Plain JavaScript throughout, no TypeScript.

## Live

- Site: https://practicum-2026.vercel.app
- API: https://practicum-photography-api.onrender.com/api/photos

## How it fits together

```
browser ──► Vercel (the React site, built by Vite)
              │  /api/*  is forwarded by client/vercel.json
              ▼
            Render (Express API, server/)
              │  pg connection pool
              ▼
            Neon (Postgres: photos, shortlists, and Better Auth's user/session tables)
```

The browser only ever talks to the Vercel address. Vercel passes any `/api/...` request on to the Express server on Render, so the API and the site share one origin. That keeps the login cookie a normal first-party cookie and means no CORS setup is needed. In development Vite does the same job with its `server.proxy` setting.

## Running it locally

You need Node.js 22+ and a Postgres database (a free Neon project, or Postgres on your machine).

**1. Server** (terminal 1)

```sh
cd server
cp .env.example .env        # then fill in DATABASE_URL and BETTER_AUTH_SECRET
npm install
npm run db:setup            # creates the tables and seeds the 8 photos
npm run dev                 # http://localhost:3000
```

**2. Client** (terminal 2)

```sh
cd client
npm install
npm run dev                 # open http://localhost:5173
```

- `npm run build` (client) builds the production site into `client/dist/`.
- `npm run lint` (client) checks the code with oxlint.
- `npm run db:migrate` / `npm run db:seed` (server) run just one half of `db:setup`. Both are safe to run again.

## Secrets and `.env`

Real secrets live only in `server/.env` on your machine and in the Render dashboard. `.gitignore` excludes `.env` and `.env.*` (except `.env.example`), so they never reach git. `server/.env.example` is committed and lists the variables with placeholder values:

| Variable | What it is |
| --- | --- |
| `DATABASE_URL` | Neon connection string (ends in `?sslmode=require`) |
| `BETTER_AUTH_SECRET` | long random string that signs the session cookie |
| `BETTER_AUTH_URL` | the public address of the site: `http://localhost:5173` locally, the Vercel URL in production |
| `PORT` | port for Express (Render sets this itself) |

To check nothing secret is tracked: `git ls-files | grep .env` should print only `server/.env.example`.

## Database schema

The tables are created by the SQL files in `server/src/db/migrations/`, run in order by `npm run db:migrate`.

- **`photos`** — one row per photo in the gallery: title, alt text, category (plains, mountains or water), tile shape, the Unsplash image id, the photographer's name and link, and a `sort_order` for the gallery order. `server/src/db/seed.js` fills it from the Week 2 data in `seed-data.js`; it matches rows on `slug`, so seeding twice updates instead of duplicating.
- **`user`** — one row per person who signed up: name and email (unique).
- **`account`** — how each user logs in. For email and password there's one row per user holding the **hashed** password, never the real one.
- **`session`** — one row per signed-in browser. The browser's cookie holds the session token; Better Auth looks it up here to know who is making a request, and checks it hasn't expired (sessions last 30 days).
- **`verification`** — short-lived codes for things like password resets. Required by Better Auth, unused for now.
- **`shortlists`** — which photos each user has starred. One row per (user, photo) pair, which is also the primary key, so a photo can't be starred twice. Deleting a user or photo deletes their rows (`ON DELETE CASCADE`).

`user`, `account`, `session` and `verification` belong to Better Auth: it reads and writes them itself, and our code never queries them directly. Their exact columns are what Better Auth 1.7 expects (`002_auth.sql`).

## API

| Method and path | Who | What it does |
| --- | --- | --- |
| `GET /api/health` | anyone | `{ "ok": true }`, used by Render's health check |
| `GET /api/photos` | anyone | every photo in gallery order, as JSON |
| `POST /api/auth/sign-up/email` | anyone | create an account `{ name, email, password }` and sign in |
| `POST /api/auth/sign-in/email` | anyone | sign in `{ email, password }` |
| `POST /api/auth/sign-out` | signed in | end the session |
| `GET /api/auth/get-session` | anyone | the signed-in user, or `null` |
| `GET /api/shortlist` | signed in | your shortlisted photo ids, e.g. `[1, 4]` |
| `PUT /api/shortlist/:photoId` | signed in | add a photo |
| `DELETE /api/shortlist/:photoId` | signed in | remove a photo |
| `DELETE /api/shortlist` | signed in | clear your shortlist |

The `/api/auth/*` routes are handled by Better Auth (`server/src/auth.js`, mounted in `server/src/index.js`). The shortlist routes go through `server/src/middleware/requireAuth.js`, which asks Better Auth for the session behind the request's cookie and answers `401` if there isn't one.

## Authentication

1. **Sign up / sign in.** `AuthDialog.jsx` posts the form to Better Auth through `client/src/lib/auth.js`. Better Auth hashes the password (scrypt), creates the `user`, `account` and `session` rows, and replies with a `Set-Cookie` header.
2. **The cookie.** It's `httpOnly`, so page JavaScript can't read it, and `Secure` in production. The browser sends it back with every `/api` request automatically.
3. **Surviving a refresh.** When the page loads, `App.jsx` calls `GET /api/auth/get-session`. The cookie comes with it, Better Auth finds the session in the database, and returns the user. `Header` then swaps the **Sign in** button at the far right for a profile menu ("Hi, name"), whose dropdown shows your name, email and **Sign out**. The brand and nav links stay on the left.
4. **Sign out.** `POST /api/auth/sign-out` deletes the session row and clears the cookie.

## Deploying

**API on Render.** `render.yaml` describes the service: root directory `server`, build `npm ci && npm run db:setup` (so every deploy creates any new tables and re-seeds the photos), start `npm start`, health check `/api/health`. In the Render dashboard, set `DATABASE_URL` to the Neon connection string and `BETTER_AUTH_URL` to the Vercel URL; Render generates `BETTER_AUTH_SECRET` itself. Every push to `main` redeploys.

**Site on Vercel.** Import the repo with root directory `client` (Vercel detects Vite). `client/vercel.json` rewrites `/api/*` to the Render URL. No environment variables are needed on Vercel. Every push to `main` redeploys.

The free Render plan sleeps after about 15 minutes without traffic, so the first request after a pause can take up to a minute. Open the site a minute or two before showing it.

## Project structure

```
Practicum-2026/
├── README.md
├── render.yaml                 Render deploy settings for the API
├── server/                     Express API
│   ├── .env.example            which secrets the server needs (real .env is git-ignored)
│   └── src/
│       ├── index.js            Express app: auth routes, /api/photos, /api/shortlist
│       ├── auth.js             Better Auth setup (email + password, 30-day sessions)
│       ├── middleware/requireAuth.js   401 unless signed in; sets req.user
│       ├── routes/photos.js    GET /api/photos
│       ├── routes/shortlist.js the signed-in user's shortlist
│       └── db/
│           ├── pool.js         one shared pg connection pool
│           ├── migrate.js      runs migrations/*.sql in order
│           ├── migrations/     001_photos, 002_auth, 003_shortlists
│           ├── seed.js         loads seed-data.js into the photos table
│           └── seed-data.js    the Week 2 photo data
└── client/                     React site
    ├── index.html              page shell: fonts, favicon, the #root div
    ├── vite.config.js          React + Tailwind plugins, /api proxy for development
    ├── vercel.json             forwards /api/* to the Render server
    ├── public/
    │   ├── favicon.svg
    │   └── images/             your own photos
    └── src/
        ├── main.jsx            mounts <App /> into #root
        ├── App.jsx             loads photos and the session; holds shortlist and user state
        ├── index.css           Tailwind import, @theme tokens, dark mode
        ├── data/categories.js  the filter buttons
        ├── lib/api.js          fetch helper for /api calls
        ├── lib/auth.js         sign up / in / out and get-session
        ├── lib/unsplash.js     builds src / srcSet / sizes for each photo
        └── components/
            ├── Container.jsx        shared centred max-width wrapper
            ├── Header.jsx           brand, nav, shortlist count, Sign in
            ├── ProfileMenu.jsx      signed-in user: avatar, "Hi, name", dropdown with Sign out
            ├── AuthDialog.jsx       sign-in / create-account popup
            ├── Hero.jsx             the h1 and intro
            ├── Gallery.jsx          filter state + the photo grid
            ├── FilterBar.jsx        the category buttons
            ├── PhotoTile.jsx        one photo in the grid
            ├── ShortlistToggle.jsx  the reusable shortlist button
            ├── About.jsx
            ├── BookingForm.jsx
            ├── FormField.jsx        label + control pair used by the forms
            ├── Eyebrow.jsx          small section label
            └── Footer.jsx
```

- **`client/src/lib/unsplash.js`** turns a photo's `unsplashId` and `shape` into a `src`, a `srcSet` and a `sizes` attribute, so each tile downloads an image cropped to its own shape and phones get smaller files.
- **`client/src/index.css`** holds the design tokens in Tailwind's `@theme` block (`--color-paper`, `--color-ink`, `--color-accent`, the three fonts, …). Each one becomes utilities such as `bg-paper`, `text-ink` and `font-display`. Dark mode follows the visitor's system setting.

## State: the category filter and the shortlist

**Category filter (`useState` in `Gallery.jsx`).** The only thing stored is the chosen category: `const [activeCategory, setActiveCategory] = useState("all")`. The list of visible photos is not stored; it is worked out from `photos` and `activeCategory` on every render, so it can never get out of step with the buttons. `FilterBar` draws one button per category with `aria-pressed` on the active one and reports clicks through an `onChange` prop. Above the grid, "Showing n of 8" counts the visible photos.

The photos themselves come from the API: `App.jsx` fetches `/api/photos` once in a `useEffect` when the page loads and passes the array to `Gallery`, which shows "Loading photos…" until it arrives and an error message if the API can't be reached.

**Shortlist (`ShortlistToggle.jsx`, a controlled component).** `ShortlistToggle` takes three props, `value`, `onChange` and `label`, and owns no state. It shows whatever `value` it is given, and when clicked it calls `onChange(!value)`; the parent decides and passes the new value back. Every `PhotoTile` renders one, as a sibling of the tile's link rather than inside it (a button inside an `<a>` is invalid HTML).

The shortlist itself, an array of photo ids, lives in `App.jsx`, not in `Gallery` or the tiles. That way it:

- survives filtering, because hiding a tile doesn't throw away its state;
- reaches `Header`, which shows "Shortlist (n)";
- reaches `BookingForm`, which lists the shortlisted titles, sends them with the request and has a Clear shortlist button.

When you're signed in, every star and unstar is also sent to `/api/shortlist`, so the shortlist is saved in the `shortlists` table and comes back after a refresh or on another device. Anything you starred before signing in is saved when you sign in. Signed out, it works as before but only for that visit.

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

To use your own photos instead, put the files in `client/public/images/`. Anything in `public/` is served from the site root, so `public/images/dune.jpg` is referenced as `/images/dune.jpg`. Right now `imageFor()` in `src/lib/unsplash.js` always builds Unsplash URLs, so add a column for it to the photos table and the seed data (for example `src: "/images/dune.jpg"`) and have `imageFor()` return that path when it is set. Any shape of photo works: `object-cover` crops it to fit the tile.

## Booking form

The form posts to [Formspree](https://formspree.io). Create a free form there and replace `YOUR_FORM_ID` in `FORM_ACTION` at the top of `src/components/BookingForm.jsx`. Until then, submitting shows a message that the form isn't connected yet and nothing is sent. Shortlisted photo titles are sent with the request in a hidden field.
