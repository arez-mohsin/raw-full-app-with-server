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
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

const PrivacyPolicyScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const { t } = useTranslation();

    return (
        <LinearGradient
            colors={['#1a1a1a', '#2a2a2a', '#1a1a1a']}
            style={styles.container}
        >
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('privacyPolicy')}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <View style={styles.content}>
                    <Text style={styles.lastUpdated}>{t('lastUpdated')}: January 1, 2024</Text>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('introduction')}</Text>
                        <Text style={styles.paragraph}>
                            {t('introductionText')}
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('informationWeCollect')}</Text>
                        <Text style={styles.subsectionTitle}>{t('personalInformation')}</Text>
                        <Text style={styles.paragraph}>
                            {t('personalInformationText')}
                        </Text>

                        <Text style={styles.subsectionTitle}>{t('deviceInformation')}</Text>
                        <Text style={styles.paragraph}>
                            {t('deviceInformationText')}
                        </Text>

                        <Text style={styles.subsectionTitle}>{t('usageInformation')}</Text>
                        <Text style={styles.paragraph}>
                            {t('usageInformationText')}
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('howWeUseYourInformation')}</Text>
                        <Text style={styles.paragraph}>
                            {t('howWeUseYourInformationText')}
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('informationSharing')}</Text>
                        <Text style={styles.paragraph}>
                            {t('informationSharingText')}
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('dataSecurity')}</Text>
                        <Text style={styles.paragraph}>
                            {t('dataSecurityText')}
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('dataRetention')}</Text>
                        <Text style={styles.paragraph}>
                            {t('dataRetentionText')}
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('yourRights')}</Text>
                        <Text style={styles.paragraph}>
                            {t('yourRightsText')}
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('cookiesAndTracking')}</Text>
                        <Text style={styles.paragraph}>
                            {t('cookiesAndTrackingText')}
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('thirdPartyServices')}</Text>
                        <Text style={styles.paragraph}>
                            {t('thirdPartyServicesText')}
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('childrensPrivacy')}</Text>
                        <Text style={styles.paragraph}>
                            {t('childrensPrivacyText')}
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('internationalTransfers')}</Text>
                        <Text style={styles.paragraph}>
                            {t('internationalTransfersText')}
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('changesToThisPolicy')}</Text>
                        <Text style={styles.paragraph}>
                            {t('changesToThisPolicyText')}
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('contactUs')}</Text>
                        <Text style={styles.paragraph}>
                            {t('contactUsText')}
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('californiaPrivacyRights')}</Text>
                        <Text style={styles.paragraph}>
                            {t('californiaPrivacyRightsText')}
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t('gdprCompliance')}</Text>
                        <Text style={styles.paragraph}>
                            {t('gdprComplianceText')}
                        </Text>
                    </View>

                    <View style={styles.legalNotice}>
                        <Text style={styles.legalNoticeText}>
                            {t('legalNoticeText')}
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
