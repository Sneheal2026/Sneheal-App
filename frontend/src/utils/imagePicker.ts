import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export type ImagePickSource = 'camera' | 'gallery';

export interface PickedImage {
  uri: string;
  width?: number;
  height?: number;
}

export async function pickImageFromSource(
  source: ImagePickSource,
  permissionMessage: string,
): Promise<PickedImage | null> {
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

  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: 'images',
          allowsEditing: true,
          quality: 0.9,
          aspect: [4, 3],
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: 'images',
          allowsEditing: true,
          quality: 0.9,
          aspect: [4, 3],
        });

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
