import { Platform } from 'react-native';
import theme from '@/styles/theme';

const { spacing, moderateScale } = theme;

export const TAB_BAR_BASE_HEIGHT = Platform.OS === 'ios' ? 60 : 56;

/** Center scan button — sized to sit inside the tab row */
export const SCAN_BUTTON_SIZE = moderateScale(46);
export const SCAN_ICON_SIZE = moderateScale(34);

export const getTabBarHeight = (bottomInset: number) =>
  TAB_BAR_BASE_HEIGHT + bottomInset + spacing.sm;
