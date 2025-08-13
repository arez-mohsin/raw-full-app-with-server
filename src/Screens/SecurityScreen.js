import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    TextInput,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { auth } from '../firebase';
import BiometricService from '../services/BiometricService';
import SecurityService from '../services/SecurityService';
import { hapticLight, hapticMedium, hapticSuccess, hapticError } from '../utils/HapticUtils';

import ToastService from '../utils/ToastService';

const SecurityScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [biometricStatus, setBiometricStatus] = useState({
        isAvailable: false,
        isEnabled: false,
        supportedTypes: [],
        canEnable: false,
        canDisable: false
    });
    const [securitySettings, setSecuritySettings] = useState({
        emailNotifications: true,
        loginAlerts: true
    });
    const [updatingBiometric, setUpdatingBiometric] = useState(false);


    const userId = auth.currentUser?.uid;

    useEffect(() => {
        loadSecurityData();
    }, []);



    const loadSecurityData = async () => {
        try {
            setLoading(true);

            if (!userId) {
                console.warn('No userId available in SecurityScreen');
                ToastService.error('User not authenticated');
                navigation.goBack();
                return;
            }

            console.log('Loading security data for userId:', userId);

            // Load biometric status
            console.log('Loading biometric status...');
            const bioStatus = await BiometricService.getBiometricStatus(userId);
            console.log('Biometric status loaded:', bioStatus);
            setBiometricStatus(bioStatus);

            // Load security settings
            console.log('Loading security settings...');
            const settings = await SecurityService.getUserSecuritySettings(userId);
            console.log('Security settings loaded:', settings);
            setSecuritySettings({
                emailNotifications: settings.emailNotifications,
                loginAlerts: settings.loginAlerts
            });

        } catch (error) {
            console.error('Error loading security data:', error);
            ToastService.error('Failed to load security settings');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = () => {
        navigation.navigate('ChangePassword');
    };



    const handleBiometricToggle = async () => {
        if (!biometricStatus.isAvailable) {
            ToastService.warning('Biometric authentication is not available on this device or not set up.');
            return;
        }

        if (!biometricStatus.isEnabled) {
            // Haptic feedback for showing dialog
            hapticMedium();

            // Show confirmation dialog for enabling biometric
            Alert.alert(
                t('security.enableBiometricTitle'),
                t('security.enableBiometricMessage'),
                [
                    {
                        text: t('common.cancel'),
                        style: 'cancel',
                        onPress: () => hapticLight(),
                    },
                    {
                        text: t('security.enableBiometric'),
                        style: 'default',
                        onPress: async () => {
                            try {
                                setUpdatingBiometric(true);
                                await hapticMedium();

                                const result = await BiometricService.enableBiometric(userId);

                                if (result.success) {
                                    await hapticSuccess();
                                    ToastService.success('Biometric authentication enabled successfully!');
                                    // Reload biometric status
                                    const newStatus = await BiometricService.getBiometricStatus(userId);
                                    setBiometricStatus(newStatus);
                                } else {
                                    await hapticError();
                                    ToastService.error(result.message);
                                }
                            } catch (error) {
                                console.error('Biometric enable error:', error);
                                await hapticError();
                                ToastService.error('Failed to enable biometric authentication');
                            } finally {
                                setUpdatingBiometric(false);
                            }
                        },
                    },
                ],
                {
                    cancelable: true,
                    onDismiss: () => hapticLight()
                }
            );
        } else {
            // Haptic feedback for showing dialog
            hapticMedium();

            // Show confirmation dialog for disabling biometric
            Alert.alert(
                t('security.disableBiometricTitle'),
                t('security.disableBiometricMessage'),
                [
                    {
                        text: t('common.cancel'),
                        style: 'cancel',
                        onPress: () => hapticLight(),
                    },
                    {
                        text: t('security.disableBiometric'),
                        style: 'destructive',
                        onPress: async () => {
                            try {
                                setUpdatingBiometric(true);
                                await hapticMedium();

                                const result = await BiometricService.disableBiometric(userId);

                                if (result.success) {
                                    await hapticSuccess();
                                    ToastService.success('Biometric authentication disabled successfully!');
                                    // Reload biometric status
                                    const newStatus = await BiometricService.getBiometricStatus(userId);
                                    setBiometricStatus(newStatus);
                                } else {
                                    await hapticError();
                                    ToastService.error(result.message);
                                }
                            } catch (error) {
                                console.error('Biometric disable error:', error);
                                await hapticError();
                                ToastService.error('Failed to disable biometric authentication');
                            } finally {
                                setUpdatingBiometric(false);
                            }
                        },
                    },
                ],
                {
                    cancelable: true,
                    onDismiss: () => hapticLight()
                }
            );
        }
    };

    const handleNotificationToggle = async (setting, value) => {
        try {
            const newSettings = { ...securitySettings, [setting]: value };
            setSecuritySettings(newSettings);

            const result = await SecurityService.updateSecurityNotifications(userId, newSettings);

            if (result.success) {
                await hapticLight();
            } else {
                // Revert on failure
                setSecuritySettings(securitySettings);
                ToastService.error(result.message);
            }
        } catch (error) {
            console.error('Error updating notification settings:', error);
            // Revert on error
            setSecuritySettings(securitySettings);
            ToastService.error('Failed to update notification settings');
        }
    };





    const renderPasswordBottomSheet = () => (
        <BottomSheetModal
            ref={passwordBottomSheetRef}
            index={0}
            enableDynamicSizing={false}
            snapPoints={passwordSnapPoints}
            backgroundStyle={styles.bottomSheetBackground}
            handleIndicatorStyle={styles.bottomSheetIndicator}
            keyboardBehavior="interactive"
            keyboardBlurBehavior="restore"
        >

            <BottomSheetView style={[styles.bottomSheetContent, styles.bottomSheetKeyboardPadding]}>
                <View style={styles.bottomSheetHeader}>
                    <Text style={styles.bottomSheetTitle}>Change Password</Text>
                    <TouchableOpacity onPress={handleBottomSheetDismiss}>
                        <Ionicons name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Current Password</Text>
                    <TextInput
                        style={styles.textInput}
                        value={currentPassword}
                        onChangeText={(text) => handlePasswordInputChange(text, 'currentPassword')}
                        placeholder={t('security.currentPasswordPlaceholder')}
                        placeholderTextColor="#666"
                        secureTextEntry
                        autoCapitalize="none"
                        autoCorrect={false}
                        textContentType="password"
                        returnKeyType="next"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>New Password</Text>
                    <TextInput
                        style={styles.textInput}
                        value={newPassword}
                        onChangeText={(text) => handlePasswordInputChange(text, 'newPassword')}
                        placeholder={t('security.newPasswordPlaceholder')}
                        placeholderTextColor="#666"
                        secureTextEntry
                        autoCapitalize="none"
                        autoCorrect={false}
                        textContentType="newPassword"
                        returnKeyType="next"
                    />
                    {newPassword.length > 0 && (
                        <View style={styles.passwordStrengthContainer}>
                            <View style={styles.passwordStrengthBar}>
                                <View
                                    style={[
                                        styles.passwordStrengthFill,
                                        {
                                            width: `${(passwordStrength.score / 5) * 100}%`,
                                            backgroundColor: getPasswordStrengthColor()
                                        }
                                    ]}
                                />
                            </View>
                            <Text style={[styles.passwordStrengthText, { color: getPasswordStrengthColor() }]}>
                                {getPasswordStrengthText()}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Confirm New Password</Text>
                    <TextInput
                        style={styles.textInput}
                        value={confirmPassword}
                        onChangeText={(text) => handlePasswordInputChange(text, 'confirmPassword')}
                        placeholder={t('security.confirmNewPasswordPlaceholder')}
                        placeholderTextColor="#666"
                        secureTextEntry
                    />
                </View>



                <TouchableOpacity
                    style={[styles.modalButton, !passwordStrength.isValid && styles.modalButtonDisabled]}
                    onPress={handlePasswordSubmit}
                    disabled={!passwordStrength.isValid || changingPassword}
                >
                    {changingPassword ? (
                        <ActivityIndicator color="#1a1a1a" />
                    ) : (
                        <Text style={styles.modalButtonText}>{t('security.changePasswordButton')}</Text>
                    )}
                </TouchableOpacity>
            </BottomSheetView>
        </BottomSheetModal>
    );

    if (loading) {
        return (
            <LinearGradient
                colors={['#1a1a1a', '#2a2a2a', '#1a1a1a']}
                style={styles.container}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Security</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FFD700" />
                    <Text style={styles.loadingText}>{t('security.loadingSecuritySettings')}</Text>
                </View>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient
            colors={['#1a1a1a', '#2a2a2a', '#1a1a1a']}
            style={styles.container}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Security</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Authentication */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('security.authentication')}</Text>

                    <TouchableOpacity style={styles.securityItem} onPress={handlePasswordChange}>
                        <View style={styles.securityLeft}>
                            <Ionicons name="key" size={20} color="#FFD700" />
                            <View style={styles.securityTextContainer}>
                                <Text style={styles.securityTitle}>{t('security.changePassword')}</Text>
                                <Text style={styles.securitySubtitle}>{t('security.updateAccountPassword')}</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#888" />
                    </TouchableOpacity>

                    <View style={styles.securityItem}>
                        <View style={styles.securityLeft}>
                            <Ionicons name="finger-print" size={20} color="#FFD700" />
                            <View style={styles.securityTextContainer}>
                                <Text style={styles.securityTitle}>{t('security.biometricLogin')}</Text>
                                <Text style={styles.securitySubtitle}>
                                    {biometricStatus.isEnabled
                                        ? `${t('security.biometricEnabled')}${biometricStatus.supportedTypes.join(', ')}`
                                        : biometricStatus.isAvailable
                                            ? `${t('security.biometricUse')}${biometricStatus.supportedTypes.join(' or ')}`
                                            : t('security.biometricNotAvailable')
                                    }
                                </Text>
                            </View>
                        </View>
                        {updatingBiometric ? (
                            <ActivityIndicator size="small" color="#FFD700" />
                        ) : (
                            <Switch
                                value={biometricStatus.isEnabled}
                                onValueChange={handleBiometricToggle}
                                trackColor={{ false: '#444', true: '#FFD700' }}
                                thumbColor={biometricStatus.isEnabled ? '#fff' : '#f4f3f4'}
                                disabled={!biometricStatus.isAvailable}
                            />
                        )}
                    </View>
                </View>


                {/* Account Security */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('security.accountSecurity')}</Text>

                    <TouchableOpacity style={styles.securityItem}>
                        <View style={styles.securityLeft}>
                            <Ionicons name="phone-portrait" size={20} color="#FFD700" />
                            <View style={styles.securityTextContainer}>
                                <Text style={styles.securityTitle}>{t('security.activeSessions')}</Text>
                                <Text style={styles.securitySubtitle}>{t('security.manageLoggedInDevices')}</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#888" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.securityItem}>
                        <View style={styles.securityLeft}>
                            <Ionicons name="shield" size={20} color="#FFD700" />
                            <View style={styles.securityTextContainer}>
                                <Text style={styles.securityTitle}>{t('security.securityLog')}</Text>
                                <Text style={styles.securitySubtitle}>{t('security.viewRecentSecurityActivities')}</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#888" />
                    </TouchableOpacity>

                    {/* <TouchableOpacity style={styles.securityItem}>
                        <View style={styles.securityLeft}>
                            <Ionicons name="lock-closed" size={20} color="#FFD700" />
                            <View style={styles.securityTextContainer}>
                                <Text style={styles.securityTitle}>Privacy Settings</Text>
                                <Text style={styles.securitySubtitle}>Control your privacy options</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#888" />
                    </TouchableOpacity> */}
                </View>

                {/* Security Tips */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Security Tips</Text>

                    <View style={styles.tipCard}>
                        <Ionicons name="bulb" size={24} color="#FFD700" />
                        <Text style={styles.tipTitle}>Keep Your Account Secure</Text>
                        <Text style={styles.tipText}>
                            {SecurityService.getSecurityTips().map((tip, index) => (
                                `• ${tip}${index < SecurityService.getSecurityTips().length - 1 ? '\n' : ''}`
                            ))}
                        </Text>
                    </View>
                </View>
            </ScrollView>


        </LinearGradient>

    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#fff',
        marginTop: 16,
        fontSize: 16,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 16,
    },
    securityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#2a2a2a',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    securityLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    securityTextContainer: {
        marginLeft: 12,
        flex: 1,
    },
    securityTitle: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '500',
    },
    securitySubtitle: {
        fontSize: 14,
        color: '#888',
        marginTop: 2,
    },
    tipCard: {
        backgroundColor: '#2a2a2a',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
    },
    tipTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 12,
        marginBottom: 8,
    },
    tipText: {
        fontSize: 14,
        color: '#ccc',
        textAlign: 'center',
        lineHeight: 20,
    },
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modalContent: {
        backgroundColor: '#2a2a2a',
        borderRadius: 16,
        padding: 20,
        width: '90%',
        maxWidth: 400,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        color: '#fff',
        marginBottom: 8,
    },
    textInput: {
        backgroundColor: '#1a1a1a',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#fff',
        borderWidth: 1,
        borderColor: '#444',
    },
    passwordStrengthContainer: {
        marginTop: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    passwordStrengthBar: {
        flex: 1,
        height: 4,
        backgroundColor: '#444',
        borderRadius: 2,
        marginRight: 8,
    },
    passwordStrengthFill: {
        height: '100%',
        borderRadius: 2,
    },
    passwordStrengthText: {
        fontSize: 12,
        fontWeight: '500',
        minWidth: 40,
    },
    modalButton: {
        backgroundColor: '#FFD700',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    modalButtonDisabled: {
        backgroundColor: '#666',
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    bottomSheetBackground: {
        backgroundColor: '#2a2a2a',
    },
    bottomSheetIndicator: {
        backgroundColor: '#666',
    },
    bottomSheetContent: {
        flex: 1,
        padding: 20,
    },
    bottomSheetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    bottomSheetTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    bottomSheetKeyboardPadding: {
        paddingBottom: 40, // Extra space at bottom for keyboard
    },
});

export default SecurityScreen;
