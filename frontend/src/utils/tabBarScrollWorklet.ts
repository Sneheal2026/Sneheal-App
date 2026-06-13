import type { SharedValue } from 'react-native-reanimated';

export function updateTabBarOnScroll(
  currentY: number,
  lastScrollY: SharedValue<number>,
  tabBarOffset: SharedValue<number>,
  tabBarHeight: number,
) {
  'worklet';

  const diff = currentY - lastScrollY.value;

  if (currentY <= 0) {
    tabBarOffset.value = 0;
  } else {
    tabBarOffset.value = Math.min(
      Math.max(tabBarOffset.value + diff, 0),
      tabBarHeight,
    );
  }

  lastScrollY.value = currentY;
}
