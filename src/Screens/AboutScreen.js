import React from 'react';
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

const AboutScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const { t } = useTranslation();

    const handleWebsitePress = () => {
        Linking.openURL('https://www.cryptominer.com');
    };

    const handleEmailPress = () => {
        Linking.openURL('mailto:info@cryptominer.com');
    };

    const handleSocialPress = (platform) => {
        const urls = {
            twitter: 'https://twitter.com/cryptominer',
            facebook: 'https://facebook.com/cryptominer',
            instagram: 'https://instagram.com/cryptominer',
            linkedin: 'https://linkedin.com/company/cryptominer',
        };
        Linking.openURL(urls[platform]);
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
                <Text style={styles.headerTitle}>{t('about.about')}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <View style={styles.appInfoSection}>
                    <View style={styles.appLogo}>
                        <Ionicons name="diamond" size={60} color="#FFD700" />
                    </View>
                    <Text style={styles.appName}>{t('about.appName')}</Text>
                    <Text style={styles.appVersion}>{t('about.appVersion')} 1.0.0</Text>
                    <Text style={styles.appTagline}>
                        {t('about.appTagline')}
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('about.aboutCryptoMiner')}</Text>
                    <Text style={styles.description}>
                        {t('about.aboutDescription')}
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('about.keyFeatures')}</Text>
                    <View style={styles.featuresList}>
                        <View style={styles.featureItem}>
                            <Ionicons name="school" size={20} color="#FFD700" />
                            <Text style={styles.featureText}>{t('about.educationalMiningSimulation')}</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="shield-checkmark" size={20} color="#FFD700" />
                            <Text style={styles.featureText}>{t('about.secureSafeEnvironment')}</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="trending-up" size={20} color="#FFD700" />
                            <Text style={styles.featureText}>{t('about.realTimeMiningStatistics')}</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="people" size={20} color="#FFD700" />
                            <Text style={styles.featureText}>{t('about.communityReferrals')}</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="wallet" size={20} color="#FFD700" />
                            <Text style={styles.featureText}>{t('about.digitalWalletIntegration')}</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="notifications" size={20} color="#FFD700" />
                            <Text style={styles.featureText}>{t('about.smartNotifications')}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('about.ourTeam')}</Text>
                    <Text style={styles.description}>
                        {t('about.teamDescription')}
                    </Text>

                    <View style={styles.teamGrid}>
                        <View style={styles.teamMember}>
                            <View style={styles.memberAvatar}>
                                <Ionicons name="person" size={24} color="#FFD700" />
                            </View>
                            <Text style={styles.memberName}>{t('about.johnDoe')}</Text>
                            <Text style={styles.memberRole}>{t('about.ceoFounder')}</Text>
                        </View>

                        <View style={styles.teamMember}>
                            <View style={styles.memberAvatar}>
                                <Ionicons name="person" size={24} color="#FFD700" />
                            </View>
                            <Text style={styles.memberName}>{t('about.janeSmith')}</Text>
                            <Text style={styles.memberRole}>{t('about.leadDeveloper')}</Text>
                        </View>

                        <View style={styles.teamMember}>
                            <View style={styles.memberAvatar}>
                                <Ionicons name="person" size={24} color="#FFD700" />
                            </View>
                            <Text style={styles.memberName}>{t('about.mikeJohnson')}</Text>
                            <Text style={styles.memberRole}>{t('about.blockchainExpert')}</Text>
                        </View>

                        <View style={styles.teamMember}>
                            <View style={styles.memberAvatar}>
                                <Ionicons name="person" size={24} color="#FFD700" />
                            </View>
                            <Text style={styles.memberName}>{t('about.sarahWilson')}</Text>
                            <Text style={styles.memberRole}>{t('about.uxDesigner')}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('about.ourMission')}</Text>
                    <View style={styles.missionCard}>
                        <Ionicons name="bulb" size={32} color="#FFD700" />
                        <Text style={styles.missionTitle}>{t('about.educateEmpower')}</Text>
                        <Text style={styles.missionText}>
                            {t('about.missionText')}
                        </Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('about.contactUs')}</Text>

                    <TouchableOpacity style={styles.contactItem} onPress={handleWebsitePress}>
                        <Ionicons name="globe" size={20} color="#FFD700" />
                        <Text style={styles.contactText}>www.cryptominer.com</Text>
                        <Ionicons name="open" size={16} color="#888" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.contactItem} onPress={handleEmailPress}>
                        <Ionicons name="mail" size={20} color="#FFD700" />
                        <Text style={styles.contactText}>info@cryptominer.com</Text>
                        <Ionicons name="open" size={16} color="#888" />
                    </TouchableOpacity>

                    <View style={styles.contactItem}>
                        <Ionicons name="location" size={20} color="#FFD700" />
                        <Text style={styles.contactText}>San Francisco, CA</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('about.followUs')}</Text>
                    <View style={styles.socialGrid}>
                        <TouchableOpacity
                            style={styles.socialButton}
                            onPress={() => handleSocialPress('twitter')}
                        >
                            <Ionicons name="logo-twitter" size={24} color="#1DA1F2" />
                            <Text style={styles.socialText}>{t('about.twitter')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.socialButton}
                            onPress={() => handleSocialPress('facebook')}
                        >
                            <Ionicons name="logo-facebook" size={24} color="#4267B2" />
                            <Text style={styles.socialText}>{t('about.facebook')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.socialButton}
                            onPress={() => handleSocialPress('instagram')}
                        >
                            <Ionicons name="logo-instagram" size={24} color="#E4405F" />
                            <Text style={styles.socialText}>{t('about.instagram')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.socialButton}
                            onPress={() => handleSocialPress('linkedin')}
                        >
                            <Ionicons name="logo-linkedin" size={24} color="#0077B5" />
                            <Text style={styles.socialText}>{t('about.linkedin')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.legalNotice}>
                        <Text style={styles.legalNoticeText}>
                            CryptoMiner is a simulation app for educational purposes only. No real cryptocurrency mining or financial transactions occur within this application. Always do your own research before investing in cryptocurrency.
                        </Text>
                    </View>
                </View>

                <View style={styles.copyrightSection}>
                    <Text style={styles.copyrightText}>
                        © 2024 CryptoMiner. All rights reserved.
                    </Text>
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
    appInfoSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    appLogo: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#2a2a2a',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#FFD700',
        marginBottom: 16,
    },
    appName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFD700',
        marginBottom: 4,
    },
    appVersion: {
        fontSize: 14,
        color: '#888',
        marginBottom: 8,
    },
    appTagline: {
        fontSize: 16,
        color: '#ccc',
        textAlign: 'center',
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
    description: {
        fontSize: 14,
        color: '#ccc',
        lineHeight: 20,
        marginBottom: 16,
    },
    featuresList: {
        backgroundColor: '#2a2a2a',
        borderRadius: 12,
        padding: 16,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    featureText: {
        fontSize: 14,
        color: '#fff',
        marginLeft: 12,
    },
    teamGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    teamMember: {
        width: '48%',
        alignItems: 'center',
        backgroundColor: '#2a2a2a',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    memberAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#1a1a1a',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    memberName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    memberRole: {
        fontSize: 12,
        color: '#888',
    },
    missionCard: {
        backgroundColor: '#2a2a2a',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
    },
    missionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFD700',
        marginTop: 12,
        marginBottom: 8,
    },
    missionText: {
        fontSize: 14,
        color: '#ccc',
        textAlign: 'center',
        lineHeight: 20,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2a2a2a',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    contactText: {
        fontSize: 14,
        color: '#fff',
        marginLeft: 12,
        flex: 1,
    },
    socialGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    socialButton: {
        backgroundColor: '#2a2a2a',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 4,
    },
    socialText: {
        fontSize: 12,
        color: '#fff',
        marginTop: 4,
    },
    legalNotice: {
        backgroundColor: '#1a1a1a',
        borderRadius: 8,
        padding: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#FFD700',
    },
    legalNoticeText: {
        fontSize: 12,
        color: '#FFD700',
        fontStyle: 'italic',
        textAlign: 'center',
    },
    copyrightSection: {
        alignItems: 'center',
        marginTop: 20,
    },
    copyrightText: {
        fontSize: 12,
        color: '#666',
    },
});

export default AboutScreen;
