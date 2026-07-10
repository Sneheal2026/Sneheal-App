import React, { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp, ParamListBase } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '@/context/AuthContext';
import { clearAllAppStorage, isDevStorageToolsEnabled } from '@/utils/devStorageReset';
import type { AuthStackParamList } from '@/navigation/types';
import theme from '@/styles/theme';

const { colors, spacing, borderRadius, typography } = theme;

const findAuthStackNavigation = (
  navigation: NavigationProp<ParamListBase>,
): NativeStackNavigationProp<AuthStackParamList> | null => {
  let current: NavigationProp<ParamListBase> | undefined = navigation;

  while (current) {
    const routeNames = current.getState().routeNames;
    if (routeNames.includes('PhoneNumber')) {
      return current as NativeStackNavigationProp<AuthStackParamList>;
    }
    current = current.getParent();
  }

  return null;
};

const DevResetStorageButton = () => {
  const navigation = useNavigation();
  const { signOut } = useAuth();
  const [isClearing, setIsClearing] = useState(false);

  const handleReset = useCallback(() => {
    Alert.alert(
      'Clear all local data?',
      'This removes auth session, addresses, reminders, and all other AsyncStorage data. You will return to the login screen.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear everything',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setIsClearing(true);
              try {
                await clearAllAppStorage();
                await signOut();

                const authNav = findAuthStackNavigation(navigation as NavigationProp<ParamListBase>);
                authNav?.reset({
                  index: 0,
                  routes: [{ name: 'PhoneNumber' }],
                });
              } catch {
                Alert.alert('Reset failed', 'Could not clear storage. Please try again.');
              } finally {
                setIsClearing(false);
              }
            })();
          },
        },
      ],
    );
  }, [navigation, signOut]);

  if (!isDevStorageToolsEnabled()) {
    return null;
  }

  return (
    <Pressable
      onPress={handleReset}
      disabled={isClearing}
      style={({ pressed }) => [
        styles.button,
        (pressed || isClearing) && styles.buttonPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel="Clear all app storage for testing"
    >
      {isClearing ? (
        <ActivityIndicator size="small" color={colors.error} />
      ) : (
        <Ionicons name="trash-outline" size={16} color={colors.error} />
      )}
      <Text style={styles.label}>
        {isClearing ? 'Clearing…' : 'Dev: Clear storage'}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    alignSelf: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: `${colors.error}55`,
    backgroundColor: `${colors.error}12`,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  label: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.error,
  },
});

export default DevResetStorageButton;
