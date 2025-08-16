import React, { useState, useEffect } from "react";
import { NavigationContainer, DefaultTheme as NavigationDefaultTheme, DarkTheme as NavigationDarkTheme, useNavigation } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { BlurView } from 'expo-blur';
import { auth, db } from "./src/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import ErrorBoundary from "./src/components/ErrorBoundary";
import PerformanceMonitor from "./src/utils/PerformanceMonitor";
import DeviceLogoutChecker from "./src/components/DeviceLogoutChecker";
import { AppState } from 'react-native';
import UserStatusService from './src/services/UserStatusService';
import { useAppState } from './src/hooks/useAppState';

import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { toastConfig } from './src/config/toastConfig';


// Import i18n configuration
import './src/i18n';
ErrorUtils.setGlobalHandler((error, isFatal) => {
  console.error('Global Error:', error);
});

// Import screens
import SplashScreen from "./src/Screens/SplashScreen";
import OnboardingScreen from "./src/Screens/OnboardingScreen";
import LoginScreen from "./src/Screens/LoginScreen";
import ForgotPasswordScreen from "./src/Screens/ForgotPasswordScreen";
import RegisterScreen from "./src/Screens/RegisterScreen";
import EmailVerificationScreen from "./src/Screens/EmailVerificationScreen";
import HomeScreen from "./src/Screens/HomeScreen";
import WalletScreen from "./src/Screens/WalletScreen";
import InviteScreen from "./src/Screens/InviteScreen";
import ProfileScreen from "./src/Screens/ProfileScreen";
import DailyStreakScreen from "./src/Screens/DailyStreakScreen";
import UpgradeScreen from "./src/Screens/UpgradeScreen";
import ActivityListScreen from "./src/Screens/ActivityListScreen";
import NotificationListScreen from "./src/Screens/NotificationListScreen";
import KYCScreen from "./src/Screens/KYCScreen";
import EditProfileScreen from "./src/Screens/EditProfileScreen";
import SecurityScreen from "./src/Screens/SecurityScreen";
import HelpSupportScreen from "./src/Screens/HelpSupportScreen";
import TermsOfServiceScreen from "./src/Screens/TermsOfServiceScreen";
import PrivacyPolicyScreen from "./src/Screens/PrivacyPolicyScreen";
import AboutScreen from "./src/Screens/AboutScreen";
import TasksScreen from "./src/Screens/TasksScreen";
import LeaderboardScreen from "./src/Screens/LeaderboardScreen";
import NetworkErrorScreen from "./src/Screens/NetworkErrorScreen";
import SecurityErrorScreen from "./src/Screens/SecurityErrorScreen";
import ToastDemo from "./src/components/ToastDemo";
import LanguageSelectionScreen from "./src/Screens/LanguageSelectionScreen";
import ProfileLanguageScreen from "./src/Screens/ProfileLanguageScreen";
import ChangePasswordScreen from "./src/Screens/ChangePasswordScreen";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [canClaimStreak, setCanClaimStreak] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    checkStreakClaimStatus();
  }, []);

  const checkStreakClaimStatus = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const streakData = userData.streak || {};
        const lastClaimDate = streakData.lastClaimDate;

        if (!lastClaimDate) {
          setCanClaimStreak(true);
          return;
        }

        const lastClaim = new Date(lastClaimDate.toDate());
        const today = new Date();

        // Check if it's a new day (after midnight)
        const isNewDay = today.getDate() !== lastClaim.getDate() ||
          today.getMonth() !== lastClaim.getMonth() ||
          today.getFullYear() !== lastClaim.getFullYear();

        // Check if it's been more than 24 hours since last claim
        const hoursSinceLastClaim = (today - lastClaim) / (1000 * 60 * 60);
        const canClaimToday = hoursSinceLastClaim >= 24;

        setCanClaimStreak(isNewDay && canClaimToday);
      }
    } catch (error) {
      console.error('Error checking streak claim status:', error);
    }
  };

  const renderTabIcon = ({ route, focused, color, size }) => {
    let iconName = "home";

    if (route.name === "Home") {
      iconName = focused ? "home" : "home-outline";
    } else if (route.name === "Wallet") {
      iconName = focused ? "wallet" : "wallet-outline";
    } else if (route.name === "Streak") {
      iconName = focused ? "flame" : "flame-outline";
    } else if (route.name === "Upgrade") {
      iconName = focused ? "rocket" : "rocket-outline";
    } else if (route.name === "Profile") {
      iconName = focused ? "person" : "person-outline";
    }

    if (route.name === "Streak" && canClaimStreak) {
      return (
        <View style={styles.tabIconContainer}>
          <Ionicons
            name={iconName}
            size={size}
            color={canClaimStreak ? "#FF6B35" : color}
          />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>!</Text>
          </View>
        </View>
      );
    }

    return <Ionicons name={iconName} size={size} color={color} />;
  };

  return (
    <>
      {/* Floating Task Button */}
      <TouchableOpacity
        style={[
          styles.floatingTaskButton,
          {
            backgroundColor: theme.colors.accent,
            bottom: insets.bottom + 65 + 5, // 60 (tab height) + 5 (padding) + 5 (gap)
            right: 20
          }
        ]}
        onPress={() => navigation.navigate('Tasks')}
        activeOpacity={0.8}
      >
        <Ionicons name="list" size={28} color="#fff" />
      </TouchableOpacity>

      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: (props) => renderTabIcon({ route, ...props }),
          tabBarActiveTintColor: theme.colors.accent,
          tabBarInactiveTintColor: theme.colors.textTertiary,
          tabBarStyle: {
            backgroundColor: theme.colors.primary,
            borderTopColor: theme.colors.border,
            paddingBottom: insets.bottom + 5,
            paddingTop: 5,
            height: 60 + insets.bottom,

          },
          headerShown: false,
        })}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarLabel: t('navigation.home'),
          }}
        />
        <Tab.Screen
          name="Streak"
          component={DailyStreakScreen}
          options={{
            tabBarLabel: t('navigation.streak'),
          }}
        />
        <Tab.Screen
          name="Upgrade"
          component={UpgradeScreen}
          options={{
            tabBarLabel: t('navigation.upgrade'),
          }}
        />
        <Tab.Screen
          name="Wallet"
          component={WalletScreen}
          options={{
            tabBarLabel: t('navigation.wallet'),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarLabel: t('navigation.profile'),
          }}
        />
      </Tab.Navigator>

    </>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -8,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  floatingTaskButton: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000,
  },
});

function AppContent() {
  const { theme } = useTheme();
  const [isFirstLaunch, setIsFirstLaunch] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Use custom hook for app state management
  useAppState();

  const checkAppState = async () => {
    try {
      // await AsyncStorage.clear();
      const hasLaunched = await AsyncStorage.getItem("hasLaunched");
      setIsFirstLaunch(!hasLaunched);
    } catch (error) {
      console.log("Error checking app state:", error);
    }
  };

  useEffect(() => {
    checkAppState();

    // Set up Firebase Auth state listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'User logged out');
      setIsAuthenticated(!!user);
      setIsLoading(false);

      // Initialize user status service when auth state changes
      if (user) {
        UserStatusService.handleUserLogin(user);
      } else {
        // Clean up when user logs out
        UserStatusService.handleUserLogout();
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Handle app unmounting to set user offline
  useEffect(() => {
    return () => {
      if (isAuthenticated) {
        UserStatusService.setUserOffline();
      }
    };
  }, [isAuthenticated]);

  if (isLoading) {
    return null;
  }

  return (
    <NavigationContainer
      documentTitle={{
        formatter: (options, route) => `${options?.title ?? route?.name}`,
      }}
      theme={(function () {
        const base = theme.dark ? NavigationDarkTheme : NavigationDefaultTheme;
        const fonts = {
          regular: { fontFamily: 'System', fontWeight: '400' },
          medium: { fontFamily: 'System', fontWeight: '500' },
          light: { fontFamily: 'System', fontWeight: '300' },
          thin: { fontFamily: 'System', fontWeight: '100' },
        };
        return {
          ...base,
          colors: {
            ...base.colors,
            background: theme.dark ? '#000' : '#fff',
          },
          fonts: {
            ...(base.fonts || {}),
            ...fonts,
          },
        };
      })()}
      style={{}}
    >
      <StatusBar style={'auto'} />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="LanguageSelection" component={LanguageSelectionScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen name="ActivityList" component={ActivityListScreen} />
        <Stack.Screen name="NotificationList" component={NotificationListScreen} />
        <Stack.Screen name="KYC" component={KYCScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="Security" component={SecurityScreen} />
        <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
        <Stack.Screen
          name="ProfileLanguage"
          component={ProfileLanguageScreen}
          options={{
            presentation: 'modal',
            headerShown: true,
            headerTitle: 'Language',
            headerTitleStyle: {
              color: theme.colors.textPrimary,
            },
            headerStyle: {
              backgroundColor: theme.colors.primary,
            }
          }}
        />
        <Stack.Screen
          name="ChangePassword"
          component={ChangePasswordScreen}
          options={{
            presentation: 'modal',
            headerShown: true,
            headerTitle: 'Change Password',
            headerTitleStyle: {
              color: '#fff',
            },
            headerLef: () => (
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
            ),
            headerStyle: {
              backgroundColor: '#1a1a1a',
            }
          }}
        />
        <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="Invite" component={InviteScreen} />
        <Stack.Screen name="Tasks"
          options={{
            headerShown: true,
            headerTitle: 'Daily Tasks',
            headerTitleStyle: {
              color: '#fff',
            },
            headerBackTitle: 'Back',
            headerStyle: {
              backgroundColor: '#1a1a1a',
            },
            headerTransparent: true,
            headerBlurEffect: 'dark',
            headerBackground: () => (
              <BlurView
                intensity={50}
                tint="dark"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
              />
            ),
          }}
          component={TasksScreen} />
        <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
        <Stack.Screen name="NetworkError" component={NetworkErrorScreen} />
        <Stack.Screen name="SecurityError" component={SecurityErrorScreen} />
        <Stack.Screen name="ToastDemo" component={ToastDemo} />
      </Stack.Navigator>
      <Toast />
    </NavigationContainer>
  );
}

export default function App() {
  // Initialize performance monitoring
  React.useEffect(() => {
    PerformanceMonitor.startMonitoring();
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
