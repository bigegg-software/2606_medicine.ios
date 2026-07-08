import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<any>();

export function navigate(name: string, params?: object) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
}

export function navigateWhenReady(name: string, params?: object, attempt = 0) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
    return;
  }
  if (attempt >= 20) return;
  setTimeout(() => navigateWhenReady(name, params, attempt + 1), 100);
}
