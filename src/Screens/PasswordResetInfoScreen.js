import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { hapticLight } from '../utils/HapticUtils';

const { width, height } = Dimensions.get('window');

const PasswordResetInfoScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const { t } = useTranslation();

    const handleClose = () => {
        hapticLight();
        navigation.goBack();
    };

    return (
        <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary, theme.colors.primary]}
            style={styles.container}
        >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={handleClose}
                >
                    <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
                    Password Reset Guide
                </Text>
                <View style={styles.headerSpacer} />
            </View>

            {/* Content */}
            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.contentContainer}
            >
                {/* Info Sections */}
                <View style={[styles.infoSection, { backgroundColor: theme.colors.card }]}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="mail" size={24} color={theme.colors.accent} />
                        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                            Email Verification
                        </Text>
                    </View>
                    <Text style={[styles.sectionText, { color: theme.colors.textSecondary }]}>
                        When you request a password reset, we'll send a secure link to your registered email address. This link will allow you to create a new password.
                    </Text>
                </View>

                <View style={[styles.infoSection, { backgroundColor: theme.colors.card }]}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="lock-closed" size={24} color={theme.colors.accent} />
                        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                            Security Requirements
                        </Text>
                    </View>
                    <Text style={[styles.sectionText, { color: theme.colors.textSecondary }]}>
                        Your new password must meet these security standards:
                    </Text>
                    <View style={styles.requirementList}>
                        <View style={styles.requirementItem}>
                            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                            <Text style={[styles.requirementText, { color: theme.colors.textSecondary }]}>
                                At least 8 characters long
                            </Text>
                        </View>
                        <View style={styles.requirementItem}>
                            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                            <Text style={[styles.requirementText, { color: theme.colors.textSecondary }]}>
                                Contains uppercase letters (A-Z)
                            </Text>
                        </View>
                        <View style={styles.requirementItem}>
                            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                            <Text style={[styles.requirementText, { color: theme.colors.textSecondary }]}>
                                Contains lowercase letters (a-z)
                            </Text>
                        </View>
                        <View style={styles.requirementItem}>
                            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                            <Text style={[styles.requirementText, { color: theme.colors.textSecondary }]}>
                                Contains numbers (0-9)
                            </Text>
                        </View>
                        <View style={styles.requirementItem}>
                            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                            <Text style={[styles.requirementText, { color: theme.colors.textSecondary }]}>
                                Contains special characters (!@#$%^&*)
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={[styles.infoSection, { backgroundColor: theme.colors.card }]}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="time" size={24} color={theme.colors.accent} />
                        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                            Important Notes
                        </Text>
                    </View>
                    <View style={styles.noteList}>
                        <View style={styles.noteItem}>
                            <Ionicons name="information-circle" size={16} color="#FFD700" />
                            <Text style={[styles.noteText, { color: theme.colors.textSecondary }]}>
                                Reset links expire after 1 hour for security
                            </Text>
                        </View>
                        <View style={styles.noteItem}>
                            <Ionicons name="information-circle" size={16} color="#FFD700" />
                            <Text style={[styles.noteText, { color: theme.colors.textSecondary }]}>
                                Check your spam folder if you don't receive the email
                            </Text>
                        </View>
                        <View style={styles.noteItem}>
                            <Ionicons name="information-circle" size={16} color="#FFD700" />
                            <Text style={[styles.noteText, { color: theme.colors.textSecondary }]}>
                                You can only use each reset link once
                            </Text>
                        </View>
                        <View style={styles.noteItem}>
                            <Ionicons name="information-circle" size={16} color="#FFD700" />
                            <Text style={[styles.noteText, { color: theme.colors.textSecondary }]}>
                                Contact support if you continue having issues
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={[styles.infoSection, { backgroundColor: theme.colors.card }]}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="shield-checkmark" size={24} color={theme.colors.accent} />
                        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                            Security Tips
                        </Text>
                    </View>
                    <Text style={[styles.sectionText, { color: theme.colors.textSecondary }]}>
                        After resetting your password:
                    </Text>
                    <View style={styles.tipList}>
                        <View style={styles.tipItem}>
                            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                            <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                                Use a unique password not used elsewhere
                            </Text>
                        </View>
                        <View style={styles.tipItem}>
                            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                            <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                                Enable two-factor authentication if available
                            </Text>
                        </View>
                        <View style={styles.tipItem}>
                            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                            <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                                Regularly update your password
                            </Text>
                        </View>
                        <View style={styles.tipItem}>
                            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                            <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                                Never share your password with anyone
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: theme.colors.accent }]}
                    onPress={handleClose}
                >
                    <Text style={[styles.primaryButtonText, { color: '#000' }]}>
                        Got It
                    </Text>
                </TouchableOpacity>
            </View>
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
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    closeButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        flex: 1,
    },
    headerSpacer: {
        width: 40,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
        paddingBottom: 100,
    },
    infoSection: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 12,
    },
    sectionText: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 16,
    },
    requirementList: {
        gap: 12,
    },
    requirementItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    requirementText: {
        fontSize: 14,
        marginLeft: 8,
        flex: 1,
    },
    noteList: {
        gap: 12,
    },
    noteItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    noteText: {
        fontSize: 14,
        marginLeft: 8,
        flex: 1,
        lineHeight: 20,
    },
    tipList: {
        gap: 12,
    },
    tipItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tipText: {
        fontSize: 14,
        marginLeft: 8,
        flex: 1,
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
    },
    primaryButton: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default PasswordResetInfoScreen;
