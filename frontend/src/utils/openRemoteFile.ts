import * as FileSystem from 'expo-file-system/legacy';
import { Alert, Linking, Platform, Share } from 'react-native';
import {
  resolveHealthReportFileName,
  resolveHealthReportMime,
} from '@/utils/healthReportFile';
import { openLocalFileOnAndroid } from '@/utils/openLocalFileAndroid';

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

/**
 * Downloads a remote report and opens it with the system viewer.
 */
export async function openRemoteFile(
  url: string,
  fileName: string,
  mimeType: string,
): Promise<void> {
  const trimmedUrl = url?.trim();
  if (!trimmedUrl) {
    Alert.alert('Unable to open file', 'This file has no download link.');
    return;
  }

  const resolvedMime = resolveHealthReportMime(mimeType, trimmedUrl);
  const resolvedName = resolveHealthReportFileName(
    fileName.replace(/\.[^.]+$/, ''),
    mimeType,
    trimmedUrl,
  );

  try {
    const safeName = resolvedName.replace(/[^\w.\-]+/g, '_') || 'report.pdf';
    const dest = `${FileSystem.cacheDirectory}${Date.now()}-${safeName}`;
    const downloaded = await FileSystem.downloadAsync(trimmedUrl, dest);

    if (downloaded.status !== 200) {
      throw new Error(`Download failed (${downloaded.status})`);
    }

    const info = await FileSystem.getInfoAsync(downloaded.uri);
    if (!info.exists || (info.size ?? 0) < 32) {
      throw new Error('Downloaded file is empty');
    }

    const isPdf = resolvedMime === 'application/pdf';
    if (isPdf && !(await headerLooksLikePdf(downloaded.uri))) {
      // Cloudinary / CDN returned HTML or wrong body — open in browser instead.
      await Linking.openURL(trimmedUrl);
      return;
    }

    if (Platform.OS === 'android') {
      await openLocalFileOnAndroid(downloaded.uri, resolvedMime, trimmedUrl);
      return;
    }

    await Share.share({
      url: downloaded.uri,
      title: safeName,
    });
  } catch {
    try {
      await Linking.openURL(trimmedUrl);
      return;
    } catch {
      // fall through
    }
    Alert.alert(
      'Unable to open file',
      'Install a PDF reader (e.g. Google PDF Viewer), or try again.',
    );
  }
}
