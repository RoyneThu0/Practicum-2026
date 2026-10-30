# Practicum Photography

A single-page landscape photography portfolio. Assignment 1 was plain HTML and CSS; Assignment 2 rebuilt it with Vite, React and Tailwind CSS v4. Assignment 3 adds a real backend: an Express API, a Neon Postgres database, signup and login with Better Auth, and deployment to Render (API) and Vercel (site). On top of that there's an admin panel at `/admin` for managing the gallery photos and the booking requests. Assignment 4 adds payments: book a shoot and pay with Stripe Checkout in a popup on the page (test mode), confirmed by a webhook and saved as orders. Plain JavaScript throughout, no TypeScript.

## Live

- Site: https://practicum-2026.vercel.app
- API: https://practicum-photography-api.onrender.com/api/photos
- Admin panel: https://practicum-2026.vercel.app/admin (admin accounts only)

## How it fits together

```
browser ──► Vercel (the React site, built by Vite)
              │  /api/*  is forwarded by client/vercel.json
              ▼
            Render (Express API, server/)
              │  pg connection pool
              ▼
            Neon (Postgres: photos, bookings, orders, blocked dates, shortlists, and Better Auth's user/session tables)

            Stripe ── webhook (POST /api/stripe/webhook) ──► Render
```

The browser only ever talks to the Vercel address. Vercel passes any `/api/...` request on to the Express server on Render, so the API and the site share one origin. That keeps the login cookie a normal first-party cookie and means no CORS setup is needed. In development Vite does the same job with its `server.proxy` setting.

## Running it locally

You need Node.js 22+ and a Postgres database (a free Neon project, or Postgres on your machine).

**1. Server** (terminal 1)

```sh
cd server
cp .env.example .env        # then fill in DATABASE_URL and BETTER_AUTH_SECRET
npm install
npm run db:setup            # creates the tables and seeds the 8 photos (only into an empty table)
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
| `ADMIN_EMAILS` | comma-separated emails that get the admin panel, e.g. `you@example.com` |
| `STRIPE_SECRET_KEY` | Stripe **test** secret key, `sk_test_…` (live keys are refused) |
| `STRIPE_PUBLISHABLE_KEY` | Stripe **test** publishable key, `pk_test_…`; sent to the browser to show the payment popup |
| `STRIPE_WEBHOOK_SECRET` | the webhook's signing secret, `whsec_…` |
| `STRIPE_CURRENCY` | currency for slot prices, default `usd` |
| `PORT` | port for Express (Render sets this itself) |

To check nothing secret is tracked: `git ls-files | grep .env` should print only `server/.env.example`.

## Database schema

The tables are created by the SQL files in `server/src/db/migrations/`, run in order by `npm run db:migrate`.

- **`photos`** — one row per photo in the gallery: title, alt text, category (plains, mountains or water), tile shape, the Unsplash image id, the photographer's name and link, and a `sort_order` for the gallery order. `server/src/db/seed.js` fills it from the Week 2 data in `seed-data.js`, but only when the table is empty. After that, photos are managed in the admin panel, and redeploying never overwrites those edits or brings back deleted photos.
- **`user`** — one row per person who signed up: name and email (unique).
- **`account`** — how each user logs in. For email and password there's one row per user holding the **hashed** password, never the real one.
- **`session`** — one row per signed-in browser. The browser's cookie holds the session token; Better Auth looks it up here to know who is making a request, and checks it hasn't expired (sessions last 30 days).
- **`verification`** — short-lived codes for things like password resets. Required by Better Auth, unused for now.
- **`bookings`** — one row per request sent from the Book a shoot form: name, email, shoot type, preferred date, message, status (`new`, `contacted`, `booked` or `declined`) and private admin notes. The shortlist is stored twice: `photo_ids`, and `shortlist_titles` as a snapshot, so a booking still names the photos even if one is later renamed or deleted. `user_id` links it to the sender's account when they were signed in.
- **`blocked_dates`** — one row per day the studio isn't available, with an optional private note. The booking form and `POST /api/bookings` refuse these days.
- **`shoot_slots`** — what can be bought: one row per time of day (sunrise, morning, midday, afternoon, sunset) with its price in cents. Sunrise and sunset are marked `premium` and cost more. Prices are edited in the admin panel's Payments tab.
- **`orders`** — one row per purchase. Every order has a `user_id` (only signed-in users can check out), the booking it pays for, the total in cents and currency, the Stripe Checkout Session id, and a `status`: `pending` when created, `paid` (with `paid_at`) once the webhook confirms the payment, `cancelled` if the payment popup was closed, or `expired` if the checkout timed out.
- **`order_items`** — what each order bought: the slot, a description such as "Sunset shoot, Sat 12 Dec 2026", and the unit price **at the time of purchase**, so changing a price later doesn't rewrite old orders.
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
| `GET /api/me` | anyone | `{ user, isAdmin }`; `user` is `null` when signed out |
| `POST /api/bookings` | anyone | send a booking request `{ name, email, shootType, preferredDate?, message, photoIds }`; past and blocked dates are refused |
| `GET /api/slots` | anyone | `{ currency, slots, payments }`: the time slots, their prices, and `payments: { enabled, testMode, publishableKey }` |
| `POST /api/checkout` | signed in | booking fields + `slotId`: saves the booking, a pending order and its item, starts an embedded Stripe Checkout Session, answers `{ orderId, clientSecret }` |
| `POST /api/checkout/:orderId/cancel` | signed in (owner) | the popup was closed: expires the Stripe session and marks the pending order `cancelled` |
| `POST /api/stripe/webhook` | Stripe | signed by Stripe; marks orders paid (`checkout.session.completed`) or expired |
| `GET /api/orders/:id` | signed in | one of your orders with its items (404 for anyone else's) |
| `GET /api/orders` | signed in | your orders, newest first |
| `GET /api/availability` | anyone | `{ blockedDates: ["2026-12-12", …] }`, upcoming days only, no notes |
| `GET /api/admin/photos` | admin | every photo with its `slug`, `sortOrder`, `shortlistCount` and `bookingCount` |
| `POST /api/admin/photos` | admin | add a photo at the end of the gallery |
| `PATCH /api/admin/photos/:id` | admin | edit a photo |
| `POST /api/admin/photos/:id/move` | admin | `{ direction: "up" \| "down" }` swaps it with its neighbour |
| `DELETE /api/admin/photos/:id` | admin | delete a photo (its shortlist rows go too) |
| `GET /api/admin/bookings?status=new` | admin | bookings, newest first; `status` is optional |
| `PATCH /api/admin/bookings/:id` | admin | `{ status?, adminNotes? }` |
| `DELETE /api/admin/bookings/:id` | admin | delete a booking |
| `GET /api/admin/blocked-dates` | admin | upcoming blocked days with their notes |
| `POST /api/admin/blocked-dates` | admin | `{ from, to?, note? }` blocks one day or a range (up to 366 days) |
| `DELETE /api/admin/blocked-dates/:day` | admin | unblock a day |
| `GET /api/admin/payments/orders` | admin | every order with the customer's name and email |
| `PATCH /api/admin/payments/slots/:id` | admin | `{ priceCents }` changes a slot's price |

The `/api/auth/*` routes are handled by Better Auth (`server/src/auth.js`, mounted in `server/src/index.js`). The shortlist routes go through `server/src/middleware/requireAuth.js`, which asks Better Auth for the session behind the request's cookie and answers `401` if there isn't one. The `/api/admin/*` routes go through `requireAdmin.js`, which does the same and then answers `403` unless the user's email is in `ADMIN_EMAILS`.

Form routes validate their input on the server (`server/src/lib/validatePhoto.js` and `validateBooking.js`). A bad request gets `400` with `{ error, errors: { field: message } }`, and the forms show each message under its field.

## Authentication

1. **Sign up / sign in.** `AuthDialog.jsx` posts the form to Better Auth through `client/src/lib/auth.js`. Better Auth hashes the password (scrypt), creates the `user`, `account` and `session` rows, and replies with a `Set-Cookie` header.
2. **The cookie.** It's `httpOnly`, so page JavaScript can't read it, and `Secure` in production. The browser sends it back with every `/api` request automatically.
3. **Surviving a refresh.** When the page loads, `App.jsx` calls `GET /api/auth/get-session`. The cookie comes with it, Better Auth finds the session in the database, and returns the user. `Header` then swaps the **Sign in** button at the far right for a profile menu ("Hi, name"), whose dropdown shows your name, email and **Sign out**. The brand and nav links stay on the left.
4. **Sign out.** `POST /api/auth/sign-out` deletes the session row and clears the cookie.

## Payments (Stripe Checkout, test mode)

The money is fake, but the flow is real: a real Checkout Session, a real signed webhook and a real order in Postgres.

1. **Pick a slot.** The booking form shows each time of day with its price from `GET /api/slots`. Sunrise and sunset are marked "Golden hour" and cost more.
2. **Book & pay.** You must be signed in. If you aren't, the sign-in dialog opens and everything typed stays in the form. `client/src/components/BookingForm.jsx` posts the form to `POST /api/checkout`.
3. **The checkout route** (`server/src/routes/checkout.js`) runs behind `requireAuth`. It validates the form, looks the slot's price up in `shoot_slots` (any price the browser sends is ignored), and in one transaction saves the booking, an `orders` row (`pending`) and an `order_items` row. Then it asks Stripe for a Checkout Session for exactly that amount, with the order id in `metadata` and `ui_mode: "embedded_page"`, and sends back the session's `clientSecret`.
4. **The payment popup** (`client/src/components/CheckoutDialog.jsx`) loads Stripe.js with the publishable key and mounts Stripe's embedded checkout inside a `<dialog>`. Card details go into Stripe's iframe, never to our server. The popup shows the test card (`4242 4242 4242 4242`, any future date, any CVC) with a copy button. Closing it calls `POST /api/checkout/:orderId/cancel`, which expires the session so it can't be paid later.
5. **The webhook** (`server/src/routes/stripeWebhook.js`) is the only code that marks an order paid. It's mounted with `express.raw()` before `express.json()` so it can verify Stripe's signature on the exact bytes. On `checkout.session.completed` with `payment_status: "paid"` it sets the order to `paid` and the booking to `booked`, but only if the session id and amount match what was created and the order isn't already paid, so repeated deliveries do nothing. `checkout.session.expired` marks an unpaid order `expired`.
6. **After paying**, Stripe sends the page to its `return_url`, `/checkout/success?order=12`. That page only reads `GET /api/orders/12`. If the webhook hasn't arrived yet the order is still `pending`, so the page checks again every 1.5 seconds, up to 10 times, then offers **Check again**. Opening that address without paying shows the order as pending; it never marks anything paid.

**Request a date without paying** still sends a free enquiry through `POST /api/bookings`.

### Stripe setup

**Locally**, with the [Stripe CLI](https://docs.stripe.com/stripe-cli):

1. Sign up at stripe.com, make sure **Test mode** is on, and copy both keys (Developers → API keys) into `server/.env` as `STRIPE_SECRET_KEY=sk_test_…` and `STRIPE_PUBLISHABLE_KEY=pk_test_…`.
2. Forward webhooks to your local server:
   ```sh
   stripe login
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   It prints a `whsec_…` signing secret. Put it in `server/.env` as `STRIPE_WEBHOOK_SECRET`, then restart `npm run dev`.
3. Book & pay on http://localhost:5173 with the test card. The `stripe listen` terminal shows the event and the order turns `paid`.

**In production:**

1. In the Render dashboard → Environment → **Environment Variables** (not Secret Files), add `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` (the `sk_test_…` and `pk_test_…` keys) and, after step 2, `STRIPE_WEBHOOK_SECRET`.
2. In Stripe (Test mode) → Developers → Webhooks → **Add endpoint**: URL `https://practicum-photography-api.onrender.com/api/stripe/webhook`, events `checkout.session.completed`, `checkout.session.async_payment_succeeded` and `checkout.session.expired`. Copy its signing secret into Render as `STRIPE_WEBHOOK_SECRET`. The endpoint points straight at Render rather than through Vercel, so nothing sits between Stripe and the signature check.
3. After payment Stripe sends customers to `BETTER_AUTH_URL` (the Vercel site) + `/checkout/success`.

Without both keys, **Book & pay** is turned off with a note that online payment isn't set up and the free request still works. For offline testing, `STRIPE_API_HOST`, `STRIPE_API_PORT` and `STRIPE_API_PROTOCOL` can point the SDK at [stripe-mock](https://github.com/stripe/stripe-mock).

## Admin panel

Go to `/admin`, or choose **Admin panel** in the profile menu, which only appears for admins.

**Who is an admin.** Anyone who signs in with an email listed in the server's `ADMIN_EMAILS` setting. To make yourself one, sign up on the site with your email, then add that email to `ADMIN_EMAILS` (in `server/.env` locally, or in the Render dashboard) and restart. The list lives on the server, so nobody can make themselves an admin from the website. Hiding the link from other people is only for tidiness: every `/api/admin` request is checked on the server.

**Bookings tab.** Every request from the Book a shoot form, newest first, filtered by status with a count on each filter. Each booking shows the sender's details, message and shortlisted photos. Changing the status dropdown saves straight away; private notes have their own Save button. The tab shows how many bookings are new.

**Calendar (Availability tab).** A month calendar shows every booking request as a dot on its preferred date, coloured by status (new, contacted, booked, declined), with up to three dots and "+n" for more. Blocked days are shaded and struck through, and today has a ring. Pick a day to see its requests and **Block this day** or **Unblock this day**; ← and → change month, and the arrow keys move between days. Bookings and blocked dates are loaded once in `AdminPage.jsx` and shared by all three tabs, so a status changed on the Bookings tab shows on the calendar straight away.

**Availability tab.** Block a single day, or a range with From and To, with an optional private note such as "Booked: Laikipia lodge". Upcoming blocked days are listed with an **Unblock** button. On the Bookings tab, a booking with a future preferred date has a **Block this date** button, so a confirmed shoot can close that day in one click. "Today" always means today in Nairobi, on the server and in the browser.

**Payments tab.** Every order, newest first, with the customer, what they bought, the amount and its status (filter by paid, pending, expired or cancelled), plus the total received. Next to it, **Slot prices**: change what each time of day costs. Booking cards on the Bookings tab also show the slot and whether the booking was paid.

**Photos tab.** The gallery photos in order. Use ↑ and ↓ to reorder them, **Edit** to change one, **Delete** (with a Yes/Cancel check) to remove one, and **Add a photo** for a new one. In the Unsplash field you can paste either the `photo-…` id or the whole `images.unsplash.com` address, and the form shows a preview. Changes appear on the public site the next time it loads.

**Most shortlisted.** At the top of the Photos tab, the five photos people like most, and on every row two counts: ★ how many signed-in visitors have saved it in their shortlist, and how many booking requests included it. Guests' stars only live in their browser, so they're counted once the guest signs in or sends a booking.

**Spam.** The booking form has a hidden "website" field that people never see. Bots that fill in every field get a normal-looking reply, but nothing is saved.

## Deploying

**API on Render.** `render.yaml` describes the service: root directory `server`, build `npm ci && npm run db:setup` (so every deploy creates any new tables; photos are only seeded into an empty table), start `npm start`, health check `/api/health`. In the Render dashboard, set `DATABASE_URL` to the Neon connection string, `BETTER_AUTH_URL` to the Vercel URL and `ADMIN_EMAILS` to your admin email(s); Render generates `BETTER_AUTH_SECRET` itself. Every push to `main` redeploys.

**Site on Vercel.** Import the repo with root directory `client` (Vercel detects Vite). `client/vercel.json` rewrites `/api/*` to the Render URL, and `/admin` to `index.html` so the admin panel loads when you open that address directly. No environment variables are needed on Vercel. Every push to `main` redeploys.

The free Render plan sleeps after about 15 minutes without traffic, so the first request after a pause can take up to a minute. Open the site a minute or two before showing it.

## Project structure

```
Practicum-2026/
├── README.md
├── render.yaml                 Render deploy settings for the API
├── server/                     Express API
│   ├── .env.example            which secrets the server needs (real .env is git-ignored)
│   └── src/
│       ├── index.js            Express app: auth, photos, shortlist, bookings and admin routes
│       ├── auth.js             Better Auth setup (email + password, 30-day sessions)
│       ├── middleware/requireAuth.js   401 unless signed in; sets req.user
│       ├── middleware/requireAdmin.js  403 unless the user is in ADMIN_EMAILS
│       ├── lib/admins.js       reads ADMIN_EMAILS; isAdmin(user)
│       ├── lib/options.js      allowed categories, shapes, shoot types, statuses
│       ├── lib/dates.js        "today" in Nairobi; YYYY-MM-DD check
│       ├── lib/stripe.js       Stripe client from env; refuses live keys
│       ├── lib/bookingRecords.js     date check, slot lookup, saving a booking
│       ├── lib/validatePhoto.js / validateBooking.js   server-side form checks
│       ├── routes/photos.js    GET /api/photos
│       ├── routes/shortlist.js the signed-in user's shortlist
│       ├── routes/me.js        GET /api/me (user + isAdmin)
│       ├── routes/bookings.js  POST /api/bookings (free enquiry)
│       ├── routes/checkout.js  POST /api/checkout: order + embedded Stripe Checkout Session; cancel route
│       ├── routes/stripeWebhook.js   POST /api/stripe/webhook: the only thing that marks orders paid
│       ├── routes/orders.js    GET /api/orders and /api/orders/:id
│       ├── routes/slots.js     GET /api/slots
│       ├── routes/admin/payments.js  all orders; edit slot prices
│       ├── routes/availability.js    GET /api/availability
│       ├── routes/admin/photos.js    add, edit, reorder, delete photos
│       ├── routes/admin/bookings.js  list, update, delete bookings
│       ├── routes/admin/blockedDates.js   block and unblock days
│       └── db/
│           ├── pool.js         one shared pg connection pool
│           ├── migrate.js      runs migrations/*.sql in order
│           ├── migrations/     001_photos … 005_blocked_dates, 006_orders
│           ├── seed.js         loads seed-data.js into an empty photos table
│           └── seed-data.js    the Week 2 photo data
└── client/                     React site
    ├── index.html              page shell: fonts, favicon, the #root div
    ├── vite.config.js          React + Tailwind plugins, /api proxy for development
    ├── vercel.json             forwards /api/* to the Render server; serves /admin and /checkout/*
    ├── public/
    │   ├── favicon.svg
    │   └── images/             your own photos
    └── src/
        ├── main.jsx            mounts <App /> into #root
        ├── App.jsx             loads photos and the session; holds shortlist and user state; / or /admin
        ├── index.css           Tailwind import, @theme tokens, dark mode
        ├── data/categories.js  the filter buttons
        ├── data/photoOptions.js     categories and tile shapes for the admin photo form
        ├── data/bookingOptions.js   shoot types and booking statuses
        ├── lib/api.js          fetch helper for /api calls
        ├── lib/auth.js         sign up / in / out, get-session and getMe (isAdmin)
        ├── lib/unsplash.js     builds src / srcSet / sizes for each photo
        ├── lib/shareLink.js    reads and builds ?shortlist=1,5,8 links
        ├── lib/dates.js        today in Nairobi; formats YYYY-MM-DD dates
        ├── lib/money.js        45000 + "usd" -> "$450"
        └── components/
            ├── Container.jsx        shared centred max-width wrapper
            ├── Header.jsx           brand, nav, shortlist count, Sign in
            ├── ProfileMenu.jsx      signed-in user: avatar, "Hi, name", dropdown with Admin panel (admins) and Sign out
            ├── AuthDialog.jsx       sign-in / create-account popup
            ├── Hero.jsx             the h1 and intro
            ├── Gallery.jsx          filter state + the photo grid
            ├── FilterBar.jsx        the category buttons
            ├── PhotoTile.jsx        one photo in the grid
            ├── ShortlistToggle.jsx  the reusable shortlist button
            ├── About.jsx
            ├── BookingForm.jsx      Book & pay, or request a date for free
            ├── CheckoutDialog.jsx   the payment popup: Stripe's embedded checkout
            ├── SlotPicker.jsx       time-of-day choice with prices
            ├── CheckoutResult.jsx   /checkout/success and /cancelled: reads the order, re-checks while pending
            ├── FormField.jsx        label + control pair used by the forms
            ├── Eyebrow.jsx          small section label
            ├── Footer.jsx
            └── admin/
                ├── AdminPage.jsx       /admin: loads bookings + blocked dates; Bookings, Availability and Photos tabs
                ├── AdminBookings.jsx   status filter + list of bookings
                ├── AdminPayments.jsx   orders + slot prices
                ├── AdminCalendar.jsx   month calendar: booking dots, blocked days, day panel
                ├── AdminAvailability.jsx   block / unblock days
                ├── statusStyles.js     status colours shared by cards and calendar
                ├── BookingCard.jsx     one booking: details, status, private notes, Block this date, delete
                ├── AdminPhotos.jsx     most shortlisted + ordered photo list: move, edit, delete, add
                ├── PhotoEditor.jsx     add / edit form with a live preview
                └── ConfirmButton.jsx   Delete → "Yes, delete / Cancel"
```

- **`client/src/lib/unsplash.js`** turns a photo's `unsplashId` and `shape` into a `src`, a `srcSet` and a `sizes` attribute, so each tile downloads an image cropped to its own shape and phones get smaller files.
- **`client/src/index.css`** holds the design tokens in Tailwind's `@theme` block (`--color-paper`, `--color-ink`, `--color-accent`, the three fonts, …). Each one becomes utilities such as `bg-paper`, `text-ink` and `font-display`. Dark mode follows the visitor's system setting.

## State: the category filter and the shortlist

**Category filter (`useState` in `Gallery.jsx`).** The only thing stored is the chosen category: `const [activeCategory, setActiveCategory] = useState("all")`. The list of visible photos is not stored; it is worked out from `photos` and `activeCategory` on every render, so it can never get out of step with the buttons. `FilterBar` draws one button per category with `aria-pressed` on the active one and reports clicks through an `onChange` prop. Above the grid, "Showing n of total" counts the visible photos.

The photos themselves come from the API: `App.jsx` fetches `/api/photos` once in a `useEffect` when the page loads and passes the array to `Gallery`, which shows "Loading photos…" until it arrives and an error message if the API can't be reached.

**Shortlist (`ShortlistToggle.jsx`, a controlled component).** `ShortlistToggle` takes three props, `value`, `onChange` and `label`, and owns no state. It shows whatever `value` it is given, and when clicked it calls `onChange(!value)`; the parent decides and passes the new value back. Every `PhotoTile` renders one, as a sibling of the tile's link rather than inside it (a button inside an `<a>` is invalid HTML).

The shortlist itself, an array of photo ids, lives in `App.jsx`, not in `Gallery` or the tiles. That way it:

- survives filtering, because hiding a tile doesn't throw away its state;
- reaches `Header`, which shows "Shortlist (n)";
- reaches `BookingForm`, which lists the shortlisted titles, sends their ids with the request and has a Clear shortlist button.

When you're signed in, every star and unstar is also sent to `/api/shortlist`, so the shortlist is saved in the `shortlists` table and comes back after a refresh or on another device. Anything you starred before signing in is saved when you sign in. Signed out, it works as before but only for that visit.

### Sharing a shortlist

In the booking form, **Copy share link** copies an address like `https://practicum-2026.vercel.app/?shortlist=1,5,8#work`. Whoever opens it sees those photos starred, the gallery opens on a **★ Shortlisted** filter, and a note explains that the shortlist was shared with them. They can add their own picks and send it with a booking. If they're signed in, the shared photos are added to their saved shortlist.

`client/src/lib/shareLink.js` reads the ids from the address once when the page loads, then removes `?shortlist=` from the address bar, so a refresh doesn't re-add them. Ids that don't match a photo are ignored. If the browser won't allow copying, the link is shown in a box to copy by hand.

The **★ Shortlisted** filter also appears whenever you've starred something yourself.

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

The form sends requests to `POST /api/bookings`, which saves them in the `bookings` table; you read and manage them in the admin panel's Bookings tab. If you're signed in, your name and email are filled in for you and the booking is linked to your account. The ids of your shortlisted photos go with the request, and the server looks up their titles itself rather than trusting the browser. On success the form clears and says the request is in. If something is wrong, each problem is shown under its field.

The date picker starts at today (Nairobi time), lists the next few unavailable days under it, and warns straight away if you pick a blocked day. The server checks again, so a blocked or past date is refused even if the browser check is skipped.
