export type FaqCategory = 'orders' | 'prescriptions' | 'account' | 'delivery';

export type FaqItem = {
  id: string;
  category: FaqCategory;
  /** i18n keys under `help.*` */
  questionKey: string;
  answerKey: string;
};

export const FAQ_CATEGORIES: { id: FaqCategory }[] = [
  { id: 'prescriptions' },
  { id: 'orders' },
  { id: 'delivery' },
  { id: 'account' },
];

export const HELP_FAQ: FaqItem[] = [
  {
    id: '1',
    category: 'prescriptions',
    questionKey: 'help.faq1q',
    answerKey: 'help.faq1a',
  },
  {
    id: '2',
    category: 'prescriptions',
    questionKey: 'help.faq2q',
    answerKey: 'help.faq2a',
  },
  {
    id: '3',
    category: 'orders',
    questionKey: 'help.faq3q',
    answerKey: 'help.faq3a',
  },
  {
    id: '4',
    category: 'orders',
    questionKey: 'help.faq4q',
    answerKey: 'help.faq4a',
  },
  {
    id: '5',
    category: 'delivery',
    questionKey: 'help.faq5q',
    answerKey: 'help.faq5a',
  },
  {
    id: '6',
    category: 'delivery',
    questionKey: 'help.faq6q',
    answerKey: 'help.faq6a',
  },
  {
    id: '7',
    category: 'account',
    questionKey: 'help.faq7q',
    answerKey: 'help.faq7a',
  },
  {
    id: '8',
    category: 'account',
    questionKey: 'help.faq8q',
    answerKey: 'help.faq8a',
  },
];

export const SUPPORT_CONTACT = {
  email: 'sneheal.info@gmail.com',
  phone: '+91 75174 34152',
  /** Dedicated pharmacy desk for out-of-stock medicine requests. */
  pharmacyPhone: '+91 75174 34152',
} as const;
