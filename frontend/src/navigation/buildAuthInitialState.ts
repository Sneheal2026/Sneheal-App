import type { NavigationState, PartialState } from '@react-navigation/native';
import type { AuthStackParamList } from './types';

export const buildAuthInitialState = (
  route: keyof AuthStackParamList,
  params?: AuthStackParamList[keyof AuthStackParamList],
): PartialState<NavigationState> | undefined => {
  if (route === 'PhoneNumber') {
    return undefined;
  }

  return {
    index: 0,
    routes: [{ name: route, params }],
  };
};
