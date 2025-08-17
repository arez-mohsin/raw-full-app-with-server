import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAdMob } from '../hooks/useAdMob';

const AdMobTestComponent = () => {
    const { showRewardedAd, isRewardedAdReady, isBannerAdReady } = useAdMob();
    const [testResult, setTestResult] = useState('');

    const testRewardedAd = async () => {
        try {
            setTestResult('Testing rewarded ad...');
            const result = await showRewardedAd();

            if (result.success && result.rewardEarned) {
                setTestResult('✅ Rewarded ad completed successfully!');
                Alert.alert('Success', 'Rewarded ad completed and reward earned!');
            } else {
                setTestResult(`❌ Rewarded ad failed: ${result.reason}`);
                Alert.alert('Failed', `Rewarded ad failed: ${result.reason}`);
            }
        } catch (error) {
            setTestResult(`❌ Error: ${error.message}`);
            Alert.alert('Error', `Error testing rewarded ad: ${error.message}`);
        }
    };



    return (
        <View style={styles.container}>
            <Text style={styles.title}>AdMob Test Component</Text>

            <View style={styles.statusContainer}>
                <Text style={styles.statusText}>
                    Rewarded Ad: {isRewardedAdReady ? '✅ Ready' : '❌ Not Ready'}
                </Text>

                <Text style={styles.statusText}>
                    Banner Ad: {isBannerAdReady ? '✅ Ready' : '❌ Not Ready'}
                </Text>
            </View>

            <TouchableOpacity
                style={[styles.button, !isRewardedAdReady && styles.buttonDisabled]}
                onPress={testRewardedAd}
                disabled={!isRewardedAdReady}
            >
                <Text style={styles.buttonText}>Test Rewarded Ad</Text>
            </TouchableOpacity>



            <TouchableOpacity
                style={[styles.button, !isBannerAdReady && styles.buttonDisabled]}
                onPress={() => {
                    setTestResult('✅ Banner ads are displayed automatically at the bottom of the screen');
                    Alert.alert('Info', 'Banner ads are displayed automatically at the bottom of the screen');
                }}
                disabled={!isBannerAdReady}
            >
                <Text style={styles.buttonText}>Info: Banner Ad</Text>
            </TouchableOpacity>

            {testResult ? (
                <View style={styles.resultContainer}>
                    <Text style={styles.resultText}>{testResult}</Text>
                </View>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        margin: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        color: '#333',
    },
    statusContainer: {
        marginBottom: 20,
    },
    statusText: {
        fontSize: 14,
        marginBottom: 5,
        color: '#666',
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#ccc',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    resultContainer: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    resultText: {
        fontSize: 14,
        textAlign: 'center',
        color: '#333',
    },
});

export default AdMobTestComponent;
