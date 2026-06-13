import { Platform } from 'react-native';
import theme from '@/styles/theme';

export const TAB_BAR_BASE_HEIGHT = Platform.OS === 'ios' ? 56 : 52;

export const getTabBarHeight = (bottomInset: number) =>
  TAB_BAR_BASE_HEIGHT + bottomInset + theme.spacing.sm;
