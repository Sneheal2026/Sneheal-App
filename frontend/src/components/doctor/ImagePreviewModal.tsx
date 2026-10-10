import React from 'react';
import { Modal, View, Image, Pressable, StyleSheet, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ImagePreviewModalProps = {
  uri: string | null;
  visible: boolean;
  onClose: () => void;
  closeLabel: string;
};

const ImagePreviewModal = ({ uri, visible, onClose, closeLabel }: ImagePreviewModalProps) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
      <View style={styles.root}>
        <Pressable
          onPress={onClose}
          style={[styles.close, { top: insets.top + 12 }]}
          accessibilityRole="button"
          accessibilityLabel={closeLabel}
        >
          <Ionicons name="close" size={22} color="#F8FAFC" />
        </Pressable>
        {uri ? (
          <Image source={{ uri }} style={styles.image} resizeMode="contain" />
        ) : null}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '80%',
  },
  close: {
    position: 'absolute',
    right: 16,
    zIndex: 2,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ImagePreviewModal;
