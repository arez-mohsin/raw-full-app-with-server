import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const MiningButton = ({
    isMining,
    timeLeft,
    startMining,
    loading,
    miningSpeed,
    formatTime,
    hasScheduledNotification = false
}) => {
    const { theme } = useTheme();
    const [scaleValue] = React.useState(new Animated.Value(1));

    const handleStartMining = async () => {
        if (isMining || loading) return;

        // Animate button press
        Animated.sequence([
            Animated.timing(scaleValue, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(scaleValue, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();

        await startMining();
    };

    const getButtonText = () => {
        if (loading) return 'Starting...';
        if (isMining) return 'Mining in Progress';
        return 'Start Mining';
    };

    const getButtonIcon = () => {
        if (loading) return 'hourglass';
        if (isMining) return 'sync';
        return 'flash';
    };

    return (
        <View style={styles.container}>
            <Animated.View
                style={[styles.buttonContainer, { transform: [{ scale: scaleValue }] }]}
            >
                <TouchableOpacity
                    style={[
                        styles.miningButton,
                        isMining || loading
                            ? {
                                backgroundColor: theme.colors.tertiary,
                                opacity: 0.7
                            }
                            : { backgroundColor: theme.colors.accent },
                    ]}
                    onPress={handleStartMining}
                    disabled={isMining || loading}
                    activeOpacity={isMining || loading ? 1 : 0.8}
                >
                    <Ionicons
                        name={getButtonIcon()}
                        size={32}
                        color={isMining || loading ? theme.colors.textTertiary : theme.colors.primary}
                    />
                    <Text
                        style={[
                            styles.buttonText,
                            isMining || loading
                                ? { color: theme.colors.textTertiary }
                                : { color: theme.colors.primary },
                        ]}
                    >
                        {getButtonText()}
                    </Text>
                    {hasScheduledNotification && (
                        <View style={styles.notificationIndicator}>
                            <Ionicons name="notifications" size={16} color={theme.colors.accent} />
                        </View>
                    )}
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginVertical: 20,
    },
    buttonContainer: {
        marginBottom: 20,
    },
    miningButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 25,
        minWidth: 200,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    timerContainer: {
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginTop: 10,
    },
    timerLabel: {
        fontSize: 14,
        marginBottom: 8,
    },
    timerText: {
        fontSize: 20,
        fontWeight: 'bold',
        fontFamily: 'monospace',
    },
    speedText: {
        fontSize: 12,
        marginTop: 4,
    },
    notificationIndicator: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 4,
        borderWidth: 2,
        borderColor: '#4CAF50',
    },
});

export default MiningButton;
