import type { ScanPrescriptionResponse, ScanPrescriptionError } from '@/types/prescription';
import { ApiError } from './apiClient';
import { authenticatedFetch } from './authTokenManager';
import { devLog } from '@/utils/devLogger';

/**
 * Upload prescription image and get medicine names
 * @param imageUri - Local file URI of the prescription image
 * @param signal - Optional AbortSignal for cancellation
 * @returns Medicine names extracted from prescription
 */
export async function scanPrescription(
  imageUri: string,
  signal?: AbortSignal,
): Promise<ScanPrescriptionResponse> {
  devLog('PRESCRIPTION', '→ Scanning prescription', { uri: imageUri.substring(0, 50) });

  const formData = new FormData();

  const uriLower = imageUri.toLowerCase();
  let mimeType = 'image/jpeg';
  let fileName = 'prescription.jpg';

  if (uriLower.endsWith('.png')) {
    mimeType = 'image/png';
    fileName = 'prescription.png';
  }

  formData.append('file', {
    uri: imageUri,
    type: mimeType,
    name: fileName,
  } as any);

  try {
    const response = await authenticatedFetch('/api/prescriptions/scan', {
      method: 'POST',
      body: formData,
      signal,
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      const errorMessage = data.message || 'Failed to scan prescription';
      devLog('PRESCRIPTION', `✗ ${response.status}`, errorMessage);

      const error: ScanPrescriptionError = {
        message: errorMessage,
        status: response.status,
      };
      throw error;
    }

    devLog('PRESCRIPTION', '← Success', {
      count: data.data?.medicineNames?.length ?? 0,
    });

    return data.data as ScanPrescriptionResponse;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      devLog('PRESCRIPTION', '✗ Request cancelled');
      throw new Error('Scan cancelled');
    }

    if (error instanceof ApiError && error.status === 401) {
      throw new Error('Session expired. Please log in again.');
    }

    if (error.message?.includes('Network request failed')) {
      devLog('PRESCRIPTION', '✗ Network error');
      throw new Error('Network error. Please check your connection.');
    }

    if (error.message && error.status !== undefined) {
      throw error;
    }

    devLog('PRESCRIPTION', '✗ Unexpected error', error);
    throw new Error('Failed to scan prescription. Please try again.');
  }
}
