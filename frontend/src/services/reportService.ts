import type { HealthReport } from '@/types/report';
import { ApiError } from './apiClient';
import { authenticatedApiRequest, authenticatedFetch } from './authTokenManager';

export type ReportUploadFile = {
  uri: string;
  name: string;
  mimeType: string;
};

const readError = async (response: Response, fallback: string): Promise<never> => {
  let message = fallback;
  try {
    const data = await response.json();
    if (typeof data?.message === 'string' && data.message) {
      message = data.message;
    }
  } catch {
    // Response body was not JSON.
  }
  throw new ApiError(response.status, message);
};

export function fetchReports(): Promise<HealthReport[]> {
  return authenticatedApiRequest<HealthReport[]>('/api/reports');
}

export async function uploadReport(file: ReportUploadFile): Promise<HealthReport> {
  const formData = new FormData();
  const title = file.name.replace(/\.[^.]+$/, '').slice(0, 120);

  formData.append('file', {
    uri: file.uri,
    type: file.mimeType,
    name: file.name,
  } as any);
  formData.append('title', title || 'Lab report');

  const response = await authenticatedFetch('/api/reports', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    return readError(response, 'Could not upload this file');
  }

  const data = await response.json();
  if (!data?.success || !data.data) {
    throw new ApiError(response.status, data?.message || 'Could not upload this file');
  }

  return data.data as HealthReport;
}

export function deleteReport(id: string): Promise<{ deleted: boolean }> {
  return authenticatedApiRequest<{ deleted: boolean }>(`/api/reports/${id}`, {
    method: 'DELETE',
  });
}
