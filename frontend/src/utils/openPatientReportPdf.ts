import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import { Alert, Platform, Share } from 'react-native';

/**
 * Copies a bundled PDF into cache and opens it in the system viewer
 * (Android) or share sheet (iOS) so the doctor can view / save it.
 */
export async function openPatientReportPdf(
  moduleId: number,
  fileName: string,
): Promise<void> {
  try {
    const asset = Asset.fromModule(moduleId);
    await asset.downloadAsync();

    if (!asset.localUri) {
      throw new Error('Report file is unavailable');
    }

    const safeName = fileName.replace(/[^\w.\-]+/g, '_');
    const dest = `${FileSystem.cacheDirectory}${safeName}`;
    const existing = await FileSystem.getInfoAsync(dest);

    if (!existing.exists) {
      await FileSystem.copyAsync({ from: asset.localUri, to: dest });
    }

    if (Platform.OS === 'android') {
      const contentUri = await FileSystem.getContentUriAsync(dest);
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: contentUri,
        flags: 1,
        type: 'application/pdf',
      });
      return;
    }

    await Share.share({
      url: dest,
      title: fileName,
    });
  } catch {
    Alert.alert(
      'Unable to open report',
      'Install a PDF viewer or try again.',
    );
  }
}
