// Every photo in the gallery lives here, as one array of objects.
// The Gallery maps over this array, so adding a photo means adding an object, not copying JSX.
//
// shape: how many grid cells the tile takes
//   "single"  1 x 1
//   "tall"    1 column x 2 rows
//   "wide"    2 columns x 1 row
//   "feature" 2 x 2
// category: which filter button shows the photo (one of the ids in `categories` below)
// unsplashId: the photo-… id from images.unsplash.com, used to build src and srcset.

const photos = [
  {
    id: 1,
    title: "Savanna at sunset",
    category: "plains",
    alt: "Sunset over a dry, grassy savanna",
    shape: "feature",
    unsplashId: "photo-1761078206756-68d3023f3021",
    credit: "Nadine Marfurt",
    link: "https://unsplash.com/photos/sunset-over-a-dry-grassy-savanna-landscape-iIaFFBI1erY",
  },
  {
    id: 2,
    title: "Misty highlands",
    category: "mountains",
    alt: "Misty mountains covered in lush green forest",
    shape: "tall",
    unsplashId: "photo-1767601047773-cebe39332fc5",
    credit: "Jacob Padilla",
    link: "https://unsplash.com/photos/misty-mountains-covered-in-lush-green-forest-yBMOAzMpgyM",
  },
  {
    id: 3,
    title: "Under the stars",
    category: "water",
    alt: "A lone tree by the water under a starry night sky",
    shape: "tall",
    unsplashId: "photo-1502318217862-aa4e294ba657",
    credit: "Nate Rayfield",
    link: "https://unsplash.com/photos/green-leafed-tree-on-body-of-water-under-starry-sky-_WR6tUIAJe8",
  },
  {
    id: 4,
    title: "Dune",
    category: "plains",
    alt: "A large sand dune in the middle of a desert",
    shape: "tall",
    unsplashId: "photo-1708748513828-2227f6d39c04",
    credit: "Tim Arterbury",
    link: "https://unsplash.com/photos/a-large-sand-dune-in-the-middle-of-a-desert-hoT_2bL5LxU",
  },
  {
    id: 5,
    title: "Pond at dusk",
    category: "water",
    alt: "A lake reflecting lights on forested hills at dusk",
    shape: "wide",
    unsplashId: "photo-1763138625837-41d6c58c5272",
    credit: "Zuska Stozicka",
    link: "https://unsplash.com/photos/lake-reflecting-lights-on-forested-hills-at-dusk-KTidalTqaEI",
  },
  {
    id: 6,
    title: "Calm sea",
    category: "water",
    alt: "Sunset over a calm sea",
    shape: "single",
    unsplashId: "photo-1743369925757-a92e6d092688",
    credit: "BehindTheTmuna",
    link: "https://unsplash.com/photos/sunset-over-the-calm-sea-rds4H3nIM8s",
  },
  {
    id: 7,
    title: "Before the storm",
    category: "plains",
    alt: "Brown grass field under heavy grey clouds",
    shape: "wide",
    unsplashId: "photo-1620193552832-9d354f0a44f8",
    credit: "Igor Kyryliuk & Tetiana Kravchenko",
    link: "https://unsplash.com/photos/brown-grass-field-under-gray-clouds-b6DAMF9vZcA",
  },
  {
    id: 8,
    title: "Mt Kenya from Lamuria",
    category: "mountains",
    alt: "A wide open field with Mount Kenya in the background",
    shape: "single",
    unsplashId: "photo-1740344109789-2287538ab274",
    credit: "Tourite Safaris",
    link: "https://unsplash.com/photos/a-large-open-field-with-a-mountain-in-the-background-FU574rGFCoI",
  },
];

// The gallery's filter buttons, in order. "all" is not a real category; it means "no filter".
export const categories = [
  { id: "all", label: "All" },
  { id: "plains", label: "Plains & dunes" },
  { id: "mountains", label: "Mountains" },
  { id: "water", label: "Water" },
];

export default photos;
