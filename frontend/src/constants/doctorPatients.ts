export type ConditionSeverity = 'mild' | 'moderate' | 'severe';

export type PatientCondition = {
  id: string;
  name: string;
  severity: ConditionSeverity;
  /** Share of care focus (0–100). Segments should sum to 100. */
  careFocusPercent: number;
  color: string;
};

export type PatientVital = {
  id: string;
  label: string;
  value: string;
  unit?: string;
};

export type MedicineOrderItem = {
  name: string;
  quantity: number;
};

export type PatientMedicineOrder = {
  id: string;
  orderId: string;
  dateLabel: string;
  status: 'Delivered' | 'Cancelled';
  medicines: MedicineOrderItem[];
};

export type PatientTestReport = {
  id: string;
  title: string;
  dateLabel: string;
  fileName: string;
  /** Bundled asset module id from require('…pdf') */
  asset: number;
};

export type DoctorPatient = {
  id: string;
  name: string;
  age: number;
  sex: 'F' | 'M' | 'O';
  bloodGroup: string;
  lastVisitLabel: string;
  initials: string;
  phone: string;
  email: string;
  address: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  vitals: PatientVital[];
  conditions: PatientCondition[];
  medicineOrders: PatientMedicineOrder[];
  testReports: PatientTestReport[];
};

export const DOCTOR_PATIENTS: DoctorPatient[] = [
  {
    id: 'p1',
    name: 'Pranay Chepur',
    age: 23,
    sex: 'M',
    bloodGroup: 'O+',
    lastVisitLabel: '3 days ago',
    initials: 'PC',
    phone: '+91 98765 43210',
    email: 'pranay.chepur@email.com',
    address: '12-4-88, Kukatpally, Hyderabad, Telangana 500072',
    emergencyContact: {
      name: 'Ramesh Chepur',
      phone: '+91 99887 76655',
      relation: 'Father',
    },
    vitals: [
      { id: 'bp', label: 'Blood pressure', value: '122/78', unit: 'mmHg' },
      { id: 'fbs', label: 'Fasting sugar', value: '98', unit: 'mg/dL' },
      { id: 'bmi', label: 'BMI', value: '23.1' },
    ],
    conditions: [
      {
        id: 'c1',
        name: 'Hypertension',
        severity: 'moderate',
        careFocusPercent: 40,
        color: '#0D5C63',
      },
      {
        id: 'c2',
        name: 'Type 2 Diabetes',
        severity: 'mild',
        careFocusPercent: 30,
        color: '#147A84',
      },
      {
        id: 'c3',
        name: 'Hyperlipidemia',
        severity: 'mild',
        careFocusPercent: 20,
        color: '#2DD4BF',
      },
      {
        id: 'c4',
        name: 'Other',
        severity: 'mild',
        careFocusPercent: 10,
        color: '#99F6E4',
      },
    ],
    medicineOrders: [
      {
        id: 'o1',
        orderId: '#SNH-5102',
        dateLabel: '8 Jul 2026',
        status: 'Delivered',
        medicines: [
          { name: 'Amlodipine 5 mg', quantity: 30 },
          { name: 'Metformin 500 mg', quantity: 60 },
        ],
      },
      {
        id: 'o2',
        orderId: '#SNH-4988',
        dateLabel: '22 Jun 2026',
        status: 'Delivered',
        medicines: [
          { name: 'Atorvastatin 10 mg', quantity: 30 },
          { name: 'Daily Multivitamin Capsules', quantity: 1 },
        ],
      },
      {
        id: 'o3',
        orderId: '#SNH-4811',
        dateLabel: '5 Jun 2026',
        status: 'Delivered',
        medicines: [
          { name: 'Metformin 500 mg', quantity: 60 },
          { name: 'Telmisartan 40 mg', quantity: 30 },
        ],
      },
      {
        id: 'o4',
        orderId: '#SNH-4620',
        dateLabel: '18 May 2026',
        status: 'Cancelled',
        medicines: [{ name: 'Paracetamol 650 mg', quantity: 20 }],
      },
    ],
    testReports: [
      {
        id: 'r1',
        title: 'Blood & lab reports',
        dateLabel: '2 Jul 2026',
        fileName: 'Reports-Pranay.pdf',
        asset: require('../../assets/images/Reports-Pranay.pdf'),
      },
    ],
  },
];

export const getDoctorPatientById = (patientId: string): DoctorPatient | undefined =>
  DOCTOR_PATIENTS.find((p) => p.id === patientId);
