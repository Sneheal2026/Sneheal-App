import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import SessionRestoreVisual from '@/components/auth/SessionRestoreVisual';
import { useTheme } from '@/hooks/useTheme';

const AuthBootScreen = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <SessionRestoreVisual />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default AuthBootScreen;
