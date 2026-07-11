import type {
  ScanPrescriptionResponse,
  ScanPrescriptionError,
  SavedPrescription,
} from '@/types/prescription';
import { ApiError } from './apiClient';
import { authenticatedFetch, authenticatedApiRequest } from './authTokenManager';
import { devLog } from '@/utils/devLogger';

/** Soft TTL — reopen screen uses cache; pull-to-refresh / save / delete bypasses. */
const PRESCRIPTION_SYNC_TTL_MS = 5 * 60 * 1000;

let cachedPrescriptions: SavedPrescription[] | null = null;
let cachedAt = 0;
let listInFlight: Promise<SavedPrescription[]> | null = null;

const isCacheFresh = (): boolean =>
  cachedPrescriptions != null && Date.now() - cachedAt < PRESCRIPTION_SYNC_TTL_MS;

export const getCachedPrescriptions = (): SavedPrescription[] | null => cachedPrescriptions;

export const invalidatePrescriptionCache = (): void => {
  cachedPrescriptions = null;
  cachedAt = 0;
};

const setPrescriptionCache = (items: SavedPrescription[]): SavedPrescription[] => {
  cachedPrescriptions = items;
  cachedAt = Date.now();
  return items;
};

const buildImageFormData = (imageUri: string): FormData => {
  const formData = new FormData();
  const uriLower = imageUri.toLowerCase();
  const isPng = uriLower.includes('.png');

  formData.append('file', {
    uri: imageUri,
    type: isPng ? 'image/png' : 'image/jpeg',
    name: isPng ? 'prescription.png' : 'prescription.jpg',
  } as any);

  return formData;
};

const mapUploadError = (error: any, fallback: string): never => {
  if (error?.name === 'AbortError') {
    throw new Error('Request cancelled');
  }

  if (error instanceof ApiError && error.status === 401) {
    throw new Error('Session expired. Please log in again.');
  }

  if (error?.message?.includes('Network request failed')) {
    throw new Error('Network error. Please check your connection.');
  }

  if (error?.message && error.status !== undefined) {
    throw error;
  }

  throw new Error(fallback);
};

/**
 * Upload prescription image and get medicine names
 */
export async function scanPrescription(
  imageUri: string,
  signal?: AbortSignal,
): Promise<ScanPrescriptionResponse> {
  devLog('PRESCRIPTION', '→ Scanning prescription', { uri: imageUri.substring(0, 50) });

  try {
    const response = await authenticatedFetch('/api/prescriptions/scan', {
      method: 'POST',
      body: buildImageFormData(imageUri),
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

    devLog('PRESCRIPTION', '← Scan success', {
      count: data.data?.medicineNames?.length ?? 0,
    });

    return data.data as ScanPrescriptionResponse;
  } catch (error: any) {
    if (error?.message && error.status !== undefined) {
      throw error;
    }
    return mapUploadError(error, 'Failed to scan prescription. Please try again.');
  }
}

/**
 * Save prescription image to Cloudinary via backend
 */
export async function savePrescription(imageUri: string): Promise<SavedPrescription> {
  devLog('PRESCRIPTION', '→ Saving prescription', { uri: imageUri.substring(0, 50) });

  try {
    const response = await authenticatedFetch('/api/prescriptions', {
      method: 'POST',
      body: buildImageFormData(imageUri),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      const errorMessage = data.message || 'Failed to save prescription';
      devLog('PRESCRIPTION', `✗ Save ${response.status}`, errorMessage);
      throw { message: errorMessage, status: response.status } as ScanPrescriptionError;
    }

    const saved = data.data as SavedPrescription;
    // Next Prescriptions visit should refetch so gallery stays correct
    invalidatePrescriptionCache();

    devLog('PRESCRIPTION', '← Save success', { id: saved?.id });
    return saved;
  } catch (error: any) {
    if (error?.message && error.status !== undefined) {
      throw error;
    }
    return mapUploadError(error, 'Failed to save prescription. Please try again.');
  }
}

const fetchPrescriptionsFromApi = (): Promise<SavedPrescription[]> =>
  authenticatedApiRequest<SavedPrescription[]>('/api/prescriptions');

/**
 * Cache-first list. Pass force=true for pull-to-refresh.
 */
export async function fetchPrescriptions(options?: {
  force?: boolean;
}): Promise<SavedPrescription[]> {
  const force = options?.force === true;

  if (!force && isCacheFresh() && cachedPrescriptions) {
    devLog('PRESCRIPTION', '← List cache hit', { count: cachedPrescriptions.length });
    return cachedPrescriptions;
  }

  if (listInFlight) {
    return listInFlight;
  }

  listInFlight = (async () => {
    try {
      const data = await fetchPrescriptionsFromApi();
      return setPrescriptionCache(data ?? []);
    } finally {
      listInFlight = null;
    }
  })();

  return listInFlight;
}

export async function deletePrescription(id: string): Promise<{ deleted: boolean }> {
  const result = await authenticatedApiRequest<{ deleted: boolean }>(`/api/prescriptions/${id}`, {
    method: 'DELETE',
  });

  if (cachedPrescriptions) {
    setPrescriptionCache(cachedPrescriptions.filter((item) => item.id !== id));
  } else {
    invalidatePrescriptionCache();
  }

  return result;
}
