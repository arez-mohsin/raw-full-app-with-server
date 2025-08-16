import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { hapticLight } from '../utils/HapticUtils';
import { LinearGradient } from 'expo-linear-gradient';

const ForgetPasswordGuideScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const { t } = useTranslation();

    const handleClose = () => {
        hapticLight();
        navigation.goBack();
    };

    return (
        <LinearGradient colors={['#1a1a1a', '#2a2a2a', '#1a1a1a']} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={handleClose}
                    >
                        <Ionicons name="close" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.title}>
                        {t('forgotPassword.passwordResetGuide', 'Password Reset Guide')}
                    </Text>
                    <View style={styles.placeholder} />
                </View>

                {/* Content */}
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* How It Works Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.iconContainer}>
                                <Ionicons name="help-circle" size={24} color="#FFD700" />
                            </View>
                            <Text style={styles.sectionTitle}>
                                {t('forgotPassword.howItWorks', 'How it works')}
                            </Text>
                        </View>

                        <View style={styles.infoItem}>
                            <View style={styles.bulletPoint}>
                                <Ionicons name="mail" size={16} color="#FFD700" />
                            </View>
                            <Text style={styles.infoText}>
                                {t('forgotPassword.enterEmailAssociated', 'Enter the email address associated with your account')}
                            </Text>
                        </View>

                        <View style={styles.infoItem}>
                            <View style={styles.bulletPoint}>
                                <Ionicons name="shield-checkmark" size={16} color="#FFD700" />
                            </View>
                            <Text style={styles.infoText}>
                                {t('forgotPassword.sendSecureResetLink', 'We\'ll send you a secure reset link via email')}
                            </Text>
                        </View>

                        <View style={styles.infoItem}>
                            <View style={styles.bulletPoint}>
                                <Ionicons name="link" size={16} color="#FFD700" />
                            </View>
                            <Text style={styles.infoText}>
                                {t('forgotPassword.clickLinkToCreatePassword', 'Click the link to create a new password')}
                            </Text>
                        </View>
                    </View>

                    {/* Security Features Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.iconContainer}>
                                <Ionicons name="lock-closed" size={24} color="#4CAF50" />
                            </View>
                            <Text style={styles.sectionTitle}>
                                {t('forgotPassword.securityFeatures', 'Security Features')}
                            </Text>
                        </View>

                        <View style={styles.infoItem}>
                            <View style={styles.bulletPoint}>
                                <Ionicons name="time" size={16} color="#4CAF50" />
                            </View>
                            <Text style={styles.infoText}>
                                {t('forgotPassword.resetLinkExpires', 'The reset link expires after 1 hour for security')}
                            </Text>
                        </View>

                        <View style={styles.infoItem}>
                            <View style={styles.bulletPoint}>
                                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                            </View>
                            <Text style={styles.infoText}>
                                {t('forgotPassword.verifyEmailBeforeSending', 'We verify your email exists in our data before sending reset links')}
                            </Text>
                        </View>

                        <View style={styles.infoItem}>
                            <View style={styles.bulletPoint}>
                                <Ionicons name="refresh" size={16} color="#4CAF50" />
                            </View>
                            <Text style={styles.infoText}>
                                {t('forgotPassword.requestNewLink', 'You can request a new link if needed')}
                            </Text>
                        </View>
                    </View>

                    {/* Important Notes Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.iconContainer}>
                                <Ionicons name="information-circle" size={24} color="#FF6B6B" />
                            </View>
                            <Text style={styles.sectionTitle}>
                                {t('forgotPassword.importantNotes', 'Important Notes')}
                            </Text>
                        </View>

                        <View style={styles.infoItem}>
                            <View style={styles.bulletPoint}>
                                <Ionicons name="search" size={16} color="#FF6B6B" />
                            </View>
                            <Text style={styles.infoText}>
                                {t('forgotPassword.checkSpamFolder', 'Check your spam/junk folder if you don\'t see the email')}
                            </Text>
                        </View>

                        <View style={styles.infoItem}>
                            <View style={styles.bulletPoint}>
                                <Ionicons name="time-outline" size={16} color="#FF6B6B" />
                            </View>
                            <Text style={styles.infoText}>
                                {t('forgotPassword.waitFewMinutes', 'Wait a few minutes for the email to arrive')}
                            </Text>
                        </View>

                        <View style={styles.infoItem}>
                            <View style={styles.bulletPoint}>
                                <Ionicons name="mail-unread" size={16} color="#FF6B6B" />
                            </View>
                            <Text style={styles.infoText}>
                                {t('forgotPassword.useSameEmail', 'Use the same email address you used to register')}
                            </Text>
                        </View>
                    </View>

                    {/* Troubleshooting Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.iconContainer}>
                                <Ionicons name="construct" size={24} color="#FFD700" />
                            </View>
                            <Text style={styles.sectionTitle}>
                                {t('forgotPassword.troubleshooting', 'Troubleshooting')}
                            </Text>
                        </View>

                        <View style={styles.infoItem}>
                            <View style={styles.bulletPoint}>
                                <Ionicons name="alert-circle" size={16} color="#FFD700" />
                            </View>
                            <Text style={styles.infoText}>
                                {t('forgotPassword.emailNotFound', 'If email not found, check spelling and try again')}
                            </Text>
                        </View>

                        <View style={styles.infoItem}>
                            <View style={styles.bulletPoint}>
                                <Ionicons name="refresh-circle" size={16} color="#FFD700" />
                            </View>
                            <Text style={styles.infoText}>
                                {t('forgotPassword.tooManyRequests', 'If too many requests, wait before trying again')}
                            </Text>
                        </View>
                    </View>
                </ScrollView>

                {/* Footer Button */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.gotItButton}
                        onPress={handleClose}
                    >
                        <Text style={styles.gotItButtonText}>
                            {t('forgotPassword.gotIt', 'Got it!')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    closeButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1,
        textAlign: 'center',
    },
    placeholder: {
        width: 40,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFD700',
        flex: 1,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
        paddingLeft: 56,
    },
    bulletPoint: {
        width: 24,
        alignItems: 'center',
        marginRight: 12,
        marginTop: 2,
    },
    infoText: {
        fontSize: 16,
        lineHeight: 24,
        color: '#ccc',
        flex: 1,
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    gotItButton: {
        backgroundColor: '#FFD700',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    gotItButtonText: {
        color: '#000',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default ForgetPasswordGuideScreen;
