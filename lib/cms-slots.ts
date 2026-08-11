/**
 * The editable website slots, in the order IT sees them.
 *
 * `key` must match exactly what the website reads (see the website's
 * `lib/cms.ts` usage). `defaultValue` is what the site shows when a slot has
 * no override — shown in the admin UI so IT knows what they are replacing.
 */
export type CmsSlotType = 'IMAGE' | 'TEXT';

export interface CmsSlot {
  key: string;
  label: string;
  type: CmsSlotType;
  /** What the site falls back to when the slot is empty. */
  defaultValue: string;
  hint?: string;
}

export interface CmsSection {
  id: string;
  page: string;
  title: string;
  description: string;
  slots: CmsSlot[];
}

export const CMS_SECTIONS: CmsSection[] = [
  {
    id: 'home-hero',
    page: 'Home',
    title: 'Hero slideshow',
    description:
      'The five rotating background photos at the top of the homepage, and the city name shown on each.',
    slots: [
      { key: 'home.hero.slide1.image', label: 'Slide 1 image', type: 'IMAGE', defaultValue: '/pexels-jibarofoto-13908956.jpg' },
      { key: 'home.hero.slide1.location', label: 'Slide 1 caption', type: 'TEXT', defaultValue: 'London.' },
      { key: 'home.hero.slide2.image', label: 'Slide 2 image', type: 'IMAGE', defaultValue: '/pexels-keira-burton-6147369.jpg' },
      { key: 'home.hero.slide2.location', label: 'Slide 2 caption', type: 'TEXT', defaultValue: 'New Delhi.' },
      { key: 'home.hero.slide3.image', label: 'Slide 3 image', type: 'IMAGE', defaultValue: '/pexels-oacthecreator-10604068.jpg' },
      { key: 'home.hero.slide3.location', label: 'Slide 3 caption', type: 'TEXT', defaultValue: 'Beijing.' },
      { key: 'home.hero.slide4.image', label: 'Slide 4 image', type: 'IMAGE', defaultValue: '/pexels-andy-barbour-6683894.jpg' },
      { key: 'home.hero.slide4.location', label: 'Slide 4 caption', type: 'TEXT', defaultValue: 'Barcelona.' },
      { key: 'home.hero.slide5.image', label: 'Slide 5 image', type: 'IMAGE', defaultValue: '/pexels-rdne-7713173.jpg' },
      { key: 'home.hero.slide5.location', label: 'Slide 5 caption', type: 'TEXT', defaultValue: 'Dubai.' },
    ],
  },
  {
    id: 'home-stats',
    page: 'Home',
    title: 'Hero statistics',
    description: 'The four headline numbers under the hero. Keep them short.',
    slots: [
      { key: 'home.stats.1.value', label: 'Stat 1 number', type: 'TEXT', defaultValue: '1,050+' },
      { key: 'home.stats.1.label', label: 'Stat 1 caption', type: 'TEXT', defaultValue: 'Placements since 2021' },
      { key: 'home.stats.2.value', label: 'Stat 2 number', type: 'TEXT', defaultValue: '98%' },
      { key: 'home.stats.2.label', label: 'Stat 2 caption', type: 'TEXT', defaultValue: 'Visa success rate' },
      { key: 'home.stats.3.value', label: 'Stat 3 number', type: 'TEXT', defaultValue: '24h' },
      { key: 'home.stats.3.label', label: 'Stat 3 caption', type: 'TEXT', defaultValue: 'Avg. admission turnaround' },
      { key: 'home.stats.4.value', label: 'Stat 4 number', type: 'TEXT', defaultValue: '15' },
      { key: 'home.stats.4.label', label: 'Stat 4 caption', type: 'TEXT', defaultValue: 'Countries · 50+ unis' },
    ],
  },
  {
    id: 'home-gallery',
    page: 'Home',
    title: 'Destination gallery',
    description:
      'The photo tiles showcasing study destinations. Each tile has a photo, a title and a one-line caption.',
    slots: [
      { key: 'home.gallery.1.image', label: 'Tile 1 image (large)', type: 'IMAGE', defaultValue: '/pexels-oacthecreator-10604068.jpg' },
      { key: 'home.gallery.1.title', label: 'Tile 1 title', type: 'TEXT', defaultValue: 'Nanjing, China' },
      { key: 'home.gallery.1.body', label: 'Tile 1 caption', type: 'TEXT', defaultValue: 'Full-ride CSC scholarships at top-10 unis.' },
      { key: 'home.gallery.2.image', label: 'Tile 2 image', type: 'IMAGE', defaultValue: '/pexels-jibarofoto-13908956.jpg' },
      { key: 'home.gallery.2.title', label: 'Tile 2 title', type: 'TEXT', defaultValue: 'Coventry, UK' },
      { key: 'home.gallery.2.body', label: 'Tile 2 caption', type: 'TEXT', defaultValue: "3-year bachelor's. 45% scholarship." },
      { key: 'home.gallery.3.image', label: 'Tile 3 image', type: 'IMAGE', defaultValue: '/pexels-keira-burton-6147369.jpg' },
      { key: 'home.gallery.3.title', label: 'Tile 3 title', type: 'TEXT', defaultValue: 'Vadodara, India' },
      { key: 'home.gallery.3.body', label: 'Tile 3 caption', type: 'TEXT', defaultValue: 'Engineering at 1/4 the Western cost.' },
      { key: 'home.gallery.4.image', label: 'Tile 4 image', type: 'IMAGE', defaultValue: '/pexels-rdne-7713173.jpg' },
      { key: 'home.gallery.4.title', label: 'Tile 4 title', type: 'TEXT', defaultValue: 'Dubai, UAE' },
      { key: 'home.gallery.4.body', label: 'Tile 4 caption', type: 'TEXT', defaultValue: 'Global campuses, 4-hour flight home.' },
    ],
  },
  {
    id: 'home-about',
    page: 'Home',
    title: 'About section',
    description: 'The "who we are" block on the homepage.',
    slots: [
      { key: 'home.about.image', label: 'Section photo', type: 'IMAGE', defaultValue: '/pexels-domingos-henriques-3418942-17385732.jpg' },
    ],
  },
  {
    id: 'about-page',
    page: 'About',
    title: 'About page photos',
    description: 'Photos used on /about — the founder portrait and the closing call-to-action image.',
    slots: [
      { key: 'about.founder.image', label: 'Founder portrait', type: 'IMAGE', defaultValue: '/pexels-rdne-7713173.jpg' },
      { key: 'about.cta.image', label: 'Closing section photo', type: 'IMAGE', defaultValue: '/pexels-andy-barbour-6683894.jpg' },
    ],
  },
  {
    id: 'awards-page',
    page: 'Awards',
    title: 'Awards gallery',
    description:
      'The award-night photos on /awards. Replace these after each new event — the first six tiles are editable here.',
    slots: [
      { key: 'awards.logo.image', label: 'Award logo', type: 'IMAGE', defaultValue: '/awardsimages/Acoya-Midsize-Logo.png' },
      { key: 'awards.gallery.1.image', label: 'Gallery photo 1', type: 'IMAGE', defaultValue: '/awardsimages/IMG_0316.JPG' },
      { key: 'awards.gallery.2.image', label: 'Gallery photo 2', type: 'IMAGE', defaultValue: '/awardsimages/IMG_0317.JPG' },
      { key: 'awards.gallery.3.image', label: 'Gallery photo 3', type: 'IMAGE', defaultValue: '/awardsimages/IMG_0322.JPG' },
      { key: 'awards.gallery.4.image', label: 'Gallery photo 4', type: 'IMAGE', defaultValue: '/awardsimages/IMG_0323.JPG' },
      { key: 'awards.gallery.5.image', label: 'Gallery photo 5', type: 'IMAGE', defaultValue: '/awardsimages/IMG_0324.JPG' },
      { key: 'awards.gallery.6.image', label: 'Gallery photo 6', type: 'IMAGE', defaultValue: '/awardsimages/IMG_0325.JPG' },
    ],
  },
];

export const ALL_CMS_SLOTS: CmsSlot[] = CMS_SECTIONS.flatMap((s) => s.slots);
