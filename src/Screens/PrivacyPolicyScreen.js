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

const PrivacyPolicyScreen = ({ navigation }) => {
    return (
        <LinearGradient
            colors={['#1a1a1a', '#2a2a2a', '#1a1a1a']}
            style={styles.container}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Privacy Policy</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <View style={styles.content}>
                    <Text style={styles.lastUpdated}>Last Updated: January 1, 2024</Text>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>1. Introduction</Text>
                        <Text style={styles.paragraph}>
                            CryptoMiner ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>2. Information We Collect</Text>
                        <Text style={styles.subsectionTitle}>Personal Information</Text>
                        <Text style={styles.paragraph}>
                            We may collect personal information that you voluntarily provide to us when you:{'\n'}
                            • Create an account{'\n'}
                            • Complete your profile{'\n'}
                            • Contact our support team{'\n'}
                            • Participate in surveys or promotions
                        </Text>

                        <Text style={styles.subsectionTitle}>Device Information</Text>
                        <Text style={styles.paragraph}>
                            We automatically collect certain information about your device, including:{'\n'}
                            • Device type and model{'\n'}
                            • Operating system version{'\n'}
                            • App version{'\n'}
                            • IP address{'\n'}
                            • Device identifiers
                        </Text>

                        <Text style={styles.subsectionTitle}>Usage Information</Text>
                        <Text style={styles.paragraph}>
                            We collect information about how you use our app, including:{'\n'}
                            • Features you access{'\n'}
                            • Time spent in the app{'\n'}
                            • Mining activities{'\n'}
                            • App performance data
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
                        <Text style={styles.paragraph}>
                            We use the information we collect to:{'\n'}
                            • Provide and maintain our services{'\n'}
                            • Process your transactions{'\n'}
                            • Send you notifications and updates{'\n'}
                            • Improve our app and user experience{'\n'}
                            • Provide customer support{'\n'}
                            • Ensure security and prevent fraud{'\n'}
                            • Comply with legal obligations
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>4. Information Sharing</Text>
                        <Text style={styles.paragraph}>
                            We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except in the following circumstances:{'\n'}
                            • With your explicit consent{'\n'}
                            • To comply with legal obligations{'\n'}
                            • To protect our rights and safety{'\n'}
                            • With service providers who assist us in operating our app
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>5. Data Security</Text>
                        <Text style={styles.paragraph}>
                            We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>6. Data Retention</Text>
                        <Text style={styles.paragraph}>
                            We retain your personal information for as long as necessary to provide our services and comply with legal obligations. When we no longer need your information, we will securely delete or anonymize it.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>7. Your Rights</Text>
                        <Text style={styles.paragraph}>
                            You have the right to:{'\n'}
                            • Access your personal information{'\n'}
                            • Correct inaccurate information{'\n'}
                            • Request deletion of your information{'\n'}
                            • Object to our processing of your data{'\n'}
                            • Request data portability{'\n'}
                            • Withdraw consent at any time
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>8. Cookies and Tracking</Text>
                        <Text style={styles.paragraph}>
                            Our app may use cookies and similar tracking technologies to enhance your experience. You can control cookie settings through your device settings, but disabling cookies may affect app functionality.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>9. Third-Party Services</Text>
                        <Text style={styles.paragraph}>
                            Our app may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to review their privacy policies.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>10. Children's Privacy</Text>
                        <Text style={styles.paragraph}>
                            Our app is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent and believe your child has provided us with personal information, please contact us.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>11. International Transfers</Text>
                        <Text style={styles.paragraph}>
                            Your information may be transferred to and processed in countries other than your own. We ensure that such transfers comply with applicable data protection laws.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>12. Changes to This Policy</Text>
                        <Text style={styles.paragraph}>
                            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy in the app and updating the "Last Updated" date.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>13. Contact Us</Text>
                        <Text style={styles.paragraph}>
                            If you have any questions about this Privacy Policy, please contact us at:{'\n'}
                            Email: privacy@cryptominer.com{'\n'}
                            Address: [Company Address]{'\n'}
                            Phone: [Company Phone]
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>14. California Privacy Rights</Text>
                        <Text style={styles.paragraph}>
                            California residents have additional rights under the California Consumer Privacy Act (CCPA). If you are a California resident, you may request information about our data collection and sharing practices.
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>15. GDPR Compliance</Text>
                        <Text style={styles.paragraph}>
                            If you are located in the European Union, you have additional rights under the General Data Protection Regulation (GDPR). We are committed to complying with GDPR requirements.
                        </Text>
                    </View>

                    <View style={styles.legalNotice}>
                        <Text style={styles.legalNoticeText}>
                            By using our app, you acknowledge that you have read and understood this Privacy Policy and agree to our collection and use of your information as described herein.
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
    subsectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 12,
        marginBottom: 6,
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

export default PrivacyPolicyScreen;
