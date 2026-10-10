import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import { Alert, Platform, Share } from 'react-native';

/**
 * Downloads a remote report and opens it with the system viewer.
 */
export async function openRemoteFile(
  url: string,
  fileName: string,
  mimeType: string,
): Promise<void> {
  try {
    const safeName = fileName.replace(/[^\w.\-]+/g, '_') || 'report';
    const dest = `${FileSystem.cacheDirectory}${Date.now()}-${safeName}`;
    const downloaded = await FileSystem.downloadAsync(url, dest);

    if (Platform.OS === 'android') {
      const contentUri = await FileSystem.getContentUriAsync(downloaded.uri);
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: contentUri,
        flags: 1,
        type: mimeType,
      });
      return;
    }

    await Share.share({
      url: downloaded.uri,
      title: fileName,
    });
  } catch {
    Alert.alert('Unable to open file', 'Try again, or open it from another app.');
  }
}
