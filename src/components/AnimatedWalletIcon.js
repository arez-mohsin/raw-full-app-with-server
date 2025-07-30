import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const AnimatedWalletIcon = ({ size = 80, style }) => {
    const { theme } = useTheme();
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Pulse animation
        const pulseAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );

        // Subtle rotation animation
        const rotateAnimation = Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 3000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );

        // Glow animation
        const glowAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, {
                    toValue: 1,
                    duration: 1500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: false,
                }),
                Animated.timing(glowAnim, {
                    toValue: 0,
                    duration: 1500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: false,
                }),
            ])
        );

        pulseAnimation.start();
        rotateAnimation.start();
        glowAnimation.start();

        return () => {
            pulseAnimation.stop();
            rotateAnimation.stop();
            glowAnimation.stop();
        };
    }, []);

    const rotateInterpolate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '5deg'],
    });

    const glowOpacity = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.8],
    });

    return (
        <View style={[styles.container, style]}>
            {/* Glow effect */}
            <Animated.View
                style={[
                    styles.glow,
                    {
                        opacity: glowOpacity,
                        backgroundColor: theme.colors.accent,
                        width: size + 20,
                        height: size + 20,
                        borderRadius: (size + 20) / 2,
                    },
                ]}
            />

            {/* Animated wallet icon */}
            <Animated.View
                style={[
                    styles.iconContainer,
                    {
                        transform: [
                            { scale: pulseAnim },
                            { rotate: rotateInterpolate },
                        ],
                    },
                ]}
            >
                <Ionicons
                    name="wallet"
                    size={size}
                    color={theme.colors.accent}
                />
            </Animated.View>
        </View>
    );
};

const styles = {
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    glow: {
        position: 'absolute',
        zIndex: -1,
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
};

export default AnimatedWalletIcon; 