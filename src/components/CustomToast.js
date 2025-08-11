import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const CustomToast = ({ text1, type, props }) => {
  const { theme } = useTheme();
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(-100);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    // Slide in, fade in, and scale animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getToastStyle = () => {
    switch (type) {
      case 'success':
        return {
          colors: ['#4CAF50', '#45A049'],
          borderLeftColor: '#2E7D32',
          icon: 'checkmark-circle',
          iconColor: '#ffffff',
          shadowColor: '#4CAF50',
          iconBgColor: 'rgba(255, 255, 255, 0.25)',
        };
      case 'error':
        return {
          colors: ['#F44336', '#D32F2F'],
          borderLeftColor: '#C62828',
          icon: 'close-circle',
          iconColor: '#ffffff',
          shadowColor: '#F44336',
          iconBgColor: 'rgba(255, 255, 255, 0.25)',
        };
      case 'warning':
        return {
          colors: ['#FF9800', '#F57C00'],
          borderLeftColor: '#E65100',
          icon: 'warning',
          iconColor: '#ffffff',
          shadowColor: '#FF9800',
          iconBgColor: 'rgba(255, 255, 255, 0.25)',
        };
      case 'info':
        return {
          colors: ['#2196F3', '#1976D2'],
          borderLeftColor: '#1565C0',
          icon: 'information-circle',
          iconColor: '#ffffff',
          shadowColor: '#2196F3',
          iconBgColor: 'rgba(255, 255, 255, 0.25)',
        };
      default:
        return {
          colors: [theme.colors.tertiary, theme.colors.secondary],
          borderLeftColor: theme.colors.border,
          icon: 'notifications',
          iconColor: theme.colors.textPrimary,
          shadowColor: theme.colors.tertiary,
          iconBgColor: 'rgba(255, 255, 255, 0.15)',
        };
    }
  };

  const toastStyle = getToastStyle();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim }
          ],
          shadowColor: toastStyle.shadowColor,
        }
      ]}
    >
      <LinearGradient
        colors={toastStyle.colors}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={[styles.borderLeft, { backgroundColor: toastStyle.borderLeftColor }]} />
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: toastStyle.iconBgColor }]}>
            <Ionicons
              name={toastStyle.icon}
              size={26}
              color={toastStyle.iconColor}
            />
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.text, { color: '#ffffff' }]} numberOfLines={3}>
              {text1}
            </Text>
            {props?.text2 && (
              <Text style={[styles.actionText, { color: 'rgba(255, 255, 255, 0.9)' }]}>
                {props.text2}
              </Text>
            )}
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 50,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 16,
    minHeight: 68,
    maxWidth: width - 32,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    borderRadius: 18,
  },
  borderLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingLeft: 26,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  textContainer: {
    flex: 1,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    marginBottom: 2,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    fontStyle: 'italic',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default CustomToast;
