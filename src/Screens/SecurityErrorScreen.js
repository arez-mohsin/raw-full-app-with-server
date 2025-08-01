import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Linking,
    ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SecurityErrorScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const [isLoading, setIsLoading] = useState(false);

    const handleSignOut = async () => {
        try {
            setIsLoading(true);
            await signOut(auth);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
            });
        } catch (error) {
            console.error('Error signing out:', error);
            Alert.alert('Error', 'Failed to sign out. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleContactSupport = () => {
        Alert.alert(
            'Contact Support',
            'Please contact our support team with the following information:\n\n• Your email address\n• When this error occurred\n• Any recent account changes\n\nEmail: support@cryptominer.com',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Copy Email',
                    onPress: () => {
                        // You can implement clipboard functionality here
                        Alert.alert('Email Copied', 'support@cryptominer.com has been copied to clipboard');
                    }
                }
            ]
        );
    };

    const handleReportIssue = () => {
        Alert.alert(
            'Report Security Issue',
            'This will help us improve our security measures. Your report will be anonymous.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Report',
                    onPress: () => {
                        Alert.alert(
                            'Thank You',
                            'Your security report has been submitted. We will investigate this issue.',
                            [{ text: 'OK' }]
                        );
                    }
                }
            ]
        );
    };

    const insets = useSafeAreaInsets();
    return (
        <LinearGradient colors={['#1a1a1a', '#2a2a2a', '#1a1a1a']} style={styles.container}>
            <ScrollView style={styles.content}>
                {/* Header */}
                <View style={[styles.header, {
                    paddingTop: insets.top + 10,
                }]}>
                    <View style={styles.logoContainer}>
                        <Ionicons name="shield-checkmark" size={60} color="#ff4444" />
                    </View>

                    <Text style={styles.title}>Security Alert</Text>
                    <Text style={styles.subtitle}>
                        We detected a security issue with your account
                    </Text>
                </View>

                {/* Main Content */}
                <View style={styles.mainContent}>
                    <View style={styles.securityCard}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="warning" size={50} color="#ff4444" />
                        </View>

                        <Text style={styles.cardTitle}>Account Security Issue</Text>
                        <Text style={styles.cardDescription}>
                            Your account has been flagged for a security review. This may be due to:
                        </Text>

                        <View style={styles.issueList}>
                            <View style={styles.issueItem}>
                                <Ionicons name="alert-circle" size={16} color="#ff4444" />
                                <Text style={styles.issueText}>Incomplete account setup</Text>
                            </View>
                            <View style={styles.issueItem}>
                                <Ionicons name="alert-circle" size={16} color="#ff4444" />
                                <Text style={styles.issueText}>Data synchronization error</Text>
                            </View>
                            <View style={styles.issueItem}>
                                <Ionicons name="alert-circle" size={16} color="#ff4444" />
                                <Text style={styles.issueText}>Account verification required</Text>
                            </View>
                        </View>

                        <Text style={styles.securityNote}>
                            For your security, please sign out and contact our support team for assistance.
                        </Text>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={[styles.button, styles.primaryButton]}
                            onPress={handleSignOut}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Text style={styles.buttonText}>Signing Out...</Text>
                            ) : (
                                <>
                                    <Ionicons name="log-out" size={20} color="#fff" />
                                    <Text style={styles.buttonText}>Sign Out</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.secondaryButton]}
                            onPress={handleContactSupport}
                        >
                            <Ionicons name="help-circle" size={20} color="#FFD700" />
                            <Text style={styles.secondaryButtonText}>Contact Support</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.reportButton]}
                            onPress={handleReportIssue}
                        >
                            <Ionicons name="flag" size={20} color="#888" />
                            <Text style={styles.reportButtonText}>Report Issue</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Security Information */}
                    <View style={styles.securityInfo}>
                        <Text style={styles.securityInfoTitle}>Security Measures</Text>
                        <Text style={styles.securityInfoText}>
                            • Your account data is encrypted{'\n'}
                            • We monitor for suspicious activity{'\n'}
                            • This alert helps prevent unauthorized access{'\n'}
                            • Support team will assist you promptly
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
    content: {
        flex: 1,
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    logoContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255, 68, 68, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 2,
        borderColor: 'rgba(255, 68, 68, 0.3)',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#ccc',
        textAlign: 'center',
        lineHeight: 22,
    },
    mainContent: {
        flex: 1,
    },
    securityCard: {
        backgroundColor: 'rgba(255, 68, 68, 0.05)',
        borderRadius: 20,
        padding: 25,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: 'rgba(255, 68, 68, 0.2)',
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#ff4444',
        textAlign: 'center',
        marginBottom: 15,
    },
    cardDescription: {
        fontSize: 16,
        color: '#ccc',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 20,
    },
    issueList: {
        marginBottom: 20,
    },
    issueItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 10,
    },
    issueText: {
        fontSize: 14,
        color: '#ccc',
        marginLeft: 10,
        flex: 1,
    },
    securityNote: {
        fontSize: 14,
        color: '#ff4444',
        textAlign: 'center',
        fontStyle: 'italic',
        lineHeight: 20,
    },
    actionButtons: {
        marginBottom: 30,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        marginBottom: 15,
    },
    primaryButton: {
        backgroundColor: '#ff4444',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 10,
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    secondaryButtonText: {
        color: '#FFD700',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 10,
    },
    reportButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#555',
    },
    reportButtonText: {
        color: '#888',
        fontSize: 16,
        fontWeight: '500',
        marginLeft: 10,
    },
    securityInfo: {
        backgroundColor: 'rgba(255, 68, 68, 0.05)',
        borderRadius: 15,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 68, 68, 0.2)',
    },
    securityInfoTitle: {
        color: '#ff4444',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    securityInfoText: {
        color: '#ccc',
        fontSize: 14,
        lineHeight: 20,
    },
});

export default SecurityErrorScreen; 