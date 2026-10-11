export type DoctorCustomer = {
  id: string;
  username: string;
  /** Full number for authenticated doctor views */
  phone: string;
  phoneMasked: string;
};

export type DoctorEngagedPatient = DoctorCustomer & {
  orderCount: number;
  prescriptionCount: number;
  lastActivityAt: string;
};

export type DoctorOrderItem = {
  name: string;
  quantity: number;
};

export type DoctorOrder = {
  id: string;
  publicId: string;
  status: string;
  createdAt: string;
  items: DoctorOrderItem[];
};

export type DoctorPrescription = {
  id: string;
  imageUrl: string;
  createdAt: string;
};
