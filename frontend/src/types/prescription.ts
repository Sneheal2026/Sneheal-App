// Prescription scan types
export interface ScanPrescriptionResponse {
  medicineNames: string[];
}

export interface ScanPrescriptionError {
  message: string;
  status?: number;
}
