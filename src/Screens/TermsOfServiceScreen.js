import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const TermsOfServiceScreen = ({ navigation }) => {
    return (
        <LinearGradient
            colors={['#1a1a1a', '#2a2a2a', '#1a1a1a']}
            style={styles.container}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Terms of Service</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <View style={styles.content}>
                    <Text style={styles.lastUpdated}>Last Updated: January 1, 2024</Text>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
                        <Text style={styles.paragraph}>
                            By accessing and using the CryptoMiner mobile application ("App"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>2. Description of Service</Text>
                        <Text style={styles.paragraph}>
                            CryptoMiner is a cryptocurrency mining simulation application that allows users to learn about blockchain technology and cryptocurrency mining through educational content and simulated mining activities. This is not a real cryptocurrency mining application and does not provide actual mining rewards.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>3. User Accounts</Text>
                        <Text style={styles.paragraph}>
                            To use certain features of the App, you must create an account. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>4. User Conduct</Text>
                        <Text style={styles.paragraph}>
                            You agree not to use the App to:{'\n'}
                            • Violate any applicable laws or regulations{'\n'}
                            • Infringe upon the rights of others{'\n'}
                            • Transmit harmful, offensive, or inappropriate content{'\n'}
                            • Attempt to gain unauthorized access to the App{'\n'}
                            • Interfere with the proper functioning of the App
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>5. Privacy Policy</Text>
                        <Text style={styles.paragraph}>
                            Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the App, to understand our practices regarding the collection and use of your personal information.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>6. Intellectual Property</Text>
                        <Text style={styles.paragraph}>
                            The App and its original content, features, and functionality are and will remain the exclusive property of CryptoMiner and its licensors. The App is protected by copyright, trademark, and other laws.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>7. Disclaimers</Text>
                        <Text style={styles.paragraph}>
                            THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>8. Limitation of Liability</Text>
                        <Text style={styles.paragraph}>
                            IN NO EVENT SHALL CRYPTOMINER BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>9. Indemnification</Text>
                        <Text style={styles.paragraph}>
                            You agree to defend, indemnify, and hold harmless CryptoMiner and its officers, directors, employees, and agents from and against any claims, damages, obligations, losses, liabilities, costs, or debt arising from your use of the App.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>10. Termination</Text>
                        <Text style={styles.paragraph}>
                            We may terminate or suspend your account and bar access to the App immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>11. Governing Law</Text>
                        <Text style={styles.paragraph}>
                            These Terms shall be interpreted and governed by the laws of the jurisdiction in which CryptoMiner operates, without regard to its conflict of law provisions.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>12. Changes to Terms</Text>
                        <Text style={styles.paragraph}>
                            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>13. Contact Information</Text>
                        <Text style={styles.paragraph}>
                            If you have any questions about these Terms of Service, please contact us at:{'\n'}
                            Email: legal@cryptominer.com{'\n'}
                            Address: [Company Address]{'\n'}
                            Phone: [Company Phone]
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>14. Acknowledgment</Text>
                        <Text style={styles.paragraph}>
                            By using the CryptoMiner App, you acknowledge that you have read these Terms of Service, understand them, and agree to be bound by their terms and conditions.
                        </Text>
                    </View>

                    <View style={styles.legalNotice}>
                        <Text style={styles.legalNoticeText}>
                            This is a simulation app for educational purposes only. No real cryptocurrency mining or financial transactions occur within this application.
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
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
    },
    legalNotice: {
        backgroundColor: '#1a1a1a',
        borderRadius: 8,
        padding: 16,
        marginTop: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#FFD700',
    },
    legalNoticeText: {
        fontSize: 12,
        color: '#FFD700',
        fontStyle: 'italic',
        textAlign: 'center',
    },
});

export default TermsOfServiceScreen;
