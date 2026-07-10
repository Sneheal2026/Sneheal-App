import type { NationalHelpline } from '@/types/emergency.types';

export const NATIONAL_HELPLINES: NationalHelpline[] = [
  {
    id: '112',
    number: '112',
    label: 'National Emergency',
    description: 'Police, fire & medical',
    icon: 'call',
  },
  {
    id: '108',
    number: '108',
    label: 'Ambulance',
    description: 'Emergency medical transport',
    icon: 'car',
  },
  {
    id: '102',
    number: '102',
    label: 'Medical Helpline',
    description: 'Ambulance & health support',
    icon: 'medkit',
  },
  {
    id: '104',
    number: '104',
    label: 'Health Advice',
    description: 'State health helpline',
    icon: 'heart',
  },
];
