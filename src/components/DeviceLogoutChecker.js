import React, { useEffect } from 'react';
import ToastService from '../utils/ToastService';
import { useTranslation } from 'react-i18next';
import SecurityService from '../services/SecurityService';

const DeviceLogoutChecker = ({ navigation }) => {
    const { t } = useTranslation();

    useEffect(() => {
        const checkDeviceLogout = async () => {
            try {
                const shouldLogout = await SecurityService.shouldLogoutCurrentDevice();

                if (shouldLogout) {
                    ToastService.error(t('errors.passwordChangedFromAnotherDevice'));
                    // Auto-logout after showing error
                    setTimeout(async () => {
                        await SecurityService.logoutCurrentDevice();
                        // Navigation will be handled by the auth state change
                    }, 2000);
                }
            } catch (error) {
                console.error('Error checking device logout:', error);
            }
        };

        // Check on component mount
        checkDeviceLogout();

        // Set up interval to check periodically (every 30 seconds)
        const interval = setInterval(checkDeviceLogout, 30000);

        return () => clearInterval(interval);
    }, [navigation, t]);

    return null; // This component doesn't render anything
};

export default DeviceLogoutChecker; 