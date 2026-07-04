import { ImageSourcePropType } from 'react-native';

export interface Medicine {
  id: string;
  name: string;
  manufacturer: string;
  image: ImageSourcePropType;
  price: number;
  originalPrice?: number;
  unit: string;
  rating: number;
  reviews: number;
  uses: string[];
  description: string;
  highlights: { icon: string; label: string }[];
}

const MEDICINE_IMAGES = {
  vitaminsMinerals: require('../../assets/images/Vitamins-Minerals.png'),
  nutritionDrinks: require('../../assets/images/Nutrition-Drinks.png'),
  feverCold: require('../../assets/images/Fever-Cold.png'),
  painRelief: require('../../assets/images/Pain-Relief.png'),
  ayurveda: require('../../assets/images/Ayurveda.png'),
  fitness: require('../../assets/images/Fitness.png'),
  oralCare: require('../../assets/images/Oral-Care.png'),
  hairCare: require('../../assets/images/Hair-Care.png'),
} as const;

const DEFAULT_HIGHLIGHTS = [
  { icon: 'shield-checkmark-outline', label: '100% Genuine' },
  { icon: 'flash-outline', label: 'Fast Delivery' },
  { icon: 'sync-outline', label: 'Easy Returns' },
];

export const MEDICINES: Medicine[] = [
  {
    id: '1',
    name: 'Daily Multivitamin Capsules',
    manufacturer: 'Sneheal Medtech Pvt. Ltd.',
    image: MEDICINE_IMAGES.vitaminsMinerals,
    price: 12.49,
    originalPrice: 16.65,
    unit: '60 capsules',
    rating: 4.6,
    reviews: 1284,
    uses: [
      'Fills daily nutritional gaps',
      'Supports energy and immunity',
      'Promotes healthy skin and hair',
    ],
    description:
      'A complete blend of essential vitamins and minerals to support your everyday health. Helps maintain energy levels, strengthens immunity and keeps you active through the day.',
    highlights: DEFAULT_HIGHLIGHTS,
  },
  {
    id: '2',
    name: 'Pediacare Super Immune Plus',
    manufacturer: 'NutriCare Labs',
    image: MEDICINE_IMAGES.nutritionDrinks,
    price: 15.99,
    originalPrice: 18.15,
    unit: '400 ml',
    rating: 4.5,
    reviews: 842,
    uses: [
      'Boosts childhood immunity',
      'Supports healthy growth',
      'Rich in DHA and protein',
    ],
    description:
      'A nutritious health drink designed for growing children. Packed with protein, DHA and 24 vital nutrients to support immunity, brain development and overall growth.',
    highlights: DEFAULT_HIGHLIGHTS,
  },
  {
    id: '3',
    name: 'Fever & Cold Relief Syrup',
    manufacturer: 'MediCure Pharma',
    image: MEDICINE_IMAGES.feverCold,
    price: 6.99,
    unit: '100 ml',
    rating: 4.3,
    reviews: 510,
    uses: [
      'Relieves fever and body ache',
      'Eases cold and congestion',
      'Soothes sore throat',
    ],
    description:
      'Fast-acting relief from the common cold, fever and mild body pain. Gentle formula suitable for the whole family to help you recover comfortably.',
    highlights: DEFAULT_HIGHLIGHTS,
  },
  {
    id: '4',
    name: 'Pain Relief Tablets',
    manufacturer: 'MediCure Pharma',
    image: MEDICINE_IMAGES.painRelief,
    price: 4.99,
    originalPrice: 6.99,
    unit: '10 tablets',
    rating: 4.7,
    reviews: 2043,
    uses: [
      'Relieves headache and migraine',
      'Reduces muscle and joint pain',
      'Brings down fever',
    ],
    description:
      'Effective and quick relief from everyday aches and pains. Trusted formula for headaches, body pain and fever with gentle action on the stomach.',
    highlights: DEFAULT_HIGHLIGHTS,
  },
  {
    id: '5',
    name: 'Ayurvedic Immunity Booster',
    manufacturer: 'Vedic Roots Ayurveda',
    image: MEDICINE_IMAGES.ayurveda,
    price: 22.99,
    unit: '90 tablets',
    rating: 4.4,
    reviews: 673,
    uses: [
      'Strengthens natural immunity',
      'Improves stamina and vitality',
      'Made with pure herbal extracts',
    ],
    description:
      'A time-tested Ayurvedic formulation crafted from potent herbs like Ashwagandha, Giloy and Tulsi. Builds resilience naturally and keeps you energised.',
    highlights: DEFAULT_HIGHLIGHTS,
  },
  {
    id: '6',
    name: 'Dietary Supplement Health Products',
    manufacturer: 'FitLife Nutrition',
    image: MEDICINE_IMAGES.fitness,
    price: 18.99,
    unit: '500 g',
    rating: 4.2,
    reviews: 389,
    uses: [
      'Supports muscle recovery',
      'Aids balanced nutrition',
      'Fuels active lifestyles',
    ],
    description:
      'A premium dietary supplement to complement your fitness journey. Provides quality protein and nutrients to support recovery, strength and daily wellbeing.',
    highlights: DEFAULT_HIGHLIGHTS,
  },
  {
    id: '7',
    name: 'Oral Care Essentials',
    manufacturer: 'DentaFresh',
    image: MEDICINE_IMAGES.oralCare,
    price: 9.99,
    originalPrice: 14.99,
    unit: 'Combo pack',
    rating: 4.5,
    reviews: 921,
    uses: [
      'Fights cavities and plaque',
      'Freshens breath',
      'Strengthens enamel',
    ],
    description:
      'A complete oral care kit for a healthy, confident smile. Helps fight plaque, prevent cavities and keep your breath fresh all day long.',
    highlights: DEFAULT_HIGHLIGHTS,
  },
  {
    id: '8',
    name: 'Biotin Hair Growth Support',
    manufacturer: 'GlowVita',
    image: MEDICINE_IMAGES.hairCare,
    price: 14.99,
    unit: '60 tablets',
    rating: 4.6,
    reviews: 1567,
    uses: [
      'Reduces hair fall',
      'Promotes stronger hair',
      'Supports nails and skin',
    ],
    description:
      'High-potency Biotin supplement that nourishes hair from within. Helps reduce hair fall, promotes thicker growth and supports healthy skin and nails.',
    highlights: DEFAULT_HIGHLIGHTS,
  },
];

export const getMedicineById = (id: string): Medicine | undefined =>
  MEDICINES.find((m) => m.id === id);

export const getSimilarMedicines = (id: string, limit = 6): Medicine[] =>
  MEDICINES.filter((m) => m.id !== id).slice(0, limit);
