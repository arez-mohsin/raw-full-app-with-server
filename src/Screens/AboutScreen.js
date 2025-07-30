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

const AboutScreen = ({ navigation }) => {
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
                <Text style={styles.headerTitle}>About</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <View style={styles.appInfoSection}>
                    <View style={styles.appLogo}>
                        <Ionicons name="diamond" size={60} color="#FFD700" />
                    </View>
                    <Text style={styles.appName}>CryptoMiner</Text>
                    <Text style={styles.appVersion}>Version 1.0.0</Text>
                    <Text style={styles.appTagline}>
                        The ultimate crypto mining simulation app
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About CryptoMiner</Text>
                    <Text style={styles.description}>
                        CryptoMiner is an educational cryptocurrency mining simulation app designed to help users learn about blockchain technology and cryptocurrency mining in a safe, controlled environment. Our mission is to make cryptocurrency education accessible to everyone.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Key Features</Text>
                    <View style={styles.featuresList}>
                        <View style={styles.featureItem}>
                            <Ionicons name="school" size={20} color="#FFD700" />
                            <Text style={styles.featureText}>Educational Mining Simulation</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="shield-checkmark" size={20} color="#FFD700" />
                            <Text style={styles.featureText}>Secure & Safe Environment</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="trending-up" size={20} color="#FFD700" />
                            <Text style={styles.featureText}>Real-time Mining Statistics</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="people" size={20} color="#FFD700" />
                            <Text style={styles.featureText}>Community & Referrals</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="wallet" size={20} color="#FFD700" />
                            <Text style={styles.featureText}>Digital Wallet Integration</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="notifications" size={20} color="#FFD700" />
                            <Text style={styles.featureText}>Smart Notifications</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Our Team</Text>
                    <Text style={styles.description}>
                        CryptoMiner is developed by a passionate team of blockchain enthusiasts, developers, and educators committed to making cryptocurrency accessible to everyone.
                    </Text>

                    <View style={styles.teamGrid}>
                        <View style={styles.teamMember}>
                            <View style={styles.memberAvatar}>
                                <Ionicons name="person" size={24} color="#FFD700" />
                            </View>
                            <Text style={styles.memberName}>John Doe</Text>
                            <Text style={styles.memberRole}>CEO & Founder</Text>
                        </View>

                        <View style={styles.teamMember}>
                            <View style={styles.memberAvatar}>
                                <Ionicons name="person" size={24} color="#FFD700" />
                            </View>
                            <Text style={styles.memberName}>Jane Smith</Text>
                            <Text style={styles.memberRole}>Lead Developer</Text>
                        </View>

                        <View style={styles.teamMember}>
                            <View style={styles.memberAvatar}>
                                <Ionicons name="person" size={24} color="#FFD700" />
                            </View>
                            <Text style={styles.memberName}>Mike Johnson</Text>
                            <Text style={styles.memberRole}>Blockchain Expert</Text>
                        </View>

                        <View style={styles.teamMember}>
                            <View style={styles.memberAvatar}>
                                <Ionicons name="person" size={24} color="#FFD700" />
                            </View>
                            <Text style={styles.memberName}>Sarah Wilson</Text>
                            <Text style={styles.memberRole}>UX Designer</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Our Mission</Text>
                    <View style={styles.missionCard}>
                        <Ionicons name="bulb" size={32} color="#FFD700" />
                        <Text style={styles.missionTitle}>Educate & Empower</Text>
                        <Text style={styles.missionText}>
                            We believe that everyone should have access to quality cryptocurrency education. Our app provides a safe, educational environment where users can learn about blockchain technology and cryptocurrency mining without financial risk.
                        </Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Contact Us</Text>

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
                    <Text style={styles.sectionTitle}>Follow Us</Text>
                    <View style={styles.socialGrid}>
                        <TouchableOpacity
                            style={styles.socialButton}
                            onPress={() => handleSocialPress('twitter')}
                        >
                            <Ionicons name="logo-twitter" size={24} color="#1DA1F2" />
                            <Text style={styles.socialText}>Twitter</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.socialButton}
                            onPress={() => handleSocialPress('facebook')}
                        >
                            <Ionicons name="logo-facebook" size={24} color="#4267B2" />
                            <Text style={styles.socialText}>Facebook</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.socialButton}
                            onPress={() => handleSocialPress('instagram')}
                        >
                            <Ionicons name="logo-instagram" size={24} color="#E4405F" />
                            <Text style={styles.socialText}>Instagram</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.socialButton}
                            onPress={() => handleSocialPress('linkedin')}
                        >
                            <Ionicons name="logo-linkedin" size={24} color="#0077B5" />
                            <Text style={styles.socialText}>LinkedIn</Text>
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
