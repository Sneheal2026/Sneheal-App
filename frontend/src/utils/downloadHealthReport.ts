import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';
import { getApiBaseUrl } from '@/services/apiClient';
import { getValidAccessToken } from '@/services/authTokenManager';
import {
  isHealthReportPdf,
  resolveHealthReportFileName,
  resolveHealthReportMime,
} from '@/utils/healthReportFile';
import { openLocalFileOnAndroid } from '@/utils/openLocalFileAndroid';

const REPORTS_DIR = `${FileSystem.documentDirectory}patient-reports/`;

const headerLooksLikePdf = async (uri: string): Promise<boolean> => {
  try {
    const prefix = await FileSystem.readAsStringAsync(uri, {
      length: 4,
      encoding: FileSystem.EncodingType.UTF8,
    });
    return prefix.startsWith('%PDF');
  } catch {
    return false;
  }
};

const readDownloadErrorMessage = async (uri: string, status: number): Promise<string> => {
  let detail = `Download failed (${status})`;
  try {
    const body = await FileSystem.readAsStringAsync(uri);
    const parsed = JSON.parse(body) as { message?: string };
    if (typeof parsed?.message === 'string' && parsed.message.trim()) {
      detail = parsed.message.trim();
    }
  } catch {
    // Body was not JSON (or empty).
  }
  return detail;
};

export type DownloadHealthReportResult = {
  localUri: string;
  fileName: string;
};

type FetchDoctorReportOptions = {
  patientUserId: string;
  reportId: string;
  title: string;
  mimeType: string;
  fileUrl: string;
};

/**
 * Downloads a report through the doctor API (Bearer auth) into app cache/documents.
 */
export async function fetchDoctorReportFile(
  options: FetchDoctorReportOptions,
): Promise<DownloadHealthReportResult> {
  const { patientUserId, reportId, title, mimeType, fileUrl } = options;
  const token = await getValidAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const resolvedName = resolveHealthReportFileName(title, mimeType, fileUrl);
  const safeName = resolvedName.replace(/[^\w.\-]+/g, '_') || 'report.pdf';

  await FileSystem.makeDirectoryAsync(REPORTS_DIR, { intermediates: true });

  const tempDest = `${FileSystem.cacheDirectory}${Date.now()}-${safeName}`;
  const apiUrl = `${getApiBaseUrl()}/api/doctor/customers/${encodeURIComponent(patientUserId)}/reports/${encodeURIComponent(reportId)}/file`;

  const downloaded = await FileSystem.downloadAsync(apiUrl, tempDest, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (downloaded.status !== 200) {
    throw new Error(await readDownloadErrorMessage(downloaded.uri, downloaded.status));
  }

  const info = await FileSystem.getInfoAsync(downloaded.uri);
  if (!info.exists || (info.size ?? 0) < 32) {
    throw new Error('Downloaded file is empty');
  }

  const isPdf = isHealthReportPdf(mimeType, fileUrl);
  if (isPdf && !(await headerLooksLikePdf(downloaded.uri))) {
    throw new Error('The server did not return a valid PDF file');
  }

  const finalDest = `${REPORTS_DIR}${safeName}`;
  await FileSystem.copyAsync({ from: downloaded.uri, to: finalDest });

  return { localUri: finalDest, fileName: safeName };
}

/**
 * View/open a report file on device (PDF viewer or image handler).
 */
export async function viewDoctorHealthReport(options: FetchDoctorReportOptions): Promise<void> {
  const { mimeType, fileUrl } = options;
  const { localUri } = await fetchDoctorReportFile(options);
  const resolvedMime = resolveHealthReportMime(mimeType, fileUrl);
  const isPdf = isHealthReportPdf(mimeType, fileUrl);

  if (Platform.OS === 'android') {
    await openLocalFileOnAndroid(localUri, resolvedMime);
    return;
  }

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(localUri, {
      mimeType: resolvedMime,
      dialogTitle: 'Open report',
      ...(Platform.OS === 'ios' && isPdf ? { UTI: 'com.adobe.pdf' as const } : {}),
    });
    return;
  }

  Alert.alert('Report saved', 'The file was saved in the app but could not be opened automatically.');
}

/**
 * Downloads a patient lab report via the doctor API, then opens share/save or PDF viewer.
 */
export async function downloadHealthReport(
  patientUserId: string,
  reportId: string,
  title: string,
  mimeType: string,
  fileUrl: string,
): Promise<DownloadHealthReportResult> {
  const options = { patientUserId, reportId, title, mimeType, fileUrl };
  const result = await fetchDoctorReportFile(options);
  const resolvedMime = resolveHealthReportMime(mimeType, fileUrl);
  const isPdf = isHealthReportPdf(mimeType, fileUrl);

  if (Platform.OS === 'android' && isPdf) {
    await openLocalFileOnAndroid(result.localUri, resolvedMime);
    return result;
  }

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(result.localUri, {
      mimeType: resolvedMime,
      dialogTitle: 'Save report',
      ...(Platform.OS === 'ios' && isPdf ? { UTI: 'com.adobe.pdf' as const } : {}),
    });
  } else if (Platform.OS === 'android') {
    Alert.alert(
      'Report saved',
      `Saved in the app as ${result.fileName}. Use a file manager to copy from app storage if needed.`,
    );
  }

  return result;
}
