import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Sharing from 'expo-sharing';
import { Linking } from 'react-native';

/** FLAG_GRANT_READ_URI_PERMISSION | FLAG_ACTIVITY_NEW_TASK */
const ANDROID_VIEW_FLAGS = 268435457;

const tryViewIntent = async (contentUri: string, type: string) => {
  await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
    data: contentUri,
    flags: ANDROID_VIEW_FLAGS,
    type,
  });
};

/**
 * Opens a local file on Android (PDF / image) via content URI, with fallbacks.
 */
export async function openLocalFileOnAndroid(
  localUri: string,
  mimeType: string,
  remoteFallbackUrl?: string,
): Promise<void> {
  const contentUri = await FileSystem.getContentUriAsync(localUri);
  const mimeAttempts = [
    mimeType,
    mimeType.startsWith('image/') ? mimeType : 'application/pdf',
    '*/*',
  ];

  for (const type of mimeAttempts) {
    try {
      await tryViewIntent(contentUri, type);
      return;
    } catch {
      // try next MIME
    }
  }

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(localUri, {
      mimeType: mimeType.startsWith('image/') ? mimeType : 'application/pdf',
      dialogTitle: 'Open report',
    });
    return;
  }

  if (remoteFallbackUrl) {
    await Linking.openURL(remoteFallbackUrl);
    return;
  }

  throw new Error('No app available to open this file');
}
