import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import SecurityService from '../services/SecurityService';

const DeviceLogoutChecker = ({ navigation }) => {
    useEffect(() => {
        const checkDeviceLogout = async () => {
            try {
                const shouldLogout = await SecurityService.shouldLogoutCurrentDevice();

                if (shouldLogout) {
                    Alert.alert(
                        'Security Alert',
                        'Your account password was changed from another device. You have been logged out for security.',
                        [
                            {
                                text: 'OK',
                                onPress: async () => {
                                    await SecurityService.logoutCurrentDevice();
                                    // Navigation will be handled by the auth state change
                                },
                            },
                        ],
                        { cancelable: false }
                    );
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
    }, [navigation]);

    return null; // This component doesn't render anything
};

export default DeviceLogoutChecker; 