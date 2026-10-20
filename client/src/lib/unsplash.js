// Builds src / srcSet / sizes for a photo so each tile downloads an image
// cropped to its own shape, and phones get smaller files.

const shapes = {
  single: { ratio: 1, widths: [400, 800, 1400], base: 800, desktop: "20rem" },
  tall: { ratio: 2, widths: [400, 800, 1400], base: 800, desktop: "20rem" },
  wide: { ratio: 0.5, widths: [800, 1600, 2800], base: 1600, desktop: "40rem" },
  feature: { ratio: 1, widths: [400, 800, 1400], base: 800, desktop: "40rem" },
};

function url(unsplashId, width, height) {
  return `https://images.unsplash.com/${unsplashId}?auto=format&fit=crop&w=${width}&h=${height}&q=75`;
}

export function imageFor(photo) {
  const shape = shapes[photo.shape];
  const height = (w) => Math.round(w * shape.ratio);

  return {
    src: url(photo.unsplashId, shape.base, height(shape.base)),
    srcSet: shape.widths
      .map((w) => `${url(photo.unsplashId, w, height(w))} ${w}w`)
      .join(", "),
    sizes: `(min-width: 64rem) ${shape.desktop}, (min-width: 40rem) 50vw, 100vw`,
    width: shape.base,
    height: height(shape.base),
  };
}
