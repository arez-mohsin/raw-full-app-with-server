import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    Alert,
    RefreshControl,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { auth, db } from '../firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import BiometricService from '../services/BiometricService';

// Loading Skeleton Components
const LoadingSkeleton = ({ theme }) => {
    const animatedValue = new Animated.Value(0);

    React.useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(animatedValue, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, []);

    const opacity = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    const insets = useSafeAreaInsets();
    return (
        <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary, theme.colors.primary]}
            style={styles.container}
        >
            <ScrollView style={[styles.scrollView, {
                paddingTop: insets.top + 10
            }]} contentContainerStyle={[styles.scrollContent, {
            }]}>
                {/* Profile Header Skeleton */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                        <Animated.View
                            style={[
                                styles.avatar,
                                {
                                    backgroundColor: theme.colors.card,
                                    borderColor: theme.colors.accent,
                                    opacity
                                }
                            ]}
                        />
                        <Animated.View
                            style={[
                                styles.editButton,
                                {
                                    backgroundColor: theme.colors.accent,
                                    opacity
                                }
                            ]}
                        />
                    </View>

                    <Animated.View
                        style={[
                            styles.skeletonText,
                            {
                                backgroundColor: theme.colors.card,
                                opacity
                            }
                        ]}
                    />
                    <Animated.View
                        style={[
                            styles.skeletonTextSmall,
                            {
                                backgroundColor: theme.colors.card,
                                opacity
                            }
                        ]}
                    />
                    <Animated.View
                        style={[
                            styles.skeletonTextSmall,
                            {
                                backgroundColor: theme.colors.card,
                                opacity
                            }
                        ]}
                    />
                </View>

                {/* Stats Cards Skeleton */}
                <View style={styles.statsContainer}>
                    {[1, 2, 3].map((index) => (
                        <Animated.View
                            key={index}
                            style={[
                                styles.statCard,
                                {
                                    backgroundColor: theme.colors.card,
                                    opacity
                                }
                            ]}
                        >
                            <Animated.View
                                style={[
                                    styles.skeletonIcon,
                                    {
                                        backgroundColor: theme.colors.accent,
                                        opacity
                                    }
                                ]}
                            />
                            <Animated.View
                                style={[
                                    styles.skeletonTextMedium,
                                    {
                                        backgroundColor: theme.colors.accent,
                                        opacity
                                    }
                                ]}
                            />
                            <Animated.View
                                style={[
                                    styles.skeletonTextSmall,
                                    {
                                        backgroundColor: theme.colors.accent,
                                        opacity
                                    }
                                ]}
                            />
                        </Animated.View>
                    ))}
                </View>

                {/* Additional Stats Skeleton */}
                <View style={styles.statsContainer}>
                    {[1, 2, 3].map((index) => (
                        <Animated.View
                            key={index}
                            style={[
                                styles.statCard,
                                {
                                    backgroundColor: theme.colors.card,
                                    opacity
                                }
                            ]}
                        >
                            <Animated.View
                                style={[
                                    styles.skeletonIcon,
                                    {
                                        backgroundColor: theme.colors.accent,
                                        opacity
                                    }
                                ]}
                            />
                            <Animated.View
                                style={[
                                    styles.skeletonTextMedium,
                                    {
                                        backgroundColor: theme.colors.accent,
                                        opacity
                                    }
                                ]}
                            />
                            <Animated.View
                                style={[
                                    styles.skeletonTextSmall,
                                    {
                                        backgroundColor: theme.colors.accent,
                                        opacity
                                    }
                                ]}
                            />
                        </Animated.View>
                    ))}
                </View>

                {/* Invite Card Skeleton */}
                <View style={styles.inviteSection}>
                    <Animated.View
                        style={[
                            styles.inviteCard,
                            {
                                backgroundColor: theme.colors.card,
                                opacity
                            }
                        ]}
                    >
                        <View style={styles.inviteHeader}>
                            <Animated.View
                                style={[
                                    styles.inviteIconContainer,
                                    {
                                        backgroundColor: theme.colors.accent,
                                        opacity
                                    }
                                ]}
                            />
                            <View style={styles.inviteTextContainer}>
                                <Animated.View
                                    style={[
                                        styles.skeletonTextMedium,
                                        {
                                            backgroundColor: theme.colors.accent,
                                            opacity
                                        }
                                    ]}
                                />
                                <Animated.View
                                    style={[
                                        styles.skeletonTextSmall,
                                        {
                                            backgroundColor: theme.colors.accent,
                                            opacity
                                        }
                                    ]}
                                />
                            </View>
                        </View>
                        <Animated.View
                            style={[
                                styles.inviteButton,
                                {
                                    backgroundColor: theme.colors.accent,
                                    opacity
                                }
                            ]}
                        />
                    </Animated.View>
                </View>

                {/* Settings Section Skeleton */}
                <View style={styles.settingsSection}>
                    <Animated.View
                        style={[
                            styles.skeletonTextMedium,
                            {
                                backgroundColor: theme.colors.accent,
                                opacity
                            }
                        ]}
                    />
                    <Animated.View
                        style={[
                            styles.settingsList,
                            {
                                backgroundColor: theme.colors.card,
                                opacity
                            }
                        ]}
                    >
                        {[1, 2].map((index) => (
                            <Animated.View
                                key={index}
                                style={[
                                    styles.settingItem,
                                    {
                                        borderBottomColor: theme.colors.border,
                                        opacity
                                    }
                                ]}
                            >
                                <View style={styles.settingLeft}>
                                    <Animated.View
                                        style={[
                                            styles.skeletonIcon,
                                            {
                                                backgroundColor: theme.colors.accent,
                                                opacity
                                            }
                                        ]}
                                    />
                                    <Animated.View
                                        style={[
                                            styles.skeletonTextMedium,
                                            {
                                                backgroundColor: theme.colors.accent,
                                                opacity
                                            }
                                        ]}
                                    />
                                </View>
                                <Animated.View
                                    style={[
                                        styles.skeletonSwitch,
                                        {
                                            backgroundColor: theme.colors.accent,
                                            opacity
                                        }
                                    ]}
                                />
                            </Animated.View>
                        ))}
                    </Animated.View>
                </View>

                {/* Menu Section Skeleton */}
                <View style={styles.menuSection}>
                    <Animated.View
                        style={[
                            styles.skeletonTextMedium,
                            {
                                backgroundColor: theme.colors.accent,
                                opacity
                            }
                        ]}
                    />
                    <Animated.View
                        style={[
                            styles.menuList,
                            {
                                backgroundColor: theme.colors.card,
                                opacity
                            }
                        ]}
                    >
                        {[1, 2, 3, 4].map((index) => (
                            <Animated.View
                                key={index}
                                style={[
                                    styles.menuItem,
                                    {
                                        borderBottomColor: theme.colors.border,
                                        opacity
                                    }
                                ]}
                            >
                                <View style={styles.menuLeft}>
                                    <Animated.View
                                        style={[
                                            styles.skeletonIcon,
                                            {
                                                backgroundColor: theme.colors.accent,
                                                opacity
                                            }
                                        ]}
                                    />
                                    <Animated.View
                                        style={[
                                            styles.skeletonTextMedium,
                                            {
                                                backgroundColor: theme.colors.accent,
                                                opacity
                                            }
                                        ]}
                                    />
                                </View>
                                <Animated.View
                                    style={[
                                        styles.skeletonIcon,
                                        {
                                            backgroundColor: theme.colors.accent,
                                            opacity
                                        }
                                    ]}
                                />
                            </Animated.View>
                        ))}
                    </Animated.View>
                </View>

                {/* Logout Button Skeleton */}
                <Animated.View
                    style={[
                        styles.logoutButton,
                        {
                            backgroundColor: theme.colors.card,
                            opacity
                        }
                    ]}
                />

                {/* Version Skeleton */}
                <View style={styles.versionContainer}>
                    <Animated.View
                        style={[
                            styles.skeletonTextSmall,
                            {
                                backgroundColor: theme.colors.accent,
                                opacity
                            }
                        ]}
                    />
                </View>
            </ScrollView>
        </LinearGradient>
    );
};

const ProfileScreen = ({ navigation }) => {
    const { theme, isDark, toggleTheme } = useTheme();
    const [userId, setUserId] = useState(null);
    const [userProfile, setUserProfile] = useState({
        username: 'CryptoMiner',
        email: 'user@example.com',
        joinDate: '2024-01-01',
        totalMined: 0,
        miningStreak: 0,
        totalReferrals: 0,
        balance: 0,
        experience: 0,
        miningLevel: 1,
        firstName: '',
        lastName: '',
    });
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [biometricStatus, setBiometricStatus] = useState({
        isAvailable: false,
        isEnabled: false,
        supportedTypes: [],
        canEnable: false,
        canDisable: false
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Configure notifications and load biometric status
    useEffect(() => {
        configureNotifications();
        loadNotificationSettings();
        loadBiometricStatus();
    }, []);

    // Set up real-time user data listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid);
                setupUserDataListener(user.uid);
                // Reload biometric status when user changes
                loadBiometricStatus();
            } else {
                setUserId(null);
            }
        });

        return unsubscribe;
    }, []);

    // Configure push notifications
    const configureNotifications = async () => {
        try {
            // Request permissions
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                console.log('Failed to get push token for push notification!');
                return;
            }

            // Get push token (without projectId for development)
            try {
                const token = await Notifications.getExpoPushTokenAsync({
                    // Remove projectId for development
                });
                console.log('Push token:', token.data);
                await AsyncStorage.setItem('pushToken', token.data);
            } catch (tokenError) {
                console.log('Push token not available (development mode):', tokenError.message);
                // Continue without push token for development
            }

        } catch (error) {
            console.error('Error configuring notifications:', error);
        }
    };

    // Load biometric status
    const loadBiometricStatus = async () => {
        try {
            if (!userId) return;

            const status = await BiometricService.getBiometricStatus(userId);
            setBiometricStatus(status);
        } catch (error) {
            console.error('Error loading biometric status:', error);
        }
    };

    // Load notification settings
    const loadNotificationSettings = async () => {
        try {
            const enabled = await AsyncStorage.getItem('notificationsEnabled');
            setNotificationsEnabled(enabled === 'true');
        } catch (error) {
            console.error('Error loading notification settings:', error);
        }
    };

    // Set up real-time user data listener
    const setupUserDataListener = (uid) => {
        const userRef = doc(db, "users", uid);
        const unsubscribe = onSnapshot(userRef, async (doc) => {
            if (doc.exists()) {
                const userData = doc.data();

                setUserProfile({
                    username: userData.username || 'CryptoMiner',
                    email: userData.email || 'user@example.com',
                    joinDate: userData.createdAt ? userData.createdAt.toDate().toISOString() : '2024-01-01',
                    totalMined: userData.totalMined || 0,
                    miningStreak: userData.streak?.currentStreak || 0,
                    totalReferrals: userData.totalReferrals || 0,
                    balance: userData.balance || 0,
                    experience: userData.experience || 0,
                    miningLevel: userData.miningLevel || 1,
                    firstName: userData.firstName || '',
                    lastName: userData.lastName || '',
                });

                // Add minimum 2-second loading delay
                const startTime = Date.now();
                const elapsedTime = Date.now() - startTime;
                const remainingTime = Math.max(0, 2000 - elapsedTime);

                if (remainingTime > 0) {
                    await new Promise(resolve => setTimeout(resolve, remainingTime));
                }

                setLoading(false);
            }
        }, (error) => {
            console.error('Error in user data listener:', error);
            setLoading(false);
        });

        return unsubscribe;
    };

    // Handle notification toggle
    const handleNotificationToggle = async (value) => {
        try {
            setNotificationsEnabled(value);
            await AsyncStorage.setItem('notificationsEnabled', value.toString());

            if (value) {
                // Request permissions if enabling
                const { status } = await Notifications.requestPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert(
                        'Permission Required',
                        'Please enable notifications in your device settings to receive mining updates.',
                        [{ text: 'OK' }]
                    );
                    setNotificationsEnabled(false);
                    await AsyncStorage.setItem('notificationsEnabled', 'false');
                }
            }
        } catch (error) {
            console.error('Error toggling notifications:', error);
        }
    };

    // Handle biometric toggle
    const handleBiometricToggle = async () => {
        if (!biometricStatus.isAvailable) {
            Alert.alert(
                'Biometric Not Available',
                'Biometric authentication is not available on this device or not set up.',
                [{ text: 'OK' }]
            );
            return;
        }

        try {
            if (!biometricStatus.isEnabled) {
                // Enable biometric
                const result = await BiometricService.enableBiometric(userId);

                if (result.success) {
                    Alert.alert('Success', 'Biometric authentication enabled successfully!');
                    // Reload biometric status
                    await loadBiometricStatus();
                } else {
                    Alert.alert('Error', result.message);
                }
            } else {
                // Disable biometric
                Alert.alert(
                    'Disable Biometric Login',
                    'Are you sure you want to disable biometric authentication? This will make your account less secure.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Disable',
                            style: 'destructive',
                            onPress: async () => {
                                const result = await BiometricService.disableBiometric(userId);

                                if (result.success) {
                                    Alert.alert('Success', 'Biometric authentication disabled successfully!');
                                    // Reload biometric status
                                    await loadBiometricStatus();
                                } else {
                                    Alert.alert('Error', result.message);
                                }
                            },
                        },
                    ]
                );
            }
        } catch (error) {
            console.error('Biometric toggle error:', error);
            Alert.alert('Error', 'Failed to update biometric settings');
        }
    };

    // Refresh profile data
    const onRefresh = async () => {
        setRefreshing(true);
        try {
            if (userId) {
                // Force reload user data
                const userRef = doc(db, "users", userId);
                const userDoc = await getDoc(userRef);

                if (userDoc.exists()) {
                    const userData = userDoc.data();

                    setUserProfile({
                        username: userData.username || 'CryptoMiner',
                        email: userData.email || 'user@example.com',
                        joinDate: userData.createdAt ? userData.createdAt.toDate().toISOString() : '2024-01-01',
                        totalMined: userData.totalMined || 0,
                        miningStreak: userData.streak?.currentStreak || 0,
                        totalReferrals: userData.totalReferrals || 0,
                        balance: userData.balance || 0,
                        experience: userData.experience || 0,
                        miningLevel: userData.miningLevel || 1,
                        firstName: userData.firstName || '',
                        lastName: userData.lastName || '',
                    });
                }

                // Reload notification settings and biometric status
                await loadNotificationSettings();
                await loadBiometricStatus();

                console.log('✅ Profile data refreshed successfully');
            }
        } catch (error) {
            console.error('❌ Error refreshing profile data:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const handleLogout = async () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await signOut(auth);
                            navigation.replace('Login');
                        } catch (error) {
                            console.log('Error during logout:', error);
                        }
                    },
                },
            ]
        );
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const insets = useSafeAreaInsets();

    // Show loading skeleton while data is loading
    if (loading) {
        return <LoadingSkeleton theme={theme} />;
    }

    return (
        <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary, theme.colors.primary]}
            style={[styles.container, {
                paddingTop: insets.top,
            }]}
        >
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.colors.accent}
                        colors={[theme.colors.accent]}
                    />
                }
            >
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                        <View style={[styles.avatar, { backgroundColor: theme.colors.card, borderColor: theme.colors.accent }]}>
                            <Ionicons name="person" size={40} color={theme.colors.accent} />
                        </View>
                        <TouchableOpacity style={[styles.editButton, { backgroundColor: theme.colors.accent }]}>
                            <Ionicons name="camera" size={16} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.username, { color: theme.colors.textPrimary }]}>
                        {userProfile.firstName && userProfile.lastName
                            ? `${userProfile.firstName} ${userProfile.lastName}`
                            : userProfile.username}
                    </Text>
                    <Text style={[styles.email, { color: theme.colors.textSecondary }]}>{userProfile.email}</Text>
                    <Text style={[styles.joinDate, { color: theme.colors.textTertiary }]}>Member since {formatDate(userProfile.joinDate)}</Text>
                </View>

                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                    <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
                        <Ionicons name="diamond" size={24} color={theme.colors.accent} />
                        <Text style={[styles.statNumber, { color: theme.colors.textPrimary }]}>{userProfile.totalMined.toFixed(2)}</Text>
                        <Text style={[styles.statLabel, { color: theme.colors.textTertiary }]}>Total Mined</Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
                        <Ionicons name="wallet" size={24} color="#4CAF50" />
                        <Text style={[styles.statNumber, { color: theme.colors.textPrimary }]}>{userProfile.balance.toFixed(2)}</Text>
                        <Text style={[styles.statLabel, { color: theme.colors.textTertiary }]}>Balance</Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
                        <Ionicons name="flame" size={24} color="#FF6B6B" />
                        <Text style={[styles.statNumber, { color: theme.colors.textPrimary }]}>{userProfile.miningStreak}</Text>
                        <Text style={[styles.statLabel, { color: theme.colors.textTertiary }]}>Day Streak</Text>
                    </View>
                </View>

                {/* Additional Stats */}
                <View style={styles.statsContainer}>
                    <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
                        <Ionicons name="trending-up" size={24} color="#FFD700" />
                        <Text style={[styles.statNumber, { color: theme.colors.textPrimary }]}>{userProfile.miningLevel}</Text>
                        <Text style={[styles.statLabel, { color: theme.colors.textTertiary }]}>Mining Level</Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
                        <Ionicons name="star" size={24} color="#FF6B35" />
                        <Text style={[styles.statNumber, { color: theme.colors.textPrimary }]}>{userProfile.experience}</Text>
                        <Text style={[styles.statLabel, { color: theme.colors.textTertiary }]}>Experience</Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
                        <Ionicons name="people" size={24} color="#4CAF50" />
                        <Text style={[styles.statNumber, { color: theme.colors.textPrimary }]}>{userProfile.totalReferrals}</Text>
                        <Text style={[styles.statLabel, { color: theme.colors.textTertiary }]}>Referrals</Text>
                    </View>
                </View>

                {/* Invite Friends Card */}
                <View style={styles.inviteSection}>
                    <View style={[styles.inviteCard, { backgroundColor: theme.colors.card }]}>
                        <View style={styles.inviteHeader}>
                            <View style={[styles.inviteIconContainer, { backgroundColor: theme.colors.accent }]}>
                                <Ionicons name="gift" size={24} color="#fff" />
                            </View>
                            <View style={styles.inviteTextContainer}>
                                <Text style={[styles.inviteTitle, { color: theme.colors.textPrimary }]}>Invite Friends</Text>
                                <Text style={[styles.inviteSubtitle, { color: theme.colors.textSecondary }]}>Get 50 coins for you and your friend!</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={[styles.inviteButton, { backgroundColor: theme.colors.accent }]}
                            onPress={() => navigation.navigate('Invite')}
                        >
                            <Ionicons name="share-social" size={20} color="#fff" />
                            <Text style={styles.inviteButtonText}>Invite Now</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Settings Section */}
                <View style={styles.settingsSection}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Settings</Text>

                    <View style={[styles.settingsList, { backgroundColor: theme.colors.card }]}>
                        <View style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}>
                            <View style={styles.settingLeft}>
                                <Ionicons name="notifications" size={20} color={theme.colors.accent} />
                                <Text style={[styles.settingText, { color: theme.colors.textPrimary }]}>Push Notifications</Text>
                            </View>
                            <Switch
                                value={notificationsEnabled}
                                onValueChange={handleNotificationToggle}
                                trackColor={{ false: '#444', true: theme.colors.accent }}
                                thumbColor={notificationsEnabled ? '#fff' : '#f4f3f4'}
                            />
                        </View>

                        <View style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}>
                            <View style={styles.settingLeft}>
                                <Ionicons name="moon" size={20} color={theme.colors.accent} />
                                <Text style={[styles.settingText, { color: theme.colors.textPrimary }]}>Dark Mode</Text>
                            </View>
                            <Switch
                                value={isDark}
                                onValueChange={toggleTheme}
                                trackColor={{ false: '#444', true: theme.colors.accent }}
                                thumbColor={isDark ? '#fff' : '#f4f3f4'}
                            />
                        </View>

                        {/* <View style={[styles.settingItem, { borderBottomColor: theme.colors.border }]}>
                            <View style={styles.settingLeft}>
                                <Ionicons name="finger-print" size={20} color={theme.colors.accent} />
                                <Text style={[styles.settingText, { color: theme.colors.textPrimary }]}>Biometric Login</Text>
                            </View>
                            <Switch
                                value={biometricStatus.isEnabled}
                                onValueChange={handleBiometricToggle}
                                trackColor={{ false: '#444', true: theme.colors.accent }}
                                thumbColor={biometricStatus.isEnabled ? '#fff' : '#f4f3f4'}
                                disabled={!biometricStatus.isAvailable}
                            />
                        </View> */}
                    </View>
                </View>

                {/* Menu Items */}
                <View style={styles.menuSection}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Account</Text>

                    <View style={[styles.menuList, { backgroundColor: theme.colors.card }]}>
                        <TouchableOpacity
                            style={[styles.menuItem, { borderBottomColor: theme.colors.border }]}
                            onPress={() => navigation.navigate('EditProfile')}
                        >
                            <View style={styles.menuLeft}>
                                <Ionicons name="person" size={20} color={theme.colors.accent} />
                                <Text style={[styles.menuText, { color: theme.colors.textPrimary }]}>Edit Profile</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.menuItem, { borderBottomColor: theme.colors.border }]}
                            onPress={() => navigation.navigate('Security')}
                        >
                            <View style={styles.menuLeft}>
                                <Ionicons name="shield-checkmark" size={20} color={theme.colors.accent} />
                                <Text style={[styles.menuText, { color: theme.colors.textPrimary }]}>Security</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.menuItem, { borderBottomColor: theme.colors.border }]}
                            onPress={() => navigation.navigate('KYC')}
                        >
                            <View style={styles.menuLeft}>
                                <Ionicons name="card" size={20} color={theme.colors.accent} />
                                <Text style={[styles.menuText, { color: theme.colors.textPrimary }]}>KYC Verification</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.menuItem, { borderBottomColor: theme.colors.border }]}
                            onPress={() => navigation.navigate('HelpSupport')}
                        >
                            <View style={styles.menuLeft}>
                                <Ionicons name="help-circle" size={20} color={theme.colors.accent} />
                                <Text style={[styles.menuText, { color: theme.colors.textPrimary }]}>Help & Support</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.menuItem, { borderBottomColor: theme.colors.border }]}
                            onPress={() => navigation.navigate('TermsOfService')}
                        >
                            <View style={styles.menuLeft}>
                                <Ionicons name="document-text" size={20} color={theme.colors.accent} />
                                <Text style={[styles.menuText, { color: theme.colors.textPrimary }]}>Terms of Service</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.menuItem, { borderBottomColor: theme.colors.border }]}
                            onPress={() => navigation.navigate('PrivacyPolicy')}
                        >
                            <View style={styles.menuLeft}>
                                <Ionicons name="lock-closed" size={20} color={theme.colors.accent} />
                                <Text style={[styles.menuText, { color: theme.colors.textPrimary }]}>Privacy Policy</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.menuItem, { borderBottomColor: theme.colors.border }]}
                            onPress={() => navigation.navigate('About')}
                        >
                            <View style={styles.menuLeft}>
                                <Ionicons name="information-circle" size={20} color={theme.colors.accent} />
                                <Text style={[styles.menuText, { color: theme.colors.textPrimary }]}>About</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={[styles.logoutButton, { backgroundColor: theme.colors.card }]} onPress={handleLogout}>
                    <Ionicons name="log-out" size={20} color="#FF6B6B" />
                    <Text style={[styles.logoutText, { color: '#FF6B6B' }]}>Logout</Text>
                </TouchableOpacity>

                {/* App Version */}
                <View style={styles.versionContainer}>
                    <Text style={[styles.versionText, { color: theme.colors.textTertiary }]}>Version 1.0.0</Text>
                </View>
            </ScrollView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
        paddingTop: 30,
    },
    scrollContent: {
        padding: 20,
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#2a2a2a',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#FFD700',
    },
    editButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#FFD700',
        alignItems: 'center',
        justifyContent: 'center',
    },
    username: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    email: {
        fontSize: 16,
        color: '#888',
        marginBottom: 8,
    },
    joinDate: {
        fontSize: 14,
        color: '#666',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    statCard: {
        backgroundColor: '#2a2a2a',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 4,
    },
    statNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: '#888',
        marginTop: 4,
    },
    settingsSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 16,
    },
    settingsList: {
        backgroundColor: '#2a2a2a',
        borderRadius: 12,
        overflow: 'hidden',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#444',
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    settingText: {
        fontSize: 16,
        color: '#fff',
        marginLeft: 12,
    },
    menuSection: {
        marginBottom: 24,
    },
    menuList: {
        backgroundColor: '#2a2a2a',
        borderRadius: 12,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#444',
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuText: {
        fontSize: 16,
        color: '#fff',
        marginLeft: 12,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    versionContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    versionText: {
        fontSize: 12,
        color: '#888',
    },
    inviteSection: {
        marginBottom: 24,
    },
    inviteCard: {
        backgroundColor: '#2a2a2a',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#FFD700',
    },
    inviteHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    inviteIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FFD700',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    inviteTextContainer: {
        flex: 1,
    },
    inviteTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    inviteSubtitle: {
        fontSize: 14,
        color: '#888',
        lineHeight: 20,
    },
    inviteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFD700',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
    },
    inviteButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        marginLeft: 8,
    },
    // Skeleton loading styles
    skeletonText: {
        height: 24,
        width: 200,
        borderRadius: 4,
        marginBottom: 8,
    },
    skeletonTextMedium: {
        height: 18,
        width: 150,
        borderRadius: 4,
        marginBottom: 8,
    },
    skeletonTextSmall: {
        height: 14,
        width: 100,
        borderRadius: 4,
        marginBottom: 4,
    },
    skeletonIcon: {
        width: 20,
        height: 20,
        borderRadius: 4,
        marginRight: 12,
    },
    skeletonSwitch: {
        width: 50,
        height: 30,
        borderRadius: 15,
    },
});

export default ProfileScreen;
