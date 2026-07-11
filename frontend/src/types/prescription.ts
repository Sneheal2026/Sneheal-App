export interface ScannedMedicine {
  detectedName: string;
  correctedName: string;
  brandName: string;
  genericName: string;
  manufacturer: string;
  strength: string;
  form: string;
  hasSpellingError: boolean;
}

export type ImageType = 'prescription' | 'medicine_pack' | 'medicine_strip' | 'medicine_bottle' | 'other';

export interface ScanPrescriptionResponse {
  imageType: ImageType;
  medicines: ScannedMedicine[];
  medicineNames: string[];
}

export interface ScanPrescriptionError {
  message: string;
  status?: number;
}

export interface SavedPrescription {
  id: string;
  imageUrl: string;
  createdAt: string;
}
