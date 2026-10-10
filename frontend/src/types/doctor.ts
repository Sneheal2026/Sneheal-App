export type DoctorCustomer = {
  id: string;
  username: string;
  phoneMasked: string;
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
