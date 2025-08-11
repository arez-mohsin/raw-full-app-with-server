import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { View, Text, StyleSheet } from "react-native";
import { auth, db } from "./src/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import ErrorBoundary from "./src/components/ErrorBoundary";
import PerformanceMonitor from "./src/utils/PerformanceMonitor";
import DeviceLogoutChecker from "./src/components/DeviceLogoutChecker";
import { AppState } from 'react-native';
import adMobService from './src/services/AdMobService';
import BannerAd from './src/components/BannerAd';
import { useTranslation } from 'react-i18next';

// Import i18n configuration
import './src/i18n';

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

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [canClaimStreak, setCanClaimStreak] = useState(false);

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
      <BannerAd containerStyle={{ paddingBottom: insets.bottom }} />
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
});

function AppContent() {
  const { theme } = useTheme();
  const [isFirstLaunch, setIsFirstLaunch] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize ads and enable App Open on foreground
    const initializeAds = async () => {
      try {
        console.log('Initializing AdMob service...');
        await adMobService.initialize();

        // Wait a bit then preload ads
        setTimeout(async () => {
          try {
            await adMobService.preloadAds();
            console.log('Ads preloaded successfully');
          } catch (error) {
            console.warn('Failed to preload ads, trying retry mechanism:', error);
            try {
              await adMobService.retryLoadAds(2);
            } catch (retryError) {
              console.warn('Retry mechanism also failed:', retryError);
            }
          }
        }, 2000);
      } catch (error) {
        console.error('Failed to initialize AdMob:', error);
      }
    };

    initializeAds();
    const removeAppState = adMobService.enableAppOpenOnForeground(AppState);

    checkAppState();

    // Set up Firebase Auth state listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'User logged out');
      setIsAuthenticated(!!user);
      setIsLoading(false);

      // Preload ads when user is authenticated
      if (user) {
        setTimeout(async () => {
          try {
            await adMobService.preloadAds();
          } catch (error) {
            console.warn('Failed to preload ads after auth, trying retry mechanism:', error);
            try {
              await adMobService.retryLoadAds(2);
            } catch (retryError) {
              console.warn('Retry mechanism also failed after auth:', retryError);
            }
          }
        }, 1000);
      }
    });

    return () => {
      unsubscribe();
      removeAppState && removeAppState();
    };
  }, []);

  const checkAppState = async () => {
    try {
      const hasLaunched = await AsyncStorage.getItem("hasLaunched");
      setIsFirstLaunch(!hasLaunched);
    } catch (error) {
      console.log("Error checking app state:", error);
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <NavigationContainer>
      <StatusBar style={theme.dark ? "light" : "dark"} />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
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
        <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="Invite" component={InviteScreen} />
        <Stack.Screen name="Tasks" component={TasksScreen} />
        <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
        <Stack.Screen name="NetworkError" component={NetworkErrorScreen} />
        <Stack.Screen name="SecurityError" component={SecurityErrorScreen} />
      </Stack.Navigator>
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
