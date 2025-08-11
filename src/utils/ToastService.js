import Toast from 'react-native-toast-message';

class ToastService {
    static show(message, type = 'default', duration = 3000) {
        switch (type) {
            case 'success':
                Toast.show({
                    type: 'success',
                    text1: message,
                    position: 'top',
                    visibilityTime: duration,
                });
                break;
            case 'error':
                Toast.show({
                    type: 'error',
                    text1: message,
                    position: 'top',
                    visibilityTime: duration,
                });
                break;
            case 'warning':
                Toast.show({
                    type: 'info',
                    text1: message,
                    position: 'top',
                    visibilityTime: duration,
                });
                break;
            case 'info':
                Toast.show({
                    type: 'info',
                    text1: message,
                    position: 'top',
                    visibilityTime: duration,
                });
                break;
            default:
                Toast.show({
                    type: 'info',
                    text1: message,
                    position: 'top',
                    visibilityTime: duration,
                });
                break;
        }
    }

    static success(message, duration = 3000) {
        this.show(message, 'success', duration);
    }

    static error(message, duration = 4000) {
        this.show(message, 'error', duration);
    }

    static warning(message, duration = 3000) {
        this.show(message, 'warning', duration);
    }

    static info(message, duration = 3000) {
        this.show(message, 'info', duration);
    }

    static default(message, duration = 3000) {
        this.show(message, 'default', duration);
    }
}

export default ToastService;
