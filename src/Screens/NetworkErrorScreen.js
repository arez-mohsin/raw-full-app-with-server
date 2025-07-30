import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import * as Network from 'expo-network';
import * as Haptics from 'expo-haptics';

const NetworkErrorScreen = ({ navigation }) => {
    const { theme } = useTheme();
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
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                navigation.replace('Splash');
            } else {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
        } catch (error) {
            console.error('Network check error:', error);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
        if (!networkState) return 'Checking network connection...';

        if (networkState.isConnected && networkState.isInternetReachable) {
            return 'Network connection restored!';
        }

        if (!networkState.isConnected) {
            return 'No network connection detected';
        }

        if (!networkState.isInternetReachable) {
            return 'Connected to network but no internet access';
        }

        return 'Network connection issue detected';
    };

    // Get network type description
    const getNetworkTypeText = () => {
        if (!networkState) return '';

        switch (networkState.type) {
            case Network.NetworkStateType.WIFI:
                return 'WiFi';
            case Network.NetworkStateType.CELLULAR:
                return 'Cellular';
            case Network.NetworkStateType.NONE:
                return 'No Connection';
            default:
                return 'Unknown';
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

                    <Text style={styles.title}>No Internet Connection</Text>
                    <Text style={styles.subtitle}>
                        Please check your network settings and try again
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
                        <Text style={styles.statusTitle}>Network Status</Text>
                    </View>

                    <Text style={styles.statusText}>{getNetworkStatusText()}</Text>

                    {networkState && (
                        <View style={styles.networkInfo}>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Connection Type:</Text>
                                <Text style={styles.infoValue}>{getNetworkTypeText()}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Connected:</Text>
                                <Text style={[styles.infoValue, { color: networkState.isConnected ? "#4CAF50" : "#ff4444" }]}>
                                    {networkState.isConnected ? "Yes" : "No"}
                                </Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Internet Access:</Text>
                                <Text style={[styles.infoValue, { color: networkState.isInternetReachable ? "#4CAF50" : "#ff4444" }]}>
                                    {networkState.isInternetReachable ? "Yes" : "No"}
                                </Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Troubleshooting Tips */}
                <View style={styles.tipsCard}>
                    <Text style={styles.tipsTitle}>Troubleshooting Tips</Text>
                    <View style={styles.tipItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                        <Text style={styles.tipText}>Check if WiFi is enabled</Text>
                    </View>
                    <View style={styles.tipItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                        <Text style={styles.tipText}>Turn off airplane mode</Text>
                    </View>
                    <View style={styles.tipItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                        <Text style={styles.tipText}>Try switching between WiFi and mobile data</Text>
                    </View>
                    <View style={styles.tipItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                        <Text style={styles.tipText}>Restart your device if problems persist</Text>
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
                                <Text style={styles.primaryButtonText}>Check Connection</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            Alert.alert(
                                'Exit App',
                                'Are you sure you want to exit the app?',
                                [
                                    { text: 'Cancel', style: 'cancel' },
                                    { text: 'Exit', style: 'destructive', onPress: () => { } }
                                ]
                            );
                        }}
                    >
                        <Ionicons name="close-circle" size={20} color="#ff4444" />
                        <Text style={styles.secondaryButtonText}>Exit App</Text>
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