import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const HelpSupportScreen = ({ navigation }) => {
    const [expandedFAQ, setExpandedFAQ] = useState(null);

    const faqData = [
        {
            id: 1,
            question: 'How does crypto mining work?',
            answer: 'Crypto mining is the process of validating transactions and adding them to the blockchain. Our app simulates this process and rewards users with cryptocurrency tokens for their participation.',
        },
        {
            id: 2,
            question: 'How do I withdraw my earnings?',
            answer: 'You can withdraw your earnings once you reach the minimum withdrawal threshold. Go to the Wallet screen and tap the "Withdraw" button to transfer funds to your external wallet.',
        },
        {
            id: 3,
            question: 'What is the minimum withdrawal amount?',
            answer: 'The minimum withdrawal amount is 0.001 BTC or equivalent in other supported cryptocurrencies. This helps cover network transaction fees.',
        },
        {
            id: 4,
            question: 'How secure is my account?',
            answer: 'We use industry-standard encryption and security measures to protect your account. We recommend enabling two-factor authentication for additional security.',
        },
        {
            id: 5,
            question: 'Can I mine multiple cryptocurrencies?',
            answer: 'Currently, our app supports Bitcoin mining simulation. We plan to add support for other cryptocurrencies in future updates.',
        },
        {
            id: 6,
            question: 'How often are rewards distributed?',
            answer: 'Rewards are calculated and distributed every 24 hours. You can check your mining progress in the Home screen.',
        },
    ];

    const handleFAQToggle = (id) => {
        setExpandedFAQ(expandedFAQ === id ? null : id);
    };

    const handleContactSupport = () => {
        Linking.openURL('mailto:support@cryptominer.com');
    };

    const handleLiveChat = () => {
        alert('Live chat feature coming soon!');
    };

    const handleReportBug = () => {
        Linking.openURL('mailto:bugs@cryptominer.com?subject=Bug Report');
    };

    return (
        <LinearGradient
            colors={['#1a1a1a', '#2a2a2a', '#1a1a1a']}
            style={styles.container}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Help & Support</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Get Help</Text>
                    <View style={styles.quickActions}>
                        <TouchableOpacity style={styles.actionCard} onPress={handleContactSupport}>
                            <View style={styles.actionIcon}>
                                <Ionicons name="mail" size={24} color="#FFD700" />
                            </View>
                            <Text style={styles.actionTitle}>Email Support</Text>
                            <Text style={styles.actionSubtitle}>Get help via email</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionCard} onPress={handleLiveChat}>
                            <View style={styles.actionIcon}>
                                <Ionicons name="chatbubbles" size={24} color="#FFD700" />
                            </View>
                            <Text style={styles.actionTitle}>Live Chat</Text>
                            <Text style={styles.actionSubtitle}>Chat with support</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionCard} onPress={handleReportBug}>
                            <View style={styles.actionIcon}>
                                <Ionicons name="bug" size={24} color="#FFD700" />
                            </View>
                            <Text style={styles.actionTitle}>Report Bug</Text>
                            <Text style={styles.actionSubtitle}>Report an issue</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* FAQ Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
                    <View style={styles.faqContainer}>
                        {faqData.map((item) => (
                            <View key={item.id} style={styles.faqItem}>
                                <TouchableOpacity
                                    style={styles.faqQuestion}
                                    onPress={() => handleFAQToggle(item.id)}
                                >
                                    <Text style={styles.faqQuestionText}>{item.question}</Text>
                                    <Ionicons
                                        name={expandedFAQ === item.id ? 'chevron-up' : 'chevron-down'}
                                        size={20}
                                        color="#FFD700"
                                    />
                                </TouchableOpacity>
                                {expandedFAQ === item.id && (
                                    <View style={styles.faqAnswer}>
                                        <Text style={styles.faqAnswerText}>{item.answer}</Text>
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                </View>

                {/* Contact Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Contact Information</Text>
                    <View style={styles.contactCard}>
                        <View style={styles.contactItem}>
                            <Ionicons name="mail" size={20} color="#FFD700" />
                            <View style={styles.contactTextContainer}>
                                <Text style={styles.contactLabel}>Email</Text>
                                <Text style={styles.contactValue}>support@cryptominer.com</Text>
                            </View>
                        </View>
                        <View style={styles.contactItem}>
                            <Ionicons name="time" size={20} color="#FFD700" />
                            <View style={styles.contactTextContainer}>
                                <Text style={styles.contactLabel}>Support Hours</Text>
                                <Text style={styles.contactValue}>24/7</Text>
                            </View>
                        </View>
                        <View style={styles.contactItem}>
                            <Ionicons name="globe" size={20} color="#FFD700" />
                            <View style={styles.contactTextContainer}>
                                <Text style={styles.contactLabel}>Website</Text>
                                <Text style={styles.contactValue}>www.cryptominer.com</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Resources */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Resources</Text>
                    <TouchableOpacity style={styles.resourceItem}>
                        <View style={styles.resourceLeft}>
                            <Ionicons name="document-text" size={20} color="#FFD700" />
                            <Text style={styles.resourceText}>User Guide</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#888" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.resourceItem}>
                        <View style={styles.resourceLeft}>
                            <Ionicons name="videocam" size={20} color="#FFD700" />
                            <Text style={styles.resourceText}>Video Tutorials</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#888" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.resourceItem}>
                        <View style={styles.resourceLeft}>
                            <Ionicons name="people" size={20} color="#FFD700" />
                            <Text style={styles.resourceText}>Community Forum</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#888" />
                    </TouchableOpacity>
                </View>

                {/* App Info */}
                <View style={styles.section}>
                    <View style={styles.appInfoCard}>
                        <Text style={styles.appInfoTitle}>CryptoMiner App</Text>
                        <Text style={styles.appInfoVersion}>Version 1.0.0</Text>
                        <Text style={styles.appInfoDescription}>
                            The ultimate crypto mining simulation app. Mine, earn, and learn about cryptocurrency in a safe and educational environment.
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
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
    scrollView: { flex: 1 },
    scrollContent: { padding: 20 },
    section: { marginBottom: 30 },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 16,
    },
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionCard: {
        backgroundColor: '#2a2a2a',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 4,
    },
    actionIcon: { marginBottom: 8 },
    actionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
        textAlign: 'center',
    },
    actionSubtitle: {
        fontSize: 12,
        color: '#888',
        textAlign: 'center',
    },
    faqContainer: {
        backgroundColor: '#2a2a2a',
        borderRadius: 12,
        overflow: 'hidden',
    },
    faqItem: {
        borderBottomWidth: 1,
        borderBottomColor: '#444',
    },
    faqQuestion: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    faqQuestionText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '500',
        flex: 1,
        marginRight: 12,
    },
    faqAnswer: {
        padding: 16,
        paddingTop: 0,
    },
    faqAnswerText: {
        fontSize: 14,
        color: '#ccc',
        lineHeight: 20,
    },
    contactCard: {
        backgroundColor: '#2a2a2a',
        borderRadius: 12,
        padding: 20,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    contactTextContainer: {
        marginLeft: 12,
        flex: 1,
    },
    contactLabel: {
        fontSize: 14,
        color: '#888',
        marginBottom: 2,
    },
    contactValue: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '500',
    },
    resourceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#2a2a2a',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    resourceLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    resourceText: {
        fontSize: 16,
        color: '#fff',
        marginLeft: 12,
    },
    appInfoCard: {
        backgroundColor: '#2a2a2a',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
    },
    appInfoTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFD700',
        marginBottom: 4,
    },
    appInfoVersion: {
        fontSize: 14,
        color: '#888',
        marginBottom: 12,
    },
    appInfoDescription: {
        fontSize: 14,
        color: '#ccc',
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default HelpSupportScreen;
