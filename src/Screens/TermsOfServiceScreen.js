import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const TermsOfServiceScreen = ({ navigation, route }) => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const [hasAccepted, setHasAccepted] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Check if this is being shown during registration
    const isRegistrationFlow = route?.params?.isRegistrationFlow || false;
    const uid = route?.params?.uid;
    const email = route?.params?.email;

    const handleAcceptTerms = async () => {
        if (isRegistrationFlow && uid) {
            try {
                setIsSaving(true);

                // Update existing user document with terms acceptance
                const userRef = doc(db, "users", uid);
                await updateDoc(userRef, {
                    isTermsAccepted: true,
                    termsAcceptedAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });

                console.log('User document updated successfully with terms acceptance');

                // Navigate to email verification after accepting terms
                navigation.navigate("EmailVerification", {
                    email: email,
                    uid: uid,
                    isRegistrationFlow: true,
                });
            } catch (error) {
                console.error('Error updating user data:', error);
                Alert.alert(
                    t('terms.error.title', 'Error'),
                    t('terms.error.updateFailed', 'Failed to update user data. Please try again.'),
                    [{ text: t('common.ok', 'OK') }]
                );
            } finally {
                setIsSaving(false);
            }
        } else {
            // Just go back if viewing from elsewhere
            navigation.goBack();
        }
    };

    const handleDeclineTerms = () => {
        if (isRegistrationFlow) {
            Alert.alert(
                t('terms.decline.title', 'Terms Required'),
                t('terms.decline.message', 'You must accept the Terms of Service to continue. Your account has been created but cannot be activated without accepting these terms.'),
                [
                    {
                        text: t('terms.decline.reviewAgain', 'Review Terms Again'),
                        style: "default",
                        onPress: () => {
                            // Just close the alert, user can continue reading
                        }
                    },
                    {
                        text: t('terms.decline.contactSupport', 'Contact Support'),
                        style: "default",
                        onPress: () => {
                            // Open email to support
                            Linking.openURL('mailto:rawchain01@gmail.com?subject=Terms of Service Help&body=I need help understanding the Terms of Service.');
                        }
                    },
                    {
                        text: t('common.cancel', 'Cancel'),
                        style: "cancel"
                    }
                ]
            );
        } else {
            navigation.goBack();
        }
    };

    return (
        <LinearGradient
            colors={['#1a1a1a', '#2a2a2a', '#1a1a1a']}
            style={styles.container}
        >
            <View style={styles.header}>
                {!isRegistrationFlow ? (
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 24 }} />
                )}
                <Text style={styles.headerTitle}>{t('terms.title', 'Terms of Service')}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <View style={styles.content}>
                    <Text style={styles.lastUpdated}>{t('terms.lastUpdated', 'Last Updated: January 15, 2024')}</Text>

                    <View style={styles.importantNotice}>
                        <Text style={styles.importantNoticeText}>
                            {t('terms.importantNotice', '⚠️ IMPORTANT: This app is for educational and simulation purposes only. No real cryptocurrency mining occurs, and no real financial value is generated.')}
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('terms.section1.title', '1. Acceptance of Terms')}</Text>
                        <Text style={styles.paragraph}>
                            {t('terms.section1.content', 'By accessing and using the RAW MINER mobile application ("App"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.')}
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('terms.section2.title', '2. Description of Service')}</Text>
                        <Text style={styles.paragraph}>
                            {t('terms.section2.content', 'RAW MINER is a mobile application that simulates cryptocurrency mining activities for educational and entertainment purposes. The App provides users with a virtual mining experience, including simulated mining operations, virtual coin generation, and educational content about blockchain technology.')}
                        </Text>
                        <Text style={styles.paragraph}>
                            <Text style={styles.highlight}>{t('terms.section2.important', 'Important:')}</Text> {t('terms.section2.disclaimer', 'This App does NOT perform actual cryptocurrency mining. All mining activities are simulations, and no real cryptocurrency is generated, stored, or transferred.')}
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('terms.section3.title', '3. Virtual Currency and Assets')}</Text>
                        <Text style={styles.paragraph}>
                            {t('terms.section3.content', 'The App features virtual coins and mining rewards that have no real-world monetary value. These virtual assets are:')}
                        </Text>
                        <Text style={styles.bulletPoint}>• {t('terms.section3.bullet1', 'Purely for entertainment and educational purposes')}</Text>
                        <Text style={styles.bulletPoint}>• {t('terms.section3.bullet2', 'Not exchangeable for real money or cryptocurrency')}</Text>
                        <Text style={styles.bulletPoint}>• {t('terms.section3.bullet3', 'Not backed by any real assets or financial instruments')}</Text>
                        <Text style={styles.bulletPoint}>• {t('terms.section3.bullet4', 'Subject to change or removal at any time')}</Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('terms.section4.title', '4. Future Cryptocurrency Listing')}</Text>
                        <Text style={styles.paragraph}>
                            {t('terms.section4.content', 'RAW MINER may introduce a real cryptocurrency token in the future. However, this App currently operates as a simulation and educational platform. Any future cryptocurrency offerings will be subject to:')}
                        </Text>
                        <Text style={styles.bulletPoint}>• {t('terms.section4.bullet1', 'Separate terms and conditions')}</Text>
                        <Text style={styles.bulletPoint}>• {t('terms.section4.bullet2', 'Regulatory compliance requirements')}</Text>
                        <Text style={styles.bulletPoint}>• {t('terms.section4.bullet3', 'Additional user verification processes')}</Text>
                        <Text style={styles.bulletPoint}>• {t('terms.section4.bullet4', 'Separate legal documentation')}</Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('terms.section5.title', '5. User Accounts and Registration')}</Text>
                        <Text style={styles.paragraph}>
                            {t('terms.section5.content', 'To access certain features of the App, you must create an account. You are responsible for:')}
                        </Text>
                        <Text style={styles.bulletPoint}>• {t('terms.section5.bullet1', 'Maintaining the confidentiality of your account credentials')}</Text>
                        <Text style={styles.bulletPoint}>• {t('terms.section5.bullet2', 'All activities that occur under your account')}</Text>
                        <Text style={styles.bulletPoint}>• {t('terms.section5.bullet3', 'Notifying us immediately of any unauthorized use')}</Text>
                        <Text style={styles.bulletPoint}>• {t('terms.section5.bullet4', 'Providing accurate and complete information during registration')}</Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('terms.section6.title', '6. Acceptable Use Policy')}</Text>
                        <Text style={styles.paragraph}>
                            {t('terms.section6.content', 'You agree not to use the App to:')}
                        </Text>
                        <Text style={styles.bulletPoint}>• {t('terms.section6.bullet1', 'Violate any applicable laws or regulations')}</Text>
                        <Text style={styles.bulletPoint}>• {t('terms.section6.bullet2', 'Infringe upon the rights of others')}</Text>
                        <Text style={styles.bulletPoint}>• {t('terms.section6.bullet3', 'Transmit harmful, offensive, or inappropriate content')}</Text>
                        <Text style={styles.bulletPoint}>• {t('terms.section6.bullet4', 'Attempt to gain unauthorized access to the App or other users\' accounts')}</Text>
                        <Text style={styles.bulletPoint}>• {t('terms.section6.bullet5', 'Interfere with the proper functioning of the App')}</Text>
                        <Text style={styles.bulletPoint}>• {t('terms.section6.bullet6', 'Use automated systems or bots to access the App')}</Text>
                        <Text style={styles.bulletPoint}>• {t('terms.section6.bullet7', 'Attempt to manipulate or exploit the virtual mining system')}</Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('terms.section7.title', '7. Educational and Simulation Disclaimer')}</Text>
                        <Text style={styles.paragraph}>
                            <Text style={styles.highlight}>{t('terms.section7.critical', 'CRITICAL DISCLAIMER:')}</Text> {t('terms.section7.content', 'This App is designed solely for educational and entertainment purposes. Users acknowledge that:')}
                        </Text>
                        <Text style={styles.bulletPoint}>• {t('terms.section7.bullet1', 'No real cryptocurrency mining occurs within the App')}</Text>
                        <Text style={styles.bulletPoint}>• {t('terms.section7.bullet2', 'Virtual coins and rewards have no real-world value')}</Text>
                        <Text style={styles.bulletPoint}>• {t('terms.section7.bullet3', 'The App does not provide financial advice or investment opportunities')}</Text>
                        <Text style={styles.bulletPoint}>• {t('terms.section7.bullet4', 'Mining simulations are not indicative of real mining profitability')}</Text>
                        <Text style={styles.bulletPoint}>• {t('terms.section7.bullet5', 'The App should not be used as a learning tool for real cryptocurrency mining')}</Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('terms.section8.title', '8. Privacy and Data Protection')}</Text>
                        <Text style={styles.paragraph}>
                            {t('terms.section8.content', 'Your privacy is important to us. Our Privacy Policy governs the collection, use, and protection of your personal information. By using the App, you consent to the collection and use of information as outlined in our Privacy Policy.')}
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('terms.section9.title', '9. Intellectual Property Rights')}</Text>
                        <Text style={styles.paragraph}>
                            {t('terms.section9.content', 'The App and its original content, features, and functionality are owned by RAW and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws. The App name "RAW MINER" and associated branding are trademarks of RAW.')}
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('terms.section10.title', '10. Limitation of Liability')}</Text>
                        <Text style={styles.paragraph}>
                            <Text style={styles.highlight}>{t('terms.section10.maximum', 'TO THE MAXIMUM EXTENT PERMITTED BY LAW:')}</Text>
                        </Text>
                        <Text style={styles.paragraph}>
                            {t('terms.section10.content', 'RAW shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, use, goodwill, or other intangible losses resulting from your use of the App.')}
                        </Text>
                        <Text style={styles.paragraph}>
                            {t('terms.section10.disclaimer', 'The App is provided "as is" and "as available" without any warranties of any kind, either express or implied.')}
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('terms.section11.title', '11. Indemnification')}</Text>
                        <Text style={styles.paragraph}>
                            {t('terms.section11.content', 'You agree to defend, indemnify, and hold harmless RAW, its officers, directors, employees, and agents from and against any claims, damages, obligations, losses, liabilities, costs, or debt arising from your use of the App or violation of these Terms.')}
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('terms.section12.title', '12. Account Termination')}</Text>
                        <Text style={styles.paragraph}>
                            {t('terms.section12.content', 'We may terminate or suspend your account and access to the App immediately, without prior notice, for any reason, including but not limited to:')}
                        </Text>
                        <Text style={styles.bulletPoint}>• {t('terms.section12.bullet1', 'Violation of these Terms of Service')}</Text>
                        <Text style={styles.bulletPoint}>• {t('terms.section12.bullet2', 'Fraudulent or illegal activities')}</Text>
                        <Text style={styles.bulletPoint}>• {t('terms.section12.bullet3', 'Attempts to manipulate the App\'s systems')}</Text>
                        <Text style={styles.bulletPoint}>• {t('terms.section12.bullet4', 'Inappropriate or harmful behavior')}</Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('terms.section13.title', '13. Changes to Terms')}</Text>
                        <Text style={styles.paragraph}>
                            {t('terms.section13.content', 'We reserve the right to modify these Terms at any time. Material changes will be communicated to users through the App or via email. Continued use of the App after changes constitutes acceptance of the new Terms.')}
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('terms.section14.title', '14. Governing Law and Jurisdiction')}</Text>
                        <Text style={styles.paragraph}>
                            {t('terms.section14.content', 'These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which RAW operates. Any disputes arising from these Terms or your use of the App shall be resolved in the appropriate courts of that jurisdiction.')}
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('terms.section15.title', '15. Contact Information')}</Text>
                        <Text style={styles.paragraph}>
                            {t('terms.section15.content', 'If you have any questions about these Terms of Service, please contact us at:')}
                        </Text>
                        <Text style={styles.contactInfo}>{t('terms.section15.email', 'Email: rawchain01@gmail.com')}</Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('terms.section16.title', '16. Acknowledgment and Consent')}</Text>
                        <Text style={styles.paragraph}>
                            {t('terms.section16.content', 'By using the RAW MINER App, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. You also acknowledge that this App is for educational and entertainment purposes only and does not provide real cryptocurrency mining services.')}
                        </Text>
                    </View>

                    <View style={styles.legalNotice}>
                        <Text style={styles.legalNoticeTitle}>{t('terms.legalNotice.title', 'LEGAL NOTICE')}</Text>
                        <Text style={styles.legalNoticeText}>
                            {t('terms.legalNotice.content', 'This application is a simulation and educational tool. No real cryptocurrency mining, trading, or financial transactions occur. Virtual assets have no real-world value. This App is not intended as financial advice or investment guidance.')}
                        </Text>
                    </View>

                    {isRegistrationFlow && (
                        <View style={styles.acceptanceSection}>
                            <View style={styles.welcomeMessage}>
                                <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
                                <Text style={styles.welcomeTitle}>{t('terms.acceptance.welcomeTitle', 'Almost Done! 🎉')}</Text>
                                <Text style={styles.welcomeText}>
                                    {t('terms.acceptance.welcomeText', 'Your account has been created successfully! Accept the terms and verify your email to start mining.')}
                                </Text>
                            </View>

                            <View style={styles.termsSummary}>
                                <Text style={styles.termsSummaryTitle}>{t('terms.acceptance.summaryTitle', '📋 What You\'re Agreeing To:')}</Text>
                                <View style={styles.termsSummaryItem}>
                                    <Ionicons name="shield-checkmark" size={16} color="#4CAF50" />
                                    <Text style={styles.termsSummaryText}>{t('terms.acceptance.summary1', 'Educational simulation app (no real money)')}</Text>
                                </View>
                                <View style={styles.termsSummaryItem}>
                                    <Ionicons name="shield-checkmark" size={16} color="#4CAF50" />
                                    <Text style={styles.termsSummaryText}>{t('terms.acceptance.summary2', 'Virtual mining experience for learning')}</Text>
                                </View>
                                <View style={styles.termsSummaryItem}>
                                    <Ionicons name="shield-checkmark" size={16} color="#4CAF50" />
                                    <Text style={styles.termsSummaryText}>{t('terms.acceptance.summary3', 'Safe and secure platform')}</Text>
                                </View>
                            </View>

                            <View style={styles.emailVerificationInfo}>
                                <Text style={styles.emailVerificationTitle}>{t('terms.emailVerification.title', '📧 Next Step: Email Verification')}</Text>
                                <Text style={styles.emailVerificationText}>
                                    {t('terms.emailVerification.description', 'After accepting terms, you\'ll need to verify your email address ({email}) to activate your account.', { email })}
                                </Text>
                                <View style={styles.verificationSteps}>
                                    <View style={styles.verificationStep}>
                                        <Ionicons name="mail" size={16} color="#FFD700" />
                                        <Text style={styles.verificationStepText}>{t('terms.emailVerification.step1', 'Check your email for verification link')}</Text>
                                    </View>
                                    <View style={styles.verificationStep}>
                                        <Ionicons name="link" size={16} color="#FFD700" />
                                        <Text style={styles.verificationStepText}>{t('terms.emailVerification.step2', 'Click the verification link in the email')}</Text>
                                    </View>
                                    <View style={styles.verificationStep}>
                                        <Ionicons name="checkmark-circle" size={16} color="#FFD700" />
                                        <Text style={styles.verificationStepText}>{t('terms.emailVerification.step3', 'Return to app to complete setup')}</Text>
                                    </View>
                                </View>
                                <View style={styles.verificationNote}>
                                    <Ionicons name="information-circle" size={16} color="#FFD700" />
                                    <Text style={styles.verificationNoteText}>
                                        {t('terms.emailVerification.note', 'Can\'t find the email? Check your spam folder or contact support.')}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.acceptanceContainer}>
                                <TouchableOpacity
                                    style={[styles.acceptanceCheckbox, hasAccepted && styles.acceptanceCheckboxActive]}
                                    onPress={() => setHasAccepted(!hasAccepted)}
                                >
                                    <Ionicons
                                        name={hasAccepted ? "checkmark-circle" : "ellipse-outline"}
                                        size={28}
                                        color={hasAccepted ? "#4CAF50" : "#888"}
                                    />
                                    <Text style={[styles.acceptanceCheckboxText, hasAccepted && styles.acceptanceCheckboxTextActive]}>
                                        {t('terms.acceptance.checkboxText', 'I understand and agree to the Terms of Service')}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.actionButtons}>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.declineButton]}
                                    onPress={handleDeclineTerms}
                                >
                                    <Ionicons name="close" size={20} color="#fff" />
                                    <Text style={styles.declineButtonText}>{t('terms.acceptance.cancel', 'Cancel')}</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.actionButton, styles.continueButton, !hasAccepted && styles.continueButtonDisabled]}
                                    onPress={handleAcceptTerms}
                                    disabled={!hasAccepted || isSaving}
                                >
                                    {isSaving ? (
                                        <ActivityIndicator color="#fff" size="small" />
                                    ) : (
                                        <>
                                            <Ionicons name="checkmark-circle" size={20} color="#fff" />
                                            <Text style={styles.continueButtonText}>{t('terms.acceptance.continue', 'Accept & Continue')}</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>

                            <View style={styles.helpText}>
                                <Text style={styles.helpTextContent}>
                                    {t('terms.acceptance.helpText', '💡 Need help? You can always review the full terms above or contact support.')}
                                </Text>
                            </View>
                        </View>
                    )}
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
        paddingHorizontal: 15,
        paddingTop: 60,
        paddingBottom: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 10,
        paddingBottom: 40,
    },
    content: {
        backgroundColor: '#2a2a2a',
        borderRadius: 12,
        padding: 20,
    },
    lastUpdated: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        marginBottom: 20,
        fontStyle: 'italic',
    },
    importantNotice: {
        backgroundColor: '#FF6B35',
        borderRadius: 8,
        padding: 16,
        marginBottom: 24,
        borderLeftWidth: 4,
        borderLeftColor: '#FFD700',
    },
    importantNoticeText: {
        fontSize: 14,
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
        lineHeight: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFD700',
        marginBottom: 8,
    },
    paragraph: {
        fontSize: 14,
        color: '#ccc',
        lineHeight: 20,
        marginBottom: 8,
    },
    highlight: {
        color: '#FFD700',
        fontWeight: 'bold',
    },
    bulletPoint: {
        fontSize: 14,
        color: '#ccc',
        lineHeight: 20,
        marginLeft: 20,
        marginBottom: 4,
    },
    contactInfo: {
        fontSize: 14,
        color: '#FFD700',
        fontWeight: 'bold',
        marginTop: 8,
    },
    legalNotice: {
        backgroundColor: '#1a1a1a',
        borderRadius: 8,
        padding: 16,
        marginTop: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#FFD700',
    },
    legalNoticeTitle: {
        fontSize: 14,
        color: '#FFD700',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    legalNoticeText: {
        fontSize: 12,
        color: '#FFD700',
        fontStyle: 'italic',
        textAlign: 'center',
        lineHeight: 16,
    },
    acceptanceSection: {
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        padding: 15,
        marginTop: 24,
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    welcomeMessage: {
        alignItems: 'center',
        marginBottom: 24,
    },
    welcomeTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4CAF50',
        textAlign: 'center',
        marginTop: 12,
        marginBottom: 8,
    },
    welcomeText: {
        fontSize: 16,
        color: '#ccc',
        textAlign: 'center',
        lineHeight: 22,
    },
    termsSummary: {
        backgroundColor: '#2a2a2a',
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
    },
    termsSummaryTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFD700',
        marginBottom: 16,
        textAlign: 'center',
    },
    termsSummaryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    termsSummaryText: {
        fontSize: 14,
        color: '#ccc',
        marginLeft: 12,
        flex: 1,
        lineHeight: 20,
    },
    emailVerificationInfo: {
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
        borderLeftWidth: 3,
        borderLeftColor: '#FFD700',
    },
    emailVerificationTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFD700',
        marginBottom: 12,
        textAlign: 'center',
    },
    emailVerificationText: {
        fontSize: 14,
        color: '#ccc',
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 20,
    },
    verificationSteps: {
        marginBottom: 16,
    },
    verificationStep: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    verificationStepText: {
        fontSize: 13,
        color: '#ccc',
        marginLeft: 12,
        flex: 1,
        lineHeight: 18,
    },
    verificationNote: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 107, 53, 0.1)',
        borderRadius: 8,
        padding: 12,
        borderLeftWidth: 2,
        borderLeftColor: '#FF6B35',
    },
    verificationNoteText: {
        fontSize: 12,
        color: '#FFD700',
        marginLeft: 8,
        flex: 1,
        fontStyle: 'italic',
        lineHeight: 16,
    },
    acceptanceContainer: {
        marginBottom: 24,
    },
    acceptanceCheckbox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#2a2a2a',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#888',
    },
    acceptanceCheckboxActive: {
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
    },
    acceptanceCheckboxText: {
        fontSize: 16,
        color: '#888',
        marginLeft: 16,
        flex: 1,
        fontWeight: '500',
    },
    acceptanceCheckboxTextActive: {
        color: '#4CAF50',
        fontWeight: 'bold',
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 16,
    },
    actionButton: {
        flex: 1,
        paddingVertical: 18,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    declineButton: {
        backgroundColor: '#6c757d',
        borderWidth: 1,
        borderColor: '#495057',
    },
    declineButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    continueButton: {
        backgroundColor: '#4CAF50',
        borderWidth: 1,
        borderColor: '#45a049',
    },
    continueButtonDisabled: {
        backgroundColor: '#6c757d',
        borderColor: '#495057',
    },
    continueButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    helpText: {
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        borderRadius: 8,
        padding: 16,
        marginTop: 16,
        borderLeftWidth: 3,
        borderLeftColor: '#FFD700',
    },
    helpTextContent: {
        fontSize: 12,
        color: '#FFD700',
        textAlign: 'center',
        fontStyle: 'italic',
        lineHeight: 16,
    },
});

export default TermsOfServiceScreen;
