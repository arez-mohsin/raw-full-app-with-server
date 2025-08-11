import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    FlatList,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
const { width, height } = Dimensions.get('window');

const OnboardingScreen = ({ navigation, route }) => {
    const { t } = useTranslation();
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;
    const flatListRef = useRef(null);

    const onboardingData = [
        {
            id: 1,
            title: t('onboarding.welcomeToCryptoMining'),
            subtitle: t('onboarding.startEarningCrypto'),
            description: t('onboarding.joinMillionsUsers'),
            icon: 'diamond',
            color: '#FFD700',
        },
        {
            id: 2,
            title: t('onboarding.mineDaily'),
            subtitle: t('onboarding.simple24HourCycles'),
            description: t('onboarding.tapMiningButton'),
            icon: 'flash',
            color: '#4CAF50',
        },
        {
            id: 3,
            title: t('onboarding.inviteFriends'),
            subtitle: t('onboarding.earnBonusRewards'),
            description: t('onboarding.shareReferralCode'),
            icon: 'people',
            color: '#FF6B6B',
        },
        {
            id: 4,
            title: t('onboarding.secureWallet'),
            subtitle: t('onboarding.yourCryptoYourControl'),
            description: t('onboarding.keepEarningsSafe'),
            icon: 'wallet',
            color: '#9C27B0',
        },
    ];

    const renderOnboardingItem = ({ item, index }) => {
        const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
        ];

        const titleScale = scrollX.interpolate({
            inputRange,
            outputRange: [0.8, 1, 0.8],
            extrapolate: 'clamp',
        });

        const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.4, 1, 0.4],
            extrapolate: 'clamp',
        });

        return (
            <View style={styles.slide}>
                <Animated.View style={[styles.iconContainer, { opacity }]}>
                    <View style={[styles.iconCircle, { backgroundColor: item.color + '20' }]}>
                        <Ionicons name={item.icon} size={60} color={item.color} />
                    </View>
                </Animated.View>

                <Animated.View style={[styles.textContainer, { opacity }]}>
                    <Animated.Text style={[styles.title, { transform: [{ scale: titleScale }] }]}>
                        {item.title}
                    </Animated.Text>
                    <Text style={styles.subtitle}>{item.subtitle}</Text>
                    <Text style={styles.description}>{item.description}</Text>
                </Animated.View>
            </View>
        );
    };

    const handleNext = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (currentIndex < onboardingData.length - 1) {
            flatListRef.current?.scrollToIndex({
                index: currentIndex + 1,
                animated: true,
            });
        } else {
            handleGetStarted();
        }
    };

    const handleSkip = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        AsyncStorage.setItem('hasLaunched', 'true');
        handleGetStarted();
    };

    const handleGetStarted = async () => {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            AsyncStorage.setItem('hasLaunched', 'true');
            // Call the completion callback from route params
            if (route.params?.onComplete) {
                await route.params.onComplete();
            }

            // Navigate to Login screen after onboarding completion
            navigation.replace('Login');
        } catch (error) {
            console.log('Error completing onboarding:', error);
        }
    };

    const renderDots = () => {
        return (
            <View style={styles.dotsContainer}>
                {onboardingData.map((_, index) => {
                    const inputRange = [
                        (index - 1) * width,
                        index * width,
                        (index + 1) * width,
                    ];

                    const dotWidth = scrollX.interpolate({
                        inputRange,
                        outputRange: [8, 20, 8],
                        extrapolate: 'clamp',
                    });

                    const opacity = scrollX.interpolate({
                        inputRange,
                        outputRange: [0.4, 1, 0.4],
                        extrapolate: 'clamp',
                    });

                    return (
                        <Animated.View
                            key={index}
                            style={[
                                styles.dot,
                                {
                                    width: dotWidth,
                                    opacity,
                                },
                            ]}
                        />
                    );
                })}
            </View>
        );
    };

    return (
        <LinearGradient colors={['#1a1a1a', '#2a2a2a', '#1a1a1a']} style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                    <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                ref={flatListRef}
                data={onboardingData}
                renderItem={renderOnboardingItem}
                keyExtractor={(item) => item.id.toString()}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: false }
                )}
                onMomentumScrollEnd={(event) => {
                    const index = Math.round(event.nativeEvent.contentOffset.x / width);
                    setCurrentIndex(index);
                }}
                scrollEventThrottle={16}
            />

            {renderDots()}

            <View style={styles.footer}>
                <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                    <Text style={styles.nextButtonText}>
                        {currentIndex === onboardingData.length - 1 ? t('onboarding.getStarted') : t('common.next')}
                    </Text>
                    <Ionicons
                        name={currentIndex === onboardingData.length - 1 ? 'checkmark' : 'arrow-forward'}
                        size={20}
                        color="#000"
                    />
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
        justifyContent: 'flex-end',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20,
    },
    skipButton: {
        padding: 10,
    },
    skipText: {
        color: '#888',
        fontSize: 16,
        fontWeight: '600',
    },
    slide: {
        width,
        height: height * 0.7,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    iconContainer: {
        marginBottom: 40,
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textContainer: {
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 18,
        color: '#FFD700',
        textAlign: 'center',
        marginBottom: 16,
        fontWeight: '600',
    },
    description: {
        fontSize: 16,
        color: '#888',
        textAlign: 'center',
        lineHeight: 24,
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
    },
    dot: {
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FFD700',
        marginHorizontal: 4,
    },
    footer: {
        paddingHorizontal: 40,
        paddingBottom: 40,
    },
    nextButton: {
        backgroundColor: '#FFD700',
        borderRadius: 25,
        paddingVertical: 16,
        paddingHorizontal: 32,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    nextButtonText: {
        color: '#000',
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: 8,
    },
});

export default OnboardingScreen;
