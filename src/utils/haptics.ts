import * as Haptics from 'expo-haptics';

/**
 * Helpers de feedback háptico. Cada llamada está envuelta en try/catch porque
 * en algunos dispositivos Android sin motor háptico esto puede rechazar.
 */
function safe(fn: () => Promise<unknown>): void {
  fn().catch(() => {});
}

export const haptic = {
  light: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  medium: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  success: () =>
    safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () =>
    safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  error: () =>
    safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
