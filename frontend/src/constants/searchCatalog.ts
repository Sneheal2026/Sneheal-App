import type { ImageSourcePropType } from 'react-native';

export interface SearchSuggestion {
  id: string;
  /** Matched against the product catalogue, which stays in English. */
  query: string;
  labelKey: string;
}

export interface SearchCategory extends SearchSuggestion {
  image: ImageSourcePropType;
  tint: string;
}

const CATEGORY_IMAGES = {
  vitamins: require('../../assets/images/Vitamins-Minerals.png'),
  painRelief: require('../../assets/images/Pain-Relief.png'),
  skinCare: require('../../assets/images/Skin-Care.png'),
  hairCare: require('../../assets/images/Hair-Care.png'),
  oralCare: require('../../assets/images/Oral-Care.png'),
  ayurveda: require('../../assets/images/Ayurveda.png'),
  feverCold: require('../../assets/images/Fever-Cold.png'),
  nutrition: require('../../assets/images/Nutrition-Drinks.png'),
} as const;

export const TRENDING_SEARCHES: SearchSuggestion[] = [
  { id: 'paracetamol', query: 'Paracetamol', labelKey: 'search.termParacetamol' },
  { id: 'vitamin-c', query: 'Vitamin', labelKey: 'search.termVitaminC' },
  { id: 'pain-relief', query: 'Pain', labelKey: 'search.termPainRelief' },
  { id: 'multivitamin', query: 'Multivitamin', labelKey: 'search.termMultivitamin' },
  { id: 'cough-syrup', query: 'Cough', labelKey: 'search.termCoughSyrup' },
  { id: 'immunity', query: 'Immunity', labelKey: 'search.termImmunity' },
];

export const SEARCH_CATEGORIES: SearchCategory[] = [
  {
    id: 'vitamins',
    query: 'Vitamin',
    labelKey: 'search.catVitamins',
    image: CATEGORY_IMAGES.vitamins,
    tint: '#E8F1FE',
  },
  {
    id: 'pain-relief',
    query: 'Pain',
    labelKey: 'search.catPainRelief',
    image: CATEGORY_IMAGES.painRelief,
    tint: '#FFEBEB',
  },
  {
    id: 'skin-care',
    query: 'Skin',
    labelKey: 'search.catSkinCare',
    image: CATEGORY_IMAGES.skinCare,
    tint: '#FFF1E6',
  },
  {
    id: 'hair-care',
    query: 'Hair',
    labelKey: 'search.catHairCare',
    image: CATEGORY_IMAGES.hairCare,
    tint: '#F2EAFE',
  },
  {
    id: 'oral-care',
    query: 'Oral',
    labelKey: 'search.catOralCare',
    image: CATEGORY_IMAGES.oralCare,
    tint: '#E6F7FB',
  },
  {
    id: 'ayurveda',
    query: 'Ayurvedic',
    labelKey: 'search.catAyurveda',
    image: CATEGORY_IMAGES.ayurveda,
    tint: '#E8F7EC',
  },
  {
    id: 'fever-cold',
    query: 'Fever',
    labelKey: 'search.catFeverCold',
    image: CATEGORY_IMAGES.feverCold,
    tint: '#FFF6E0',
  },
  {
    id: 'nutrition',
    query: 'Immune',
    labelKey: 'search.catNutrition',
    image: CATEGORY_IMAGES.nutrition,
    tint: '#FDEAF3',
  },
];
