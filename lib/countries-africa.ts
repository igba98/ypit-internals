/**
 * African countries for recruitment tracking (system updates 2.2). Stored as
 * the display name on Student/Lead.countryOfOrigin so reports group cleanly.
 */
export const AFRICAN_COUNTRIES = [
  'Tanzania', 'Kenya', 'Uganda', 'Rwanda', 'Burundi', 'South Sudan', 'Ethiopia',
  'Somalia', 'Djibouti', 'Eritrea', 'Sudan', 'Egypt', 'Libya', 'Tunisia',
  'Algeria', 'Morocco', 'Mauritania', 'Mali', 'Niger', 'Chad', 'Senegal',
  'Gambia', 'Guinea-Bissau', 'Guinea', 'Sierra Leone', 'Liberia', "Côte d'Ivoire",
  'Ghana', 'Togo', 'Benin', 'Nigeria', 'Cameroon', 'Central African Republic',
  'Equatorial Guinea', 'Gabon', 'Republic of the Congo', 'DR Congo', 'Angola',
  'Zambia', 'Malawi', 'Mozambique', 'Zimbabwe', 'Botswana', 'Namibia',
  'South Africa', 'Lesotho', 'Eswatini', 'Madagascar', 'Comoros', 'Mauritius',
  'Seychelles', 'Cape Verde', 'São Tomé and Príncipe', 'Burkina Faso',
] as const;

/** Home market first, the rest alphabetical. */
export const AFRICAN_COUNTRIES_SORTED: string[] = [
  'Tanzania',
  ...[...AFRICAN_COUNTRIES].filter((c) => c !== 'Tanzania').sort((a, b) => a.localeCompare(b)),
];
