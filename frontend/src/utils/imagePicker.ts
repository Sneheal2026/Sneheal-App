import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export type ImagePickSource = 'camera' | 'gallery';

export interface PickedImage {
  uri: string;
  width?: number;
  height?: number;
}

export interface PickImageOptions {
  /** When true, opens the native crop/edit UI after picking. */
  allowsEditing?: boolean;
  /** Locks the crop rectangle to this ratio, e.g. [1, 1] for a square avatar. */
  aspect?: [number, number];
  /** JPEG compression quality (0-1). Defaults to 0.9. */
  quality?: number;
}

export async function pickImageFromSource(
  source: ImagePickSource,
  permissionMessage: string,
  options: PickImageOptions = {},
): Promise<PickedImage | null> {
  const { allowsEditing = false, aspect, quality = 0.9 } = options;

  const permission =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    Alert.alert(
      'Permission required',
      permissionMessage,
    );
    return null;
  }

  const pickerOptions: ImagePicker.ImagePickerOptions = {
    mediaTypes: 'images',
    allowsEditing,
    quality,
    ...(aspect ? { aspect } : {}),
  };

  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(pickerOptions)
      : await ImagePicker.launchImageLibraryAsync(pickerOptions);

  if (result.canceled || !result.assets[0]?.uri) {
    return null;
  }

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
  };
}
