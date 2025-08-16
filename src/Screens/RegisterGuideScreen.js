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

const RegisterGuideScreen = ({ navigation }) => {
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
                        {t('register.guideTitle', 'Registration Guide')}
                    </Text>
                    <View style={styles.placeholder} />
                </View>

                {/* Content */}
                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Personal Information Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.iconContainer}>
                                <Ionicons name="person-circle" size={24} color="#FFD700" />
                            </View>
                            <Text style={styles.sectionTitle}>
                                {t('register.personalInfo', 'Personal Information')}
                            </Text>
                        </View>

                        <View style={styles.infoItem}>
                            <View style={styles.bulletPoint}>
                                <Ionicons name="person" size={16} color="#FFD700" />
                            </View>
                            <Text style={styles.infoText}>
                                {t('register.firstNameGuide', 'First Name & Last Name: Use your real name as it appears on official documents')}
                            </Text>
                        </View>

                        <View style={styles.infoItem}>
                            <View style={styles.bulletPoint}>
                                <Ionicons name="at" size={16} color="#FFD700" />
                            </View>
                            <Text style={styles.infoText}>
                                {t('register.usernameGuide', 'Username: 3-20 characters, letters, numbers, and underscores only. Will be converted to lowercase.')}
                            </Text>
                        </View>
                    </View>

                    {/* Account Security Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.iconContainer}>
                                <Ionicons name="shield-checkmark" size={24} color="#FFD700" />
                            </View>
                            <Text style={styles.sectionTitle}>
                                {t('register.accountSecurity', 'Account Security')}
                            </Text>
                        </View>

                        <View style={styles.infoItem}>
                            <View style={styles.bulletPoint}>
                                <Ionicons name="mail" size={16} color="#FFD700" />
                            </View>
                            <Text style={styles.infoText}>
                                {t('register.emailGuide', 'Email: Must be a valid email address. Used for account verification and password recovery.')}
                            </Text>
                        </View>

                        <View style={styles.infoItem}>
                            <View style={styles.bulletPoint}>
                                <Ionicons name="lock-closed" size={16} color="#FFD700" />
                            </View>
                            <Text style={styles.infoText}>
                                {t('register.passwordGuide', 'Password: Minimum 8 characters with uppercase, lowercase, number, and special character.')}
                            </Text>
                        </View>
                    </View>

                    {/* Invite Code Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.iconContainer}>
                                <Ionicons name="gift" size={24} color="#FFD700" />
                            </View>
                            <Text style={styles.sectionTitle}>
                                {t('register.inviteCode', 'Invite Code')}
                            </Text>
                        </View>

                        <View style={styles.infoItem}>
                            <View style={styles.bulletPoint}>
                                <Ionicons name="star" size={16} color="#FFD700" />
                            </View>
                            <Text style={styles.infoText}>
                                {t('register.inviteCodeGuide', 'Optional: Enter an invite code from a friend to get bonus coins and unlock referral features.')}
                            </Text>
                        </View>
                    </View>

                    {/* Important Notes Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.iconContainer}>
                                <Ionicons name="information-circle" size={24} color="#4CAF50" />
                            </View>
                            <Text style={styles.sectionTitle}>
                                {t('register.importantNotes', 'Important Notes')}
                            </Text>
                        </View>

                        <View style={styles.infoItem}>
                            <View style={styles.bulletPoint}>
                                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                            </View>
                            <Text style={styles.infoText}>
                                {t('register.encryptionNote', 'All information is encrypted and securely stored')}
                            </Text>
                        </View>

                        <View style={styles.infoItem}>
                            <View style={styles.bulletPoint}>
                                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                            </View>
                            <Text style={styles.infoText}>
                                {t('register.verificationNote', 'Email verification is required to access the app')}
                            </Text>
                        </View>

                        <View style={styles.infoItem}>
                            <View style={styles.bulletPoint}>
                                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                            </View>
                            <Text style={styles.infoText}>
                                {t('register.uniquenessNote', 'Username and email must be unique')}
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
                            {t('register.gotIt', 'Got it!')}
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

export default RegisterGuideScreen;
