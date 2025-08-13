import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import * as Network from 'expo-network';
import ToastService from '../utils/ToastService';
import { hapticMedium, hapticSuccess, hapticError } from '../utils/HapticUtils';

const NetworkErrorScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const [isChecking, setIsChecking] = useState(false);
    const [networkState, setNetworkState] = useState(null);

    // Check network status
    const checkNetworkStatus = async () => {
        try {
            setIsChecking(true);
            const state = await Network.getNetworkStateAsync();
            setNetworkState(state);

            if (state.isConnected && state.isInternetReachable) {
                // Network is available, navigate to appropriate screen
                await hapticSuccess();
                navigation.replace('Splash');
            } else {
                await hapticError();
            }
        } catch (error) {
            console.error('Network check error:', error);
            await hapticError();
        } finally {
            setIsChecking(false);
        }
    };

    // Check network on component mount
    useEffect(() => {
        checkNetworkStatus();
    }, []);

    // Get network status description
    const getNetworkStatusText = () => {
        if (!networkState) return t('errors.checkingNetworkConnection');

        if (networkState.isConnected && networkState.isInternetReachable) {
            return t('errors.networkConnectionRestored');
        }

        if (!networkState.isConnected) {
            return t('errors.noNetworkConnection');
        }

        if (!networkState.isInternetReachable) {
            return t('errors.noInternetAccess');
        }

        return t('errors.networkConnectionIssue');
    };

    // Get network type description
    const getNetworkTypeText = () => {
        if (!networkState) return '';

        switch (networkState.type) {
            case Network.NetworkStateType.WIFI:
                return t('errors.wifi');
            case Network.NetworkStateType.CELLULAR:
                return t('errors.cellular');
            case Network.NetworkStateType.NONE:
                return t('errors.noConnection');
            default:
                return t('errors.unknown');
        }
    };

    return (
        <LinearGradient colors={['#1a1a1a', '#2a2a2a', '#1a1a1a']} style={styles.container}>
            <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <Ionicons name="wifi-off" size={60} color="#ff4444" />
                    </View>

                    <Text style={styles.title}>{t('errors.networkError')}</Text>
                    <Text style={styles.subtitle}>
                        {t('errors.checkNetworkSettings')}
                    </Text>
                </View>

                {/* Network Status Card */}
                <View style={styles.statusCard}>
                    <View style={styles.statusHeader}>
                        <Ionicons
                            name={networkState?.isConnected ? "wifi" : "wifi-off"}
                            size={24}
                            color={networkState?.isConnected ? "#4CAF50" : "#ff4444"}
                        />
                        <Text style={styles.statusTitle}>{t('errors.networkStatus')}</Text>
                    </View>

                    <Text style={styles.statusText}>{getNetworkStatusText()}</Text>

                    {networkState && (
                        <View style={styles.networkInfo}>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>{t('errors.connectionType')}:</Text>
                                <Text style={styles.infoValue}>{getNetworkTypeText()}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>{t('errors.connected')}:</Text>
                                <Text style={[styles.infoValue, { color: networkState.isConnected ? "#4CAF50" : "#ff4444" }]}>
                                    {networkState.isConnected ? t('common.yes') : t('common.no')}
                                </Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>{t('errors.internetAccess')}:</Text>
                                <Text style={[styles.infoValue, { color: networkState.isInternetReachable ? "#4CAF50" : "#ff4444" }]}>
                                    {networkState.isInternetReachable ? t('common.yes') : t('common.no')}
                                </Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Troubleshooting Tips */}
                <View style={styles.tipsCard}>
                    <Text style={styles.tipsTitle}>{t('errors.troubleshootingTips')}</Text>
                    <View style={styles.tipItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                        <Text style={styles.tipText}>{t('errors.checkWifiEnabled')}</Text>
                    </View>
                    <View style={styles.tipItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                        <Text style={styles.tipText}>{t('errors.turnOffAirplaneMode')}</Text>
                    </View>
                    <View style={styles.tipItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                        <Text style={styles.tipText}>{t('errors.switchWifiMobileData')}</Text>
                    </View>
                    <View style={styles.tipItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                        <Text style={styles.tipText}>{t('errors.restartDevice')}</Text>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={[styles.primaryButton, isChecking && { opacity: 0.7 }]}
                        onPress={checkNetworkStatus}
                        disabled={isChecking}
                    >
                        {isChecking ? (
                            <ActivityIndicator color="#000" size="small" />
                        ) : (
                            <>
                                <Ionicons name="refresh" size={20} color="#000" />
                                <Text style={styles.primaryButtonText}>{t('errors.checkConnection')}</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => {
                            hapticMedium();
                            ToastService.warning(t('errors.exitAppConfirmation'));
                            // For now, we'll just show a warning. In a real app, you might want to add a modal
                            // or use a different approach for multiple options
                        }}
                    >
                        <Ionicons name="close-circle" size={20} color="#ff4444" />
                        <Text style={styles.secondaryButtonText}>{t('errors.exitApp')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
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
        marginTop: 10,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255, 68, 68, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        borderWidth: 2,
        borderColor: 'rgba(255, 68, 68, 0.3)',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#888',
        textAlign: 'center',
        lineHeight: 22,
    },
    statusCard: {
        backgroundColor: '#2a2a2a',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#444',
    },
    statusHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    statusTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginLeft: 8,
    },
    statusText: {
        fontSize: 14,
        color: '#888',
        marginBottom: 16,
        lineHeight: 20,
    },
    networkInfo: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 8,
        padding: 12,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    infoLabel: {
        fontSize: 12,
        color: '#888',
    },
    infoValue: {
        fontSize: 12,
        color: '#fff',
        fontWeight: '500',
    },
    tipsCard: {
        backgroundColor: '#2a2a2a',
        borderRadius: 16,
        padding: 20,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: '#444',
    },
    tipsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 16,
    },
    tipItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    tipText: {
        fontSize: 14,
        color: '#888',
        marginLeft: 8,
        flex: 1,
    },
    actionButtons: {
        marginBottom: 20,
    },
    primaryButton: {
        backgroundColor: '#FFD700',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    primaryButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#ff4444',
    },
    secondaryButtonText: {
        color: '#ff4444',
        fontSize: 16,
        fontWeight: '500',
        marginLeft: 8,
    },
});

export default NetworkErrorScreen; 