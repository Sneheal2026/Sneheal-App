import AsyncStorage from '@react-native-async-storage/async-storage';

/** Dev-only helpers for wiping local app data during testing. */
export const isDevStorageToolsEnabled = (): boolean => __DEV__;

export const clearAllAppStorage = async (): Promise<void> => {
  await AsyncStorage.clear();
};
