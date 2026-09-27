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
  /** IMAGE slots: the shape the site renders this at (width / height). */
  aspect?: number | null;
  /** IMAGE slots: longest edge the uploader shrinks to. */
  maxWidth?: number;
  /** TEXT slots: allow a longer, multi-line value. */
  multiline?: boolean;
}

/** Defaults when a slot does not say otherwise. */
export const DEFAULT_IMAGE_ASPECT = 16 / 9;
export const DEFAULT_IMAGE_MAX_WIDTH = 1920;

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
      { key: 'home.hero.slide1.image', label: 'Slide 1 image', type: 'IMAGE', defaultValue: '/pexels-jibarofoto-13908956.jpg', aspect: 16 / 9, maxWidth: 1920 },
      { key: 'home.hero.slide1.location', label: 'Slide 1 caption', type: 'TEXT', defaultValue: 'London.' },
      { key: 'home.hero.slide2.image', label: 'Slide 2 image', type: 'IMAGE', defaultValue: '/pexels-keira-burton-6147369.jpg', aspect: 16 / 9, maxWidth: 1920 },
      { key: 'home.hero.slide2.location', label: 'Slide 2 caption', type: 'TEXT', defaultValue: 'New Delhi.' },
      { key: 'home.hero.slide3.image', label: 'Slide 3 image', type: 'IMAGE', defaultValue: '/pexels-oacthecreator-10604068.jpg', aspect: 16 / 9, maxWidth: 1920 },
      { key: 'home.hero.slide3.location', label: 'Slide 3 caption', type: 'TEXT', defaultValue: 'Beijing.' },
      { key: 'home.hero.slide4.image', label: 'Slide 4 image', type: 'IMAGE', defaultValue: '/pexels-andy-barbour-6683894.jpg', aspect: 16 / 9, maxWidth: 1920 },
      { key: 'home.hero.slide4.location', label: 'Slide 4 caption', type: 'TEXT', defaultValue: 'Barcelona.' },
      { key: 'home.hero.slide5.image', label: 'Slide 5 image', type: 'IMAGE', defaultValue: '/pexels-rdne-7713173.jpg', aspect: 16 / 9, maxWidth: 1920 },
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
      { key: 'home.gallery.1.image', label: 'Tile 1 image (large)', type: 'IMAGE', defaultValue: '/pexels-oacthecreator-10604068.jpg', aspect: 4 / 3, maxWidth: 1400 },
      { key: 'home.gallery.1.title', label: 'Tile 1 title', type: 'TEXT', defaultValue: 'Nanjing, China' },
      { key: 'home.gallery.1.body', label: 'Tile 1 caption', type: 'TEXT', defaultValue: 'Full-ride CSC scholarships at top-10 unis.' },
      { key: 'home.gallery.2.image', label: 'Tile 2 image', type: 'IMAGE', defaultValue: '/pexels-jibarofoto-13908956.jpg', aspect: 4 / 3, maxWidth: 1400 },
      { key: 'home.gallery.2.title', label: 'Tile 2 title', type: 'TEXT', defaultValue: 'Coventry, UK' },
      { key: 'home.gallery.2.body', label: 'Tile 2 caption', type: 'TEXT', defaultValue: "3-year bachelor's. 45% scholarship." },
      { key: 'home.gallery.3.image', label: 'Tile 3 image', type: 'IMAGE', defaultValue: '/pexels-keira-burton-6147369.jpg', aspect: 4 / 3, maxWidth: 1400 },
      { key: 'home.gallery.3.title', label: 'Tile 3 title', type: 'TEXT', defaultValue: 'Vadodara, India' },
      { key: 'home.gallery.3.body', label: 'Tile 3 caption', type: 'TEXT', defaultValue: 'Engineering at 1/4 the Western cost.' },
      { key: 'home.gallery.4.image', label: 'Tile 4 image', type: 'IMAGE', defaultValue: '/pexels-rdne-7713173.jpg', aspect: 4 / 3, maxWidth: 1400 },
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
      { key: 'home.about.image', label: 'Section photo', type: 'IMAGE', defaultValue: '/pexels-domingos-henriques-3418942-17385732.jpg', aspect: 4 / 3, maxWidth: 1400 },
    ],
  },
  {
    id: 'about-page',
    page: 'About',
    title: 'About page photos',
    description: 'Photos used on /about — the founder portrait and the closing call-to-action image.',
    slots: [
      { key: 'about.founder.image', label: 'Founder portrait', type: 'IMAGE', defaultValue: '/pexels-rdne-7713173.jpg', aspect: 3 / 4, maxWidth: 1200 },
      { key: 'about.cta.image', label: 'Closing section photo', type: 'IMAGE', defaultValue: '/pexels-andy-barbour-6683894.jpg', aspect: 3 / 4, maxWidth: 1200 },
    ],
  },
  {
    id: 'awards-page',
    page: 'Awards',
    title: 'Awards gallery',
    description:
      'The award-night photos on /awards. Replace these after each new event — the first six tiles are editable here.',
    slots: [
      { key: 'awards.logo.image', label: 'Award logo', type: 'IMAGE', defaultValue: '/awardsimages/Acoya-Midsize-Logo.png', aspect: null, maxWidth: 800, hint: 'Logos keep their own shape - no cropping.' },
      { key: 'awards.gallery.1.image', label: 'Gallery photo 1', type: 'IMAGE', defaultValue: '/awardsimages/IMG_0316.JPG', aspect: 4 / 3, maxWidth: 1600 },
      { key: 'awards.gallery.2.image', label: 'Gallery photo 2', type: 'IMAGE', defaultValue: '/awardsimages/IMG_0317.JPG', aspect: 4 / 3, maxWidth: 1600 },
      { key: 'awards.gallery.3.image', label: 'Gallery photo 3', type: 'IMAGE', defaultValue: '/awardsimages/IMG_0322.JPG', aspect: 4 / 3, maxWidth: 1600 },
      { key: 'awards.gallery.4.image', label: 'Gallery photo 4', type: 'IMAGE', defaultValue: '/awardsimages/IMG_0323.JPG', aspect: 4 / 3, maxWidth: 1600 },
      { key: 'awards.gallery.5.image', label: 'Gallery photo 5', type: 'IMAGE', defaultValue: '/awardsimages/IMG_0324.JPG', aspect: 4 / 3, maxWidth: 1600 },
      { key: 'awards.gallery.6.image', label: 'Gallery photo 6', type: 'IMAGE', defaultValue: '/awardsimages/IMG_0325.JPG', aspect: 4 / 3, maxWidth: 1600 },
    ],
  },
  {
    id: 'countries-page',
    page: 'Countries',
    title: 'Country cards',
    description:
      'The photo and "cost from" figure on each country card. Update the costs when tuition changes so students never see stale prices.',
    slots: [
      { key: 'countries.india.image', label: 'India — photo', type: 'IMAGE', defaultValue: '/pexels-keira-burton-6147369.jpg', aspect: 3 / 2, maxWidth: 1400 },
      { key: 'countries.india.cost', label: 'India — cost from', type: 'TEXT', defaultValue: '$3,500/yr' },
      { key: 'countries.china.image', label: 'China — photo', type: 'IMAGE', defaultValue: '/pexels-oacthecreator-10604068.jpg', aspect: 3 / 2, maxWidth: 1400 },
      { key: 'countries.china.cost', label: 'China — cost from', type: 'TEXT', defaultValue: '$4,800/yr' },
      { key: 'countries.united-kingdom.image', label: 'United Kingdom — photo', type: 'IMAGE', defaultValue: '/pexels-jibarofoto-13908956.jpg', aspect: 3 / 2, maxWidth: 1400 },
      { key: 'countries.united-kingdom.cost', label: 'United Kingdom — cost from', type: 'TEXT', defaultValue: '$14,000/yr' },
      { key: 'countries.canada.image', label: 'Canada — photo', type: 'IMAGE', defaultValue: '/pexels-andy-barbour-6683894.jpg', aspect: 3 / 2, maxWidth: 1400 },
      { key: 'countries.canada.cost', label: 'Canada — cost from', type: 'TEXT', defaultValue: '$16,000/yr' },
      { key: 'countries.malaysia.image', label: 'Malaysia — photo', type: 'IMAGE', defaultValue: '/pexels-domingos-henriques-3418942-17385732.jpg', aspect: 3 / 2, maxWidth: 1400 },
      { key: 'countries.malaysia.cost', label: 'Malaysia — cost from', type: 'TEXT', defaultValue: '$5,500/yr' },
      { key: 'countries.germany.image', label: 'Germany — photo', type: 'IMAGE', defaultValue: '/pexels-domingos-henriques-3418942-17471233.jpg', aspect: 3 / 2, maxWidth: 1400 },
      { key: 'countries.germany.cost', label: 'Germany — cost from', type: 'TEXT', defaultValue: '$500/yr' },
      { key: 'countries.united-states.image', label: 'United States — photo', type: 'IMAGE', defaultValue: '/pexels-rdne-7713173.jpg', aspect: 3 / 2, maxWidth: 1400 },
      { key: 'countries.united-states.cost', label: 'United States — cost from', type: 'TEXT', defaultValue: '$22,000/yr' },
      { key: 'countries.australia.image', label: 'Australia — photo', type: 'IMAGE', defaultValue: '/pexels-gustavo-fring-8770974.jpg', aspect: 3 / 2, maxWidth: 1400 },
      { key: 'countries.australia.cost', label: 'Australia — cost from', type: 'TEXT', defaultValue: '$18,000/yr' },
    ],
  },
  {
    id: 'programs-page',
    page: 'Programs',
    title: 'Programme photos',
    description:
      'The photo shown on each programme listing. Prices and filters stay managed in the system, not here.',
    slots: [
      { key: 'programs.1.image', label: 'Parul University — B.Tech Mechanical', type: 'IMAGE', defaultValue: '/pexels-keira-burton-6147369.jpg', aspect: 3 / 2, maxWidth: 1400 },
      { key: 'programs.2.image', label: 'Nanjing University — BSc Computer Science', type: 'IMAGE', defaultValue: '/pexels-oacthecreator-10604068.jpg', aspect: 3 / 2, maxWidth: 1400 },
      { key: 'programs.3.image', label: 'Coventry University — BSc Civil Engineering', type: 'IMAGE', defaultValue: '/pexels-jibarofoto-13908956.jpg', aspect: 3 / 2, maxWidth: 1400 },
      { key: 'programs.4.image', label: 'Limkokwing University — BA UX Design', type: 'IMAGE', defaultValue: '/pexels-domingos-henriques-3418942-17385732.jpg', aspect: 3 / 2, maxWidth: 1400 },
      { key: 'programs.5.image', label: 'Sharda University — MBBS', type: 'IMAGE', defaultValue: '/pexels-gustavo-fring-8770974.jpg', aspect: 3 / 2, maxWidth: 1400 },
      { key: 'programs.6.image', label: 'Beijing Jiaotong — MEng Transport', type: 'IMAGE', defaultValue: '/pexels-andy-barbour-6683894.jpg', aspect: 3 / 2, maxWidth: 1400 },
      { key: 'programs.7.image', label: 'Trent University — BBA Business', type: 'IMAGE', defaultValue: '/pexels-rdne-7713173.jpg', aspect: 3 / 2, maxWidth: 1400 },
      { key: 'programs.8.image', label: 'TH Köln — MSc Renewable Energy', type: 'IMAGE', defaultValue: '/pexels-domingos-henriques-3418942-17471233.jpg', aspect: 3 / 2, maxWidth: 1400 },
    ],
  },
  {
    id: 'scholarships-page',
    page: 'Scholarships',
    title: 'Scholarship deadlines',
    description:
      'Application deadlines shown on /scholarships. Refresh these each intake — expired dates make the site look abandoned.',
    slots: [
      { key: 'scholarships.1.deadline', label: 'YPIT–Parul Partnership Award — deadline', type: 'TEXT', defaultValue: 'Rolling' },
      { key: 'scholarships.2.deadline', label: 'Chinese Government Scholarship (CSC) — deadline', type: 'TEXT', defaultValue: 'March 2027' },
      { key: 'scholarships.3.deadline', label: 'YPIT–Coventry International — deadline', type: 'TEXT', defaultValue: 'Rolling' },
      { key: 'scholarships.4.deadline', label: 'Confucius Institute Scholarship — deadline', type: 'TEXT', defaultValue: 'April 2027' },
      { key: 'scholarships.5.deadline', label: 'YPIT–London Met Award — deadline', type: 'TEXT', defaultValue: 'Rolling' },
      { key: 'scholarships.6.deadline', label: 'Chevening Scholarship — deadline', type: 'TEXT', defaultValue: 'Nov 2026' },
      { key: 'scholarships.7.deadline', label: 'Commonwealth Shared — deadline', type: 'TEXT', defaultValue: 'Dec 2026' },
      { key: 'scholarships.8.deadline', label: 'DAAD Scholarship — deadline', type: 'TEXT', defaultValue: 'Oct 2026' },
      { key: 'scholarships.9.deadline', label: 'Australia Awards — deadline', type: 'TEXT', defaultValue: 'April 2027' },
      { key: 'scholarships.10.deadline', label: 'YPIT–Limkokwing Award — deadline', type: 'TEXT', defaultValue: 'Rolling' },
    ],
  },
  {
    id: 'site-contact',
    page: 'Site-wide',
    title: 'Contact details',
    description: 'Shown in the top strip and the footer of every page, and behind the WhatsApp button.',
    slots: [
      { key: 'contact.address', label: 'Full address (footer)', type: 'TEXT', defaultValue: 'NIC Investment House, 4th Floor, Posta, Dar es Salaam' },
      { key: 'contact.addressShort', label: 'Short address (top strip)', type: 'TEXT', defaultValue: 'NIC Investment House, Dar es Salaam' },
      { key: 'contact.phone1', label: 'Phone 1', type: 'TEXT', defaultValue: '+255 769 227 898' },
      { key: 'contact.phone2', label: 'Phone 2', type: 'TEXT', defaultValue: '+255 759 512 804' },
      { key: 'contact.email', label: 'Email', type: 'TEXT', defaultValue: 'admissions@ypitconsultancies.com' },
      { key: 'contact.whatsapp', label: 'WhatsApp number', type: 'TEXT', defaultValue: '+255 769 227 898' },
    ],
  },
  {
    id: 'home-about-text',
    page: 'Home',
    title: 'About section wording',
    description: 'The "who we are" heading and paragraph on the homepage.',
    slots: [
      { key: 'home.about.heading1', label: 'Heading line 1', type: 'TEXT', defaultValue: "We're Tanzanians." },
      { key: 'home.about.heading2', label: 'Heading line 2', type: 'TEXT', defaultValue: "We've been where you are." },
      { key: 'home.about.body', label: 'Paragraph', type: 'TEXT', defaultValue: "YPIT Consultancies was started in 2021 by a Tanzanian engineering graduate who knew the system from the inside out. Five years later, we've sent over 1,050 students to 15 countries - and we're just getting started.", multiline: true },
    ],
  },
  {
    id: 'home-cta',
    page: 'Home',
    title: 'Closing call-to-action',
    description: 'The band at the bottom of the homepage.',
    slots: [
      { key: 'home.cta.eyebrow', label: 'Small label', type: 'TEXT', defaultValue: 'Your move' },
      { key: 'home.cta.title', label: 'Heading', type: 'TEXT', defaultValue: 'Your future is one application away.' },
      { key: 'home.cta.body', label: 'Sub-text', type: 'TEXT', defaultValue: 'Free consultation. No commitment. Admission letter in 24 hours.', multiline: true },
      { key: 'home.cta.primaryLabel', label: 'Main button', type: 'TEXT', defaultValue: 'Start my application →' },
      { key: 'home.cta.secondaryLabel', label: 'Second button', type: 'TEXT', defaultValue: 'Book a call' },
    ],
  },
  {
    id: 'testimonial-1',
    page: 'Testimonials',
    title: 'Story 1 — Neema Safari',
    description: 'Student story shown on the homepage and the booking page. Replace with a real student, their course and their photo.',
    slots: [
      { key: 'testimonials.1.photo', label: 'Photo', type: 'IMAGE', defaultValue: '/pexels-keira-burton-6147369.jpg', aspect: 1, maxWidth: 800 },
      { key: 'testimonials.1.name', label: 'Student name', type: 'TEXT', defaultValue: 'Neema Safari' },
      { key: 'testimonials.1.role', label: 'Course', type: 'TEXT', defaultValue: 'B.Eng Civil Engineering' },
      { key: 'testimonials.1.destination', label: 'University · country', type: 'TEXT', defaultValue: 'Nanjing University · China' },
      { key: 'testimonials.1.scholarship', label: 'Scholarship badge', type: 'TEXT', defaultValue: '70% scholarship' },
      { key: 'testimonials.1.quote', label: 'What they said', type: 'TEXT', defaultValue: 'My counselor at YPIT stayed up past midnight helping me rewrite my SOP three times. That kind of care doesn\'t exist anywhere else.', multiline: true },
    ],
  },
  {
    id: 'testimonial-2',
    page: 'Testimonials',
    title: 'Story 2 — Joseph Kimaro',
    description: 'Student story shown on the homepage and the booking page. Replace with a real student, their course and their photo.',
    slots: [
      { key: 'testimonials.2.photo', label: 'Photo', type: 'IMAGE', defaultValue: '/pexels-peter-chikubula-157991289-10744384.jpg', aspect: 1, maxWidth: 800 },
      { key: 'testimonials.2.name', label: 'Student name', type: 'TEXT', defaultValue: 'Joseph Kimaro' },
      { key: 'testimonials.2.role', label: 'Course', type: 'TEXT', defaultValue: 'BSc Mechanical Engineering' },
      { key: 'testimonials.2.destination', label: 'University · country', type: 'TEXT', defaultValue: 'Coventry University · UK' },
      { key: 'testimonials.2.scholarship', label: 'Scholarship badge', type: 'TEXT', defaultValue: '45% scholarship' },
      { key: 'testimonials.2.quote', label: 'What they said', type: 'TEXT', defaultValue: 'I thought studying abroad was for rich kids. YPIT walked me through the scholarship maze and now I\'m an engineering student in Coventry.', multiline: true },
    ],
  },
  {
    id: 'testimonial-3',
    page: 'Testimonials',
    title: 'Story 3 — Grace Wairo',
    description: 'Student story shown on the homepage and the booking page. Replace with a real student, their course and their photo.',
    slots: [
      { key: 'testimonials.3.photo', label: 'Photo', type: 'IMAGE', defaultValue: '/pexels-chris-wade-ntezicimpa-564856410-34787376.jpg', aspect: 1, maxWidth: 800 },
      { key: 'testimonials.3.name', label: 'Student name', type: 'TEXT', defaultValue: 'Grace Wairo' },
      { key: 'testimonials.3.role', label: 'Course', type: 'TEXT', defaultValue: 'BA UX Design' },
      { key: 'testimonials.3.destination', label: 'University · country', type: 'TEXT', defaultValue: 'Limkokwing University · Malaysia' },
      { key: 'testimonials.3.scholarship', label: 'Scholarship badge', type: 'TEXT', defaultValue: '40% scholarship' },
      { key: 'testimonials.3.quote', label: 'What they said', type: 'TEXT', defaultValue: 'Two other agents had taken my money and disappeared. YPIT did the work - visa to flight to dorm - and never asked for a shilling extra.', multiline: true },
    ],
  },
  {
    id: 'testimonial-4',
    page: 'Testimonials',
    title: 'Story 4 — Emmanuel Olomi',
    description: 'Student story shown on the homepage and the booking page. Replace with a real student, their course and their photo.',
    slots: [
      { key: 'testimonials.4.photo', label: 'Photo', type: 'IMAGE', defaultValue: '/pexels-jibarofoto-13908956.jpg', aspect: 1, maxWidth: 800 },
      { key: 'testimonials.4.name', label: 'Student name', type: 'TEXT', defaultValue: 'Emmanuel Olomi' },
      { key: 'testimonials.4.role', label: 'Course', type: 'TEXT', defaultValue: 'MBA · Global Business' },
      { key: 'testimonials.4.destination', label: 'University · country', type: 'TEXT', defaultValue: 'C3S Business School · France' },
      { key: 'testimonials.4.scholarship', label: 'Scholarship badge', type: 'TEXT', defaultValue: '30% scholarship' },
      { key: 'testimonials.4.quote', label: 'What they said', type: 'TEXT', defaultValue: '', multiline: true },
    ],
  },
  {
    id: 'testimonial-5',
    page: 'Testimonials',
    title: 'Story 5 — Faith Ndaro',
    description: 'Student story shown on the homepage and the booking page. Replace with a real student, their course and their photo.',
    slots: [
      { key: 'testimonials.5.photo', label: 'Photo', type: 'IMAGE', defaultValue: '/pexels-rdne-7713173.jpg', aspect: 1, maxWidth: 800 },
      { key: 'testimonials.5.name', label: 'Student name', type: 'TEXT', defaultValue: 'Faith Ndaro' },
      { key: 'testimonials.5.role', label: 'Course', type: 'TEXT', defaultValue: 'BSc Computer Science' },
      { key: 'testimonials.5.destination', label: 'University · country', type: 'TEXT', defaultValue: 'Trent University · Canada' },
      { key: 'testimonials.5.scholarship', label: 'Scholarship badge', type: 'TEXT', defaultValue: '25% scholarship' },
      { key: 'testimonials.5.quote', label: 'What they said', type: 'TEXT', defaultValue: 'My first visa application was rejected. YPIT helped me appeal, fixed the gaps, and got me approved on round two. Now I\'m in Canada.', multiline: true },
    ],
  },
];

export const ALL_CMS_SLOTS: CmsSlot[] = CMS_SECTIONS.flatMap((s) => s.slots);
