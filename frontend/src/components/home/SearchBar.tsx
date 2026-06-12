import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/styles/theme';

const { colors, spacing, typography, borderRadius, shadows } = theme;

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onMicPress?: () => void;
  isListening?: boolean;
  compact?: boolean;
  insideHeader?: boolean;
  elevated?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onMicPress,
  isListening = false,
  compact = false,
  insideHeader = false,
  elevated = false,
}) => {
  return (
    <View
      style={[
        styles.searchContainer,
        compact && styles.searchContainerCompact,
        insideHeader && styles.searchContainerInsideHeader,
        elevated && styles.searchContainerElevated,
      ]}
    >
      <Ionicons name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
      <TextInput
        style={styles.searchInput}
        placeholder={isListening ? 'Listening...' : 'Search medicines '}
        placeholderTextColor={isListening ? colors.primary : colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        returnKeyType="search"
      />
      <TouchableOpacity
        style={[styles.micBtn, isListening && styles.micBtnActive]}
        activeOpacity={0.7}
        onPress={() => {
          void onMicPress?.();
        }}
        accessibilityLabel={isListening ? 'Stop voice search' : 'Start voice search'}
        accessibilityRole="button"
      >
        <Ionicons
          name={isListening ? 'mic' : 'mic-outline'}
          size={18}
          color={isListening ? colors.primary : colors.textSecondary}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    height: 50,
    marginHorizontal: spacing.xl,
    marginTop: -spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  searchContainerCompact: {
    marginTop: 0,
    marginHorizontal: spacing.xl,
    height: 46,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  searchContainerInsideHeader: {
    marginTop: 0,
    marginHorizontal: 0,
    borderWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  searchContainerElevated: {
    height: 52,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: colors.surface,
    ...shadows.lg,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.bodySmall,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  micBtn: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  micBtnActive: {
    backgroundColor: colors.primary + '18',
  },
});

export default React.memo(SearchBar);
