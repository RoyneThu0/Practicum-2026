# Practicum Photography

A single-page photography portfolio built with plain HTML5 and CSS3. No frameworks, no build step, no dependencies.

## Project structure

```
Practicum-2026/
├── README.md
└── Photography Portfolio/
    └── src/
        ├── index.html   page content and structure
        ├── style.css    all styles
        └── images/      your own photos (empty for now)
```

## Running it

Open `Photography Portfolio/src/index.html` in a browser. That's it.

## Features

- **Photo gallery grid** built with CSS Grid: 1 column on phones, 2 on tablets, 4 on desktop.
- **Mixed tile sizes**: single, tall, wide and a 2×2 feature tile. The spans add up to 16 cells, so the grid fills 2 and 4 columns with no gaps.
- **`object-fit: cover`** on every photo, so images of any shape fill their tile and crop instead of stretching.
- **Responsive images**: each photo is requested at the size and crop its tile needs, with `srcset` so phones download smaller files.
- **Flexbox** for the header, nav, hero, about section, form rows and footer.
- **Book-a-shoot form** in place of a shop button.
- **Semantic HTML**: `header`, `nav`, `main`, labelled `section`s, `footer`, one `h1`, a skip link and working anchor links.
- **Colors as CSS variables**, with an automatic dark mode that follows the visitor's system setting.
- `box-sizing: border-box` globally, and no horizontal scrolling on phone, tablet or desktop.

## Photos

The gallery currently loads its photos from [Unsplash](https://unsplash.com) by URL, used under the Unsplash License.

To use your own photos instead:

1. Put the files in `Photography Portfolio/src/images/`.
2. In `index.html`, set each `<img>`'s `src` to the file, for example `src="images/my-photo.jpg"`.
3. Delete that image's `srcset` and `sizes` attributes, and update its `alt` text and caption.

Any shape of photo works; `object-fit: cover` crops it to fit the tile. To change which part stays in view, add `class="focus-low"` or `class="focus-high"` to the `<img>`.

## Booking form

The form posts to [Formspree](https://formspree.io). Create a free form there and replace `YOUR_FORM_ID` in the form's `action` in `index.html`. Until then, the form tells visitors it isn't connected yet and nothing is sent.

## Customising

- **Colors**: edit the variables in the `:root` block at the top of `style.css` (dark-mode values are in the two blocks below it).
- **Fonts**: change the Google Fonts `<link>` in `index.html` and the `--font-*` variables in `style.css`.
- **Text**: edit `index.html` directly. Keep exactly one `<h1>`.
