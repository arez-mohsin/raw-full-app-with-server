import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import MiningLoadingOverlay from './MiningLoadingOverlay';

const MiningLoadingDemo = () => {
    const { theme } = useTheme();
    const [showOverlay, setShowOverlay] = useState(false);

    const handleStartMining = () => {
        setShowOverlay(true);

        // Simulate mining start process
        setTimeout(() => {
            setShowOverlay(false);
        }, 4000); // Show for 4 seconds
    };

    return (
        <View style={styles.container}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
                Mining Loading Overlay Demo
            </Text>

            <TouchableOpacity
                style={[styles.demoButton, { backgroundColor: theme.colors.accent }]}
                onPress={handleStartMining}
            >
                <Ionicons name="construct" size={24} color={theme.colors.primary} />
                <Text style={[styles.buttonText, { color: theme.colors.primary }]}>
                    Test Mining Start
                </Text>
            </TouchableOpacity>

            <MiningLoadingOverlay
                visible={showOverlay}
                onComplete={() => {
                    console.log('Mining loading overlay completed');
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 30,
        textAlign: 'center',
    },
    demoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 25,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 12,
    },
});

export default MiningLoadingDemo;
