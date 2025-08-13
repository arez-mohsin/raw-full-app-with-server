import * as Haptics from 'expo-haptics';

// Safe haptic feedback function that checks availability
export const safeHapticFeedback = async (style, type = 'impact') => {
    try {
        if (Haptics && style) {
            if (type === 'impact' && Haptics.impactAsync) {
                await Haptics.impactAsync(style);
            } else if (type === 'notification' && Haptics.notificationAsync) {
                await Haptics.notificationAsync(style);
            }
        }
    } catch (error) {
        console.log('Haptic feedback not available:', error);
    }
};

// Safe haptic style getters that check if the styles exist
const getHapticStyle = (styleName, fallbackStyle) => {
    try {
        if (Haptics && Haptics.ImpactFeedbackStyle && Haptics.ImpactFeedbackStyle[styleName]) {
            return Haptics.ImpactFeedbackStyle[styleName];
        }
        return fallbackStyle;
    } catch (error) {
        console.log(`Haptic style ${styleName} not available:`, error);
        return fallbackStyle;
    }
};

const getNotificationStyle = (styleName, fallbackStyle) => {
    try {
        if (Haptics && Haptics.NotificationFeedbackType && Haptics.NotificationFeedbackType[styleName]) {
            return Haptics.NotificationFeedbackType[styleName];
        }
        return fallbackStyle;
    } catch (error) {
        console.log(`Notification style ${styleName} not available:`, error);
        return fallbackStyle;
    }
};

// Convenience functions for common haptic patterns
export const hapticLight = () => safeHapticFeedback(getHapticStyle('Light', 'light'), 'impact');
export const hapticMedium = () => safeHapticFeedback(getHapticStyle('Medium', 'medium'), 'impact');
export const hapticHeavy = () => safeHapticFeedback(getHapticStyle('Heavy', 'heavy'), 'impact');
export const hapticSuccess = () => safeHapticFeedback(getNotificationStyle('Success', 'success'), 'notification');
export const hapticError = () => safeHapticFeedback(getNotificationStyle('Error', 'error'), 'notification');
export const hapticWarning = () => safeHapticFeedback(getNotificationStyle('Warning', 'warning'), 'notification');

// Check if haptics are available on the device
export const isHapticsAvailable = () => {
    try {
        return Haptics && (
            Haptics.impactAsync ||
            Haptics.notificationAsync
        ) && (
                Haptics.ImpactFeedbackStyle ||
                Haptics.NotificationFeedbackType
            );
    } catch (error) {
        return false;
    }
};
