import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';
import { getApiBaseUrl } from '@/services/apiClient';
import { getValidAccessToken } from '@/services/authTokenManager';
import {
  resolveHealthReportFileName,
  resolveHealthReportMime,
} from '@/utils/healthReportFile';

const REPORTS_DIR = `${FileSystem.documentDirectory}patient-reports/`;

export type DownloadHealthReportResult = {
  localUri: string;
  fileName: string;
};

/**
 * Downloads a patient lab report via the doctor API (Bearer token), then opens
 * the system share sheet to save to Files / Downloads.
 */
export async function downloadHealthReport(
  patientUserId: string,
  reportId: string,
  title: string,
  mimeType: string,
  fileUrl: string,
): Promise<DownloadHealthReportResult> {
  const token = await getValidAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const resolvedMime = resolveHealthReportMime(mimeType, fileUrl);
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
    throw new Error(`Download failed (${downloaded.status})`);
  }

  const info = await FileSystem.getInfoAsync(downloaded.uri);
  if (!info.exists || (info.size ?? 0) < 32) {
    throw new Error('Downloaded file is empty');
  }

  const finalDest = `${REPORTS_DIR}${safeName}`;
  await FileSystem.copyAsync({ from: downloaded.uri, to: finalDest });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(finalDest, {
      mimeType: resolvedMime,
      dialogTitle: 'Save report',
      ...(Platform.OS === 'ios' && resolvedMime === 'application/pdf'
        ? { UTI: 'com.adobe.pdf' as const }
        : {}),
    });
  } else if (Platform.OS === 'android') {
    Alert.alert(
      'Report saved',
      `Saved in the app as ${safeName}. Use a file manager to copy from app storage if needed.`,
    );
  }

  return { localUri: finalDest, fileName: safeName };
}
