import React from 'react';
import { View, Text, StyleSheet, Switch, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import theme from '@/styles/theme';
import { deliveryTheme } from './deliveryTheme';

const { spacing, typography, borderRadius, shadows } = theme;

interface OnlineStatusCardProps {
  isOnline: boolean;
  onToggle: (value: boolean) => void;
}

const OnlineStatusCard: React.FC<OnlineStatusCardProps> = ({ isOnline, onToggle }) => {
  const { t } = useTranslation();

  return (
    <View style={[styles.card, isOnline ? styles.cardOnline : styles.cardOffline]}>
      <View style={styles.copy}>
        <Text style={styles.title}>
          {isOnline ? t('delivery.accepting') : t('delivery.notAccepting')}
        </Text>
        <Text style={styles.subtitle}>
          {isOnline ? t('delivery.acceptingSub') : t('delivery.notAcceptingSub')}
        </Text>
      </View>
      <Switch
        value={isOnline}
        onValueChange={onToggle}
        trackColor={{
          false: deliveryTheme.border,
          true: deliveryTheme.online,
        }}
        thumbColor={Platform.OS === 'android' ? theme.colors.white : undefined}
        ios_backgroundColor={deliveryTheme.border}
        accessibilityRole="switch"
        accessibilityLabel={t('delivery.onlineStatusA11y')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    marginTop: -spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    backgroundColor: deliveryTheme.surface,
    borderWidth: 1,
    ...shadows.md,
  },
  cardOnline: {
    borderColor: '#A7F3D0',
  },
  cardOffline: {
    borderColor: deliveryTheme.border,
  },
  copy: {
    flex: 1,
    marginRight: spacing.md,
  },
  title: {
    ...typography.body,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    ...typography.caption,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
});

export default OnlineStatusCard;
