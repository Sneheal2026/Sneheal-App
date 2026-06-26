export type FaqCategory = 'orders' | 'prescriptions' | 'account' | 'delivery';

export type FaqItem = {
  id: string;
  category: FaqCategory;
  question: string;
  answer: string;
};

export const FAQ_CATEGORIES: { id: FaqCategory; label: string }[] = [
  { id: 'prescriptions', label: 'Prescriptions' },
  { id: 'orders', label: 'Orders' },
  { id: 'delivery', label: 'Delivery' },
  { id: 'account', label: 'Account' },
];

export const HELP_FAQ: FaqItem[] = [
  {
    id: '1',
    category: 'prescriptions',
    question: 'How do I scan a prescription?',
    answer:
      'Go to the Scan tab or tap Upload prescription from Home or Settings. Choose Camera or Gallery, select your prescription image, then tap Scan. Detected medicine names will appear for you to verify before ordering.',
  },
  {
    id: '2',
    category: 'prescriptions',
    question: 'What if the scan does not detect all medicines?',
    answer:
      'Make sure your prescription photo is clear, well-lit, and not blurry. You can retake the photo or manually search for medicines from the Search tab and add them to your cart.',
  },
  {
    id: '3',
    category: 'orders',
    question: 'How do I track my order?',
    answer:
      'Open the Orders tab to see your current and past orders. Tap an order to view its status, items, and delivery updates.',
  },
  {
    id: '4',
    category: 'orders',
    question: 'Can I modify or cancel an order?',
    answer:
      'Orders can be modified or cancelled only before they are confirmed by the pharmacy. Check your order status in the Orders tab and contact support if you need urgent help.',
  },
  {
    id: '5',
    category: 'delivery',
    question: 'How do I add or change my delivery address?',
    answer:
      'Go to Settings → Saved addresses. Add your address with flat or house details, landmark, and contact number so medicines reach you on time.',
  },
  {
    id: '6',
    category: 'delivery',
    question: 'How long does delivery take?',
    answer:
      'Delivery times depend on your location and medicine availability. Most orders are delivered within a few hours in supported areas. You will see an estimated delivery time at checkout.',
  },
  {
    id: '7',
    category: 'account',
    question: 'How do I update my phone number?',
    answer:
      'Your account is linked to your registered mobile number. For number changes, contact our support team with your registered details for verification.',
  },
  {
    id: '8',
    category: 'account',
    question: 'Is my prescription data secure?',
    answer:
      'Yes. Prescription images are processed securely and used only to help you order medicines. We do not share your health data with third parties without your consent.',
  },
];

export const SUPPORT_CONTACT = {
  email: 'support@sneheal.com',
  phone: '+91 1800-123-4567',
} as const;
