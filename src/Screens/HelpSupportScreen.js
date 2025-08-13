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
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

const HelpSupportScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const [expandedFAQ, setExpandedFAQ] = useState(null);

    const faqData = [
        {
            id: 1,
            question: t('helpSupport.faq1Question'),
            answer: t('helpSupport.faq1Answer'),
        },
        {
            id: 2,
            question: t('helpSupport.faq2Question'),
            answer: t('helpSupport.faq2Answer'),
        },
        {
            id: 3,
            question: t('helpSupport.faq3Question'),
            answer: t('helpSupport.faq3Answer'),
        },
        {
            id: 4,
            question: t('helpSupport.faq4Question'),
            answer: t('helpSupport.faq4Answer'),
        },
        {
            id: 5,
            question: t('helpSupport.faq5Question'),
            answer: t('helpSupport.faq5Answer'),
        },
        {
            id: 6,
            question: t('helpSupport.faq6Question'),
            answer: t('helpSupport.faq6Answer'),
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
        Linking.openURL('mailto:rawchain01@gmail.com?subject=Bug Report');
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
                <Text style={styles.headerTitle}>{t('helpSupport.helpSupport')}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('helpSupport.getHelp')}</Text>
                    <View style={styles.quickActions}>
                        <TouchableOpacity style={styles.actionCard} onPress={handleContactSupport}>
                            <View style={styles.actionIcon}>
                                <Ionicons name="mail" size={24} color="#FFD700" />
                            </View>
                            <Text style={styles.actionTitle}>{t('helpSupport.emailSupport')}</Text>
                            <Text style={styles.actionSubtitle}>{t('helpSupport.getHelpViaEmail')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionCard} onPress={handleLiveChat}>
                            <View style={styles.actionIcon}>
                                <Ionicons name="chatbubbles" size={24} color="#FFD700" />
                            </View>
                            <Text style={styles.actionTitle}>{t('helpSupport.liveChat')}</Text>
                            <Text style={styles.actionSubtitle}>{t('helpSupport.chatWithSupport')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.actionCard} onPress={handleReportBug}>
                            <View style={styles.actionIcon}>
                                <Ionicons name="bug" size={24} color="#FFD700" />
                            </View>
                            <Text style={styles.actionTitle}>{t('helpSupport.reportBug')}</Text>
                            <Text style={styles.actionSubtitle}>{t('helpSupport.reportAnIssue')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* FAQ Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('helpSupport.frequentlyAskedQuestions')}</Text>
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
                    <Text style={styles.sectionTitle}>{t('helpSupport.contactInformation')}</Text>
                    <View style={styles.contactCard}>
                        <View style={styles.contactItem}>
                            <Ionicons name="mail" size={20} color="#FFD700" />
                            <View style={styles.contactTextContainer}>
                                <Text style={styles.contactLabel}>{t('helpSupport.email')}</Text>
                                <Text style={styles.contactValue}>support@cryptominer.com</Text>
                            </View>
                        </View>
                        <View style={styles.contactItem}>
                            <Ionicons name="time" size={20} color="#FFD700" />
                            <View style={styles.contactTextContainer}>
                                <Text style={styles.contactLabel}>{t('helpSupport.supportHours')}</Text>
                                <Text style={styles.contactValue}>24/7</Text>
                            </View>
                        </View>
                        <View style={styles.contactItem}>
                            <Ionicons name="globe" size={20} color="#FFD700" />
                            <View style={styles.contactTextContainer}>
                                <Text style={styles.contactLabel}>{t('helpSupport.website')}</Text>
                                <Text style={styles.contactValue}>www.cryptominer.com</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Resources */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('helpSupport.resources')}</Text>
                    <TouchableOpacity style={styles.resourceItem}>
                        <View style={styles.resourceLeft}>
                            <Ionicons name="document-text" size={20} color="#FFD700" />
                            <Text style={styles.resourceText}>{t('helpSupport.userGuide')}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#888" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.resourceItem}>
                        <View style={styles.resourceLeft}>
                            <Ionicons name="videocam" size={20} color="#FFD700" />
                            <Text style={styles.resourceText}>{t('helpSupport.videoTutorials')}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#888" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.resourceItem}>
                        <View style={styles.resourceLeft}>
                            <Ionicons name="people" size={20} color="#FFD700" />
                            <Text style={styles.resourceText}>{t('helpSupport.communityForum')}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#888" />
                    </TouchableOpacity>
                </View>

                {/* App Info */}
                <View style={styles.section}>
                    <View style={styles.appInfoCard}>
                        <Text style={styles.appInfoTitle}>{t('helpSupport.cryptoMinerApp')}</Text>
                        <Text style={styles.appInfoVersion}>{t('helpSupport.version')} 1.0.0</Text>
                        <Text style={styles.appInfoDescription}>
                            {t('helpSupport.appDescription')}
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
