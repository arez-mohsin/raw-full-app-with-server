import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    StatusBar,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth } from '../firebase';
import SecurityService from '../services/SecurityService';
import { hapticMedium, hapticSuccess, hapticError } from '../utils/HapticUtils';
import ToastService from '../utils/ToastService';

const ChangePasswordScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordStrength, setPasswordStrength] = useState({ isValid: false, score: 0, feedback: [] });
    const [changingPassword, setChangingPassword] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const currentPasswordRef = useRef(null);
    const newPasswordRef = useRef(null);
    const confirmPasswordRef = useRef(null);

    const userId = auth.currentUser?.uid;

    useEffect(() => {
        if (!userId) {
            ToastService.error('User not authenticated');
            navigation.goBack();
        }
    }, [userId, navigation]);

    const handlePasswordInputChange = (text, field) => {
        if (field === 'newPassword') {
            setNewPassword(text);
            const strength = SecurityService.validatePasswordStrength(text);
            setPasswordStrength(strength);
        } else if (field === 'currentPassword') {
            setCurrentPassword(text);
        } else if (field === 'confirmPassword') {
            setConfirmPassword(text);
        }
    };

    const validateForm = () => {
        if (!currentPassword.trim()) {
            ToastService.error('Please enter your current password');
            currentPasswordRef.current?.focus();
            return false;
        }

        if (!newPassword.trim()) {
            ToastService.error('Please enter a new password');
            newPasswordRef.current?.focus();
            return false;
        }

        if (!passwordStrength.isValid) {
            ToastService.error('New password does not meet security requirements');
            newPasswordRef.current?.focus();
            return false;
        }

        if (newPassword !== confirmPassword) {
            ToastService.error('New passwords do not match');
            confirmPasswordRef.current?.focus();
            return false;
        }

        if (currentPassword === newPassword) {
            ToastService.error('New password must be different from current password');
            newPasswordRef.current?.focus();
            return false;
        }

        return true;
    };

    const handleChangePassword = async () => {
        if (!validateForm()) return;

        try {
            setChangingPassword(true);
            await hapticMedium();

            const result = await SecurityService.changePassword(currentPassword, newPassword);

            if (result.success) {
                await hapticSuccess();
                ToastService.success(result.message || 'Password changed successfully!');

                // Clear form
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setPasswordStrength({ isValid: false, score: 0, feedback: [] });

                // Navigate back after success
                setTimeout(() => {
                    navigation.goBack();
                }, 1500);
            } else {
                await hapticError();
                ToastService.error(result.message || 'Failed to change password');
            }
        } catch (error) {
            console.error('Password change error:', error);
            await hapticError();
            ToastService.error('Failed to change password. Please try again.');
        } finally {
            setChangingPassword(false);
        }
    };

    const getPasswordStrengthColor = () => {
        if (passwordStrength.score >= 4) return '#4CAF50';
        if (passwordStrength.score >= 3) return '#FF9800';
        if (passwordStrength.score >= 2) return '#FFC107';
        return '#F44336';
    };

    const getPasswordStrengthText = () => {
        if (passwordStrength.score >= 4) return 'Strong';
        if (passwordStrength.score >= 3) return 'Good';
        if (passwordStrength.score >= 2) return 'Fair';
        return 'Weak';
    };

    const renderPasswordStrengthBar = () => {
        const segments = 5;
        const activeSegments = passwordStrength.score;

        return (
            <View style={styles.strengthBarContainer}>
                <View style={styles.strengthBar}>
                    {Array.from({ length: segments }).map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.strengthSegment,
                                {
                                    backgroundColor: index < activeSegments ? getPasswordStrengthColor() : theme.colors.border,
                                }
                            ]}
                        />
                    ))}
                </View>
                <Text style={[styles.strengthText, { color: getPasswordStrengthColor() }]}>
                    {getPasswordStrengthText()}
                </Text>
            </View>
        );
    };

    const renderPasswordRequirements = () => {
        const requirements = [
            { key: 'length', text: 'At least 8 characters', met: newPassword.length >= 8 },
            { key: 'uppercase', text: 'One uppercase letter', met: /[A-Z]/.test(newPassword) },
            { key: 'lowercase', text: 'One lowercase letter', met: /[a-z]/.test(newPassword) },
            { key: 'number', text: 'One number', met: /\d/.test(newPassword) },
            { key: 'special', text: 'One special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword) }
        ];

        return (
            <View style={styles.requirementsContainer}>
                <Text style={[styles.requirementsTitle, { color: theme.colors.textSecondary }]}>
                    Password Requirements:
                </Text>
                {requirements.map((req, index) => (
                    <View key={index} style={styles.requirementItem}>
                        <Ionicons
                            name={req.met ? 'checkmark-circle' : 'ellipse-outline'}
                            size={16}
                            color={req.met ? '#4CAF50' : theme.colors.textTertiary}
                        />
                        <Text style={[
                            styles.requirementText,
                            { color: req.met ? theme.colors.textSecondary : theme.colors.textTertiary }
                        ]}>
                            {req.text}
                        </Text>
                    </View>
                ))}
            </View>
        );
    };

    const renderPasswordInput = (field, placeholder, value, onChangeText, showPassword, setShowPassword, ref) => (
        <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.colors.textPrimary }]}>
                {placeholder}
            </Text>
            <View style={[styles.inputWrapper, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                <TextInput
                    ref={ref}
                    style={[styles.textInput, { color: theme.colors.textPrimary }]}
                    value={value}
                    onChangeText={(text) => onChangeText(text, field)}
                    secureTextEntry={!showPassword}
                    placeholder={placeholder}
                    placeholderTextColor={theme.colors.textTertiary}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType={field === 'currentPassword' ? 'next' : field === 'newPassword' ? 'next' : 'done'}
                    onSubmitEditing={() => {
                        if (field === 'currentPassword') newPasswordRef.current?.focus();
                        else if (field === 'newPassword') confirmPasswordRef.current?.focus();
                    }}
                />
                <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => {
                        if (field === 'currentPassword') setShowCurrentPassword(!showCurrentPassword);
                        else if (field === 'newPassword') setShowNewPassword(!showNewPassword);
                        else setShowConfirmPassword(!showConfirmPassword);
                    }}
                >
                    <Ionicons
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color={theme.colors.textTertiary}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <StatusBar
                barStyle={theme.dark ? 'light-content' : 'dark-content'}
                backgroundColor={theme.colors.background}
            />

            {/* Header
            <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
                    {t('security.changePassword', 'Change Password')}
                </Text>
                <View style={styles.headerRight} />
            </View> */}

            {/* Content */}
            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* Info Card */}
                <View style={[styles.infoCard, { backgroundColor: theme.colors.surface }]}>
                    <Ionicons name="shield-checkmark" size={24} color={theme.colors.accent} />
                    <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                        {t('security.passwordChangeInfo', 'Ensure your new password is strong and unique to keep your account secure.')}
                    </Text>
                </View>

                {/* Current Password */}
                {renderPasswordInput(
                    'currentPassword',
                    'Current Password',
                    currentPassword,
                    handlePasswordInputChange,
                    showCurrentPassword,
                    setShowCurrentPassword,
                    currentPasswordRef
                )}

                {/* New Password */}
                {renderPasswordInput(
                    'newPassword',
                    'New Password',
                    newPassword,
                    handlePasswordInputChange,
                    showNewPassword,
                    setShowNewPassword,
                    newPasswordRef
                )}

                {/* Password Strength */}
                {newPassword.length > 0 && (
                    <View style={styles.strengthContainer}>
                        <Text style={[styles.strengthLabel, { color: theme.colors.textPrimary }]}>
                            Password Strength:
                        </Text>
                        {renderPasswordStrengthBar()}
                        {renderPasswordRequirements()}
                    </View>
                )}

                {/* Confirm Password */}
                {renderPasswordInput(
                    'confirmPassword',
                    'Confirm New Password',
                    confirmPassword,
                    handlePasswordInputChange,
                    showConfirmPassword,
                    setShowConfirmPassword,
                    confirmPasswordRef
                )}

                {/* Change Password Button */}
                <TouchableOpacity
                    style={[
                        styles.changeButton,
                        {
                            backgroundColor: theme.colors.accent,
                            opacity: changingPassword ? 0.6 : 1
                        }
                    ]}
                    onPress={handleChangePassword}
                    disabled={changingPassword}
                    activeOpacity={0.8}
                >
                    {changingPassword ? (
                        <ActivityIndicator size="small" color="white" />
                    ) : (
                        <>
                            <Ionicons name="key" size={20} color="white" />
                            <Text style={styles.changeButtonText}>
                                {t('security.changePasswordButton', 'Change Password')}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Security Tips */}
                <View style={[styles.tipsContainer, { backgroundColor: theme.colors.surface }]}>
                    <Text style={[styles.tipsTitle, { color: theme.colors.textPrimary }]}>
                        Security Tips:
                    </Text>
                    <View style={styles.tipItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                        <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                            Use a unique password that you don't use elsewhere
                        </Text>
                    </View>
                    <View style={styles.tipItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                        <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                            Consider using a password manager for better security
                        </Text>
                    </View>
                    <View style={styles.tipItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                        <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                            Enable two-factor authentication for additional security
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
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
        borderBottomWidth: 1,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    headerRight: {
        width: 40,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
    },
    infoText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 14,
        lineHeight: 20,
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 4,
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 12,
    },
    eyeButton: {
        padding: 8,
    },
    strengthContainer: {
        marginBottom: 20,
        padding: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        borderRadius: 12,
    },
    strengthLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    strengthBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    strengthBar: {
        flex: 1,
        flexDirection: 'row',
        height: 4,
        borderRadius: 2,
        overflow: 'hidden',
        marginRight: 12,
    },
    strengthSegment: {
        flex: 1,
        marginHorizontal: 1,
        borderRadius: 2,
    },
    strengthText: {
        fontSize: 12,
        fontWeight: '600',
        minWidth: 40,
        textAlign: 'center',
    },
    requirementsContainer: {
        marginTop: 8,
    },
    requirementsTitle: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
    },
    requirementItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    requirementText: {
        fontSize: 12,
        marginLeft: 8,
    },
    changeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        marginTop: 20,
        marginBottom: 24,
    },
    changeButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 8,
    },
    tipsContainer: {
        padding: 16,
        borderRadius: 12,
    },
    tipsTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    tipItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    tipText: {
        fontSize: 14,
        marginLeft: 8,
        flex: 1,
        lineHeight: 20,
    },
});

export default ChangePasswordScreen;
