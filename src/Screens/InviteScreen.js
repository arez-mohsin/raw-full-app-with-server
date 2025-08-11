import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Share,
    Clipboard,
    ActivityIndicator,
    RefreshControl,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, setDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import ActivityLogger from '../utils/ActivityLogger';
import NotificationService from '../utils/NotificationService';
import ToastService from '../utils/ToastService';

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

    return (
        <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary, theme.colors.primary]}
            style={styles.container}
        >
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Header Skeleton */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
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
                                styles.skeletonTextLarge,
                                {
                                    backgroundColor: theme.colors.accent,
                                    opacity
                                }
                            ]}
                        />
                        <Animated.View
                            style={[
                                styles.skeletonIcon,
                                {
                                    backgroundColor: theme.colors.accent,
                                    opacity
                                }
                            ]}
                        />
                    </View>
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

                {/* Invite Code Card Skeleton */}
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
                            styles.codeContainer,
                            {
                                backgroundColor: theme.colors.background,
                                opacity
                            }
                        ]}
                    >
                        <Animated.View
                            style={[
                                styles.skeletonTextLarge,
                                {
                                    backgroundColor: theme.colors.accent,
                                    opacity
                                }
                            ]}
                        />
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

                    <Animated.View
                        style={[
                            styles.shareButton,
                            {
                                backgroundColor: theme.colors.accent,
                                opacity
                            }
                        ]}
                    />
                </Animated.View>

                {/* Stats Cards Skeleton */}
                <View style={styles.statsContainer}>
                    {[1, 2].map((index) => (
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

                {/* How It Works Skeleton */}
                <Animated.View
                    style={[
                        styles.howItWorksCard,
                        {
                            backgroundColor: theme.colors.card,
                            opacity
                        }
                    ]}
                >
                    <Animated.View
                        style={[
                            styles.skeletonTextMedium,
                            {
                                backgroundColor: theme.colors.accent,
                                opacity
                            }
                        ]}
                    />

                    {[1, 2, 3].map((index) => (
                        <View key={index} style={styles.stepContainer}>
                            <Animated.View
                                style={[
                                    styles.stepNumber,
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
                    ))}
                </Animated.View>

                {/* Referral Statistics Skeleton */}
                <Animated.View
                    style={[
                        styles.statsCard,
                        {
                            backgroundColor: theme.colors.card,
                            opacity
                        }
                    ]}
                >
                    <Animated.View
                        style={[
                            styles.skeletonTextMedium,
                            {
                                backgroundColor: theme.colors.accent,
                                opacity
                            }
                        ]}
                    />

                    <View style={styles.statsGrid}>
                        {[1, 2, 3, 4].map((index) => (
                            <Animated.View
                                key={index}
                                style={[
                                    styles.statBox,
                                    {
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
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
                </Animated.View>

                {/* Top Performers Skeleton */}
                <Animated.View
                    style={[
                        styles.topPerformersCard,
                        {
                            backgroundColor: theme.colors.card,
                            opacity
                        }
                    ]}
                >
                    <Animated.View
                        style={[
                            styles.skeletonTextMedium,
                            {
                                backgroundColor: theme.colors.accent,
                                opacity
                            }
                        ]}
                    />

                    {[1, 2, 3].map((index) => (
                        <Animated.View
                            key={index}
                            style={[
                                styles.performerItem,
                                {
                                    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
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
                            <View style={styles.performerInfo}>
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
                </Animated.View>

                {/* Referrals List Skeleton */}
                <View style={styles.referralsSection}>
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
                            styles.referralsList,
                            {
                                backgroundColor: theme.colors.card,
                                opacity
                            }
                        ]}
                    >
                        {[1, 2, 3].map((index) => (
                            <Animated.View
                                key={index}
                                style={[
                                    styles.referralItem,
                                    {
                                        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
                                        opacity
                                    }
                                ]}
                            >
                                <View style={styles.referralInfo}>
                                    <View style={styles.referralHeader}>
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
                                                styles.skeletonIcon,
                                                {
                                                    backgroundColor: theme.colors.accent,
                                                    opacity
                                                }
                                            ]}
                                        />
                                    </View>
                                    <Animated.View
                                        style={[
                                            styles.skeletonTextSmall,
                                            {
                                                backgroundColor: theme.colors.accent,
                                                opacity
                                            }
                                        ]}
                                    />
                                    <View style={styles.referralStats}>
                                        {[1, 2, 3].map((statIndex) => (
                                            <Animated.View
                                                key={statIndex}
                                                style={[
                                                    styles.statItem,
                                                    {
                                                        backgroundColor: theme.colors.accent,
                                                        opacity
                                                    }
                                                ]}
                                            />
                                        ))}
                                    </View>
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
                    </Animated.View>
                </View>
            </ScrollView>
        </LinearGradient>
    );
};

const InviteScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const [userId, setUserId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [inviteCode, setInviteCode] = useState('');
    const [totalReferrals, setTotalReferrals] = useState(0);
    const [totalEarned, setTotalEarned] = useState(0);
    const [referrals, setReferrals] = useState([]);
    const [copied, setCopied] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid);
                await loadInviteData(user.uid);
            } else {
                setUserId(null);
            }
        });

        return unsubscribe;
    }, []);

    const loadInviteData = async (uid) => {
        try {
            setLoading(true);
            setError(null);

            // Add minimum loading delay of 2 seconds
            const startTime = Date.now();

            const userRef = doc(db, "users", uid);
            const userDoc = await getDoc(userRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();

                // Generate invite code if user doesn't have one
                let code = userData.inviteCode;
                if (!code) {
                    code = generateInviteCode();
                    await updateDoc(userRef, {
                        inviteCode: code,
                        createdAt: userData.createdAt || new Date(),
                    });
                }

                setInviteCode(code);
                setTotalReferrals(userData.totalReferrals || 0);
                setTotalEarned(userData.totalReferralEarnings || 0);

                // Load referrals list
                await loadReferrals(uid);
            }

            // Ensure minimum 2-second loading time
            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(0, 2000 - elapsedTime);

            if (remainingTime > 0) {
                await new Promise(resolve => setTimeout(resolve, remainingTime));
            }

        } catch (error) {
            console.error('Error loading invite data:', error);
            setError('Failed to load invite data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const generateInviteCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    const loadReferrals = async (uid) => {
        try {
            const referralsQuery = query(
                collection(db, "users"),
                where("referredBy", "==", uid)
            );

            const unsubscribe = onSnapshot(referralsQuery, (snapshot) => {
                const referralsList = [];
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    referralsList.push({
                        id: doc.id,
                        username: data.username || 'Anonymous',
                        firstName: data.firstName || '',
                        lastName: data.lastName || '',
                        email: data.email || '',
                        joinedAt: data.createdAt?.toDate(),
                        earned: data.referralBonus || 0,
                        isActive: data.lastLogin ?
                            (new Date() - data.lastLogin.toDate()) < (7 * 24 * 60 * 60 * 1000) : false,
                        miningLevel: data.miningLevel || 1,
                        totalMined: data.totalMined || 0,
                        balance: data.balance || 0,
                    });
                });
                setReferrals(referralsList);
            }, (error) => {
                console.error('Error in referrals listener:', error);
                // Handle permission error gracefully
                if (error.code === 'permission-denied') {
                    console.log('Referrals permission denied - this is expected for new users');
                    setReferrals([]); // Set empty array instead of showing error
                } else {
                    console.error('Unexpected error in referrals listener:', error);
                    setReferrals([]); // Set empty array for any other errors
                }
            });

            return unsubscribe;
        } catch (error) {
            console.error('Error loading referrals:', error);
            // Handle permission error gracefully
            if (error.code === 'permission-denied') {
                console.log('Referrals permission denied - this is expected for new users');
                setReferrals([]); // Set empty array instead of showing error
            } else {
                console.error('Unexpected error loading referrals:', error);
                setReferrals([]); // Set empty array for any other errors
            }
        }
    };

    const copyInviteCode = async () => {
        try {
            await Clipboard.setString(inviteCode);
            setCopied(true);

            ToastService.success('Invite code copied to clipboard');

            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Error copying invite code:', error);
        }
    };

    const shareInviteCode = async () => {
        try {
            const shareMessage = `🎉 Join me on CryptoMiner and earn 50 coins!\n\nUse my invite code: ${inviteCode}\n\nDownload the app and enter this code during registration to get your bonus!`;

            await Share.share({
                message: shareMessage,
                title: 'Invite you to CryptoMiner',
            });
        } catch (error) {
            console.error('Error sharing invite code:', error);
        }
    };

    const getReferralStatus = (referral) => {
        if (referral.earned > 0) {
            return { text: 'Bonus Paid', color: '#4CAF50' };
        }
        return { text: 'Pending', color: '#FF9800' };
    };

    const formatDate = (date) => {
        if (!date) return 'Unknown';
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const onRefresh = async () => {
        try {
            setRefreshing(true);
            setError(null);
            const user = auth.currentUser;
            if (user) {
                await loadInviteData(user.uid);
            }
        } catch (error) {
            console.error('Error refreshing invite data:', error);
            setError('Failed to refresh data. Please try again.');
        } finally {
            setRefreshing(false);
        }
    };

    // Show loading skeleton while data is loading
    if (loading) {
        return <LoadingSkeleton theme={theme} />;
    }

    return (
        <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary, theme.colors.primary]}
            style={[styles.container, { paddingTop: insets.top }]}
        >
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[theme.colors.accent]}
                        tintColor={theme.colors.accent}
                        title="Pull to refresh"
                        titleColor={theme.colors.textSecondary}
                    />
                }
            >
                {/* Error Message */}
                {error && (
                    <View style={[styles.errorContainer, { backgroundColor: theme.colors.card }]}>
                        <Ionicons name="warning" size={20} color="#FF6B6B" />
                        <Text style={[styles.errorText, { color: '#FF6B6B' }]}>{error}</Text>
                    </View>
                )}

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Ionicons name="arrow-back" size={24} color={theme.colors.accent} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
                            {t('invite.inviteFriends')}
                        </Text>
                        <TouchableOpacity
                            style={[styles.refreshButton, { backgroundColor: theme.colors.accent }]}
                            onPress={onRefresh}
                            disabled={refreshing}
                        >
                            <Ionicons
                                name={refreshing ? "sync" : "refresh"}
                                size={20}
                                color="#fff"
                            />
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
                        Share your invite code and earn 50 coins for each friend who joins!
                    </Text>
                </View>

                {/* Invite Code Card */}
                <View style={[styles.inviteCard, { backgroundColor: theme.colors.card }]}>
                    <View style={styles.inviteHeader}>
                        <Ionicons name="gift" size={24} color={theme.colors.accent} />
                        <Text style={[styles.inviteTitle, { color: theme.colors.textPrimary }]}>
                            Your Invite Code
                        </Text>
                    </View>

                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={copyInviteCode}
                        style={[styles.codeContainer, { backgroundColor: theme.colors.background }]}
                    >
                        <Text style={[styles.inviteCode, { color: theme.colors.accent }]}>
                            {inviteCode}
                        </Text>
                        <TouchableOpacity
                            style={[styles.copyButton, { backgroundColor: theme.colors.accent }]}
                            onPress={copyInviteCode}
                        >
                            <Ionicons
                                name={copied ? "checkmark" : "copy"}
                                size={20}
                                color="#fff"
                            />
                        </TouchableOpacity>
                    </TouchableOpacity>

                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={[styles.shareButton, { backgroundColor: theme.colors.accent }]}
                            onPress={shareInviteCode}
                        >
                            <Ionicons name="share-social" size={20} color="#fff" />
                            <Text style={styles.shareButtonText}>Share Invite</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                    <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
                        <Ionicons name="people" size={24} color="#4CAF50" />
                        {refreshing ? (
                            <ActivityIndicator size="small" color={theme.colors.accent} style={{ marginVertical: 8 }} />
                        ) : (
                            <Text style={[styles.statNumber, { color: theme.colors.textPrimary }]}>
                                {totalReferrals}
                            </Text>
                        )}
                        <Text style={[styles.statLabel, { color: theme.colors.textTertiary }]}>
                            {t('invite.totalReferrals')}
                        </Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
                        <Ionicons name="diamond" size={24} color="#FFD700" />
                        {refreshing ? (
                            <ActivityIndicator size="small" color={theme.colors.accent} style={{ marginVertical: 8 }} />
                        ) : (
                            <Text style={[styles.statNumber, { color: theme.colors.textPrimary }]}>
                                {totalEarned.toFixed(0)}
                            </Text>
                        )}
                        <Text style={[styles.statLabel, { color: theme.colors.textTertiary }]}>
                            {t('invite.totalEarned')}
                        </Text>
                    </View>
                </View>

                {/* How It Works */}
                <View style={[styles.howItWorksCard, { backgroundColor: theme.colors.card }]}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                        {t('invite.howItWorks')}
                    </Text>

                    <View style={styles.stepContainer}>
                        <View style={[styles.stepNumber, { backgroundColor: theme.colors.accent }]}>
                            <Text style={styles.stepNumberText}>1</Text>
                        </View>
                        <Text style={[styles.stepText, { color: theme.colors.textSecondary }]}>
                            {t('invite.shareInviteCodeWithFriends')}
                        </Text>
                    </View>

                    <View style={styles.stepContainer}>
                        <View style={[styles.stepNumber, { backgroundColor: theme.colors.accent }]}>
                            <Text style={styles.stepNumberText}>2</Text>
                        </View>
                        <Text style={[styles.stepText, { color: theme.colors.textSecondary }]}>
                            {t('invite.friendEntersCodeDuringRegistration')}
                        </Text>
                    </View>

                    <View style={styles.stepContainer}>
                        <View style={[styles.stepNumber, { backgroundColor: theme.colors.accent }]}>
                            <Text style={styles.stepNumberText}>3</Text>
                        </View>
                        <Text style={[styles.stepText, { color: theme.colors.textSecondary }]}>
                            {t('invite.bothGet50Coins')}
                        </Text>
                    </View>
                </View>

                {/* Referral Statistics */}
                {referrals.length > 0 && (
                    <View style={[styles.statsCard, { backgroundColor: theme.colors.card }]}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                            {t('invite.referralStatistics')}
                        </Text>

                        <View style={styles.statsGrid}>
                            <View style={styles.statBox}>
                                <Ionicons name="people" size={20} color="#4CAF50" />
                                <Text style={[styles.statBoxNumber, { color: theme.colors.textPrimary }]}>
                                    {referrals.length}
                                </Text>
                                <Text style={[styles.statBoxLabel, { color: theme.colors.textTertiary }]}>
                                    Total Referrals
                                </Text>
                            </View>

                            <View style={styles.statBox}>
                                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                                <Text style={[styles.statBoxNumber, { color: theme.colors.textPrimary }]}>
                                    {referrals.filter(r => r.isActive).length}
                                </Text>
                                <Text style={[styles.statBoxLabel, { color: theme.colors.textTertiary }]}>
                                    Active Users
                                </Text>
                            </View>

                            <View style={styles.statBox}>
                                <Ionicons name="trophy" size={20} color="#FFD700" />
                                <Text style={[styles.statBoxNumber, { color: theme.colors.textPrimary }]}>
                                    {Math.max(...referrals.map(r => r.miningLevel), 1)}
                                </Text>
                                <Text style={[styles.statBoxLabel, { color: theme.colors.textTertiary }]}>
                                    Highest Level
                                </Text>
                            </View>

                            <View style={styles.statBox}>
                                <Ionicons name="trending-up" size={20} color="#FF6B35" />
                                <Text style={[styles.statBoxNumber, { color: theme.colors.textPrimary }]}>
                                    {referrals.reduce((sum, r) => sum + r.totalMined, 0).toFixed(1)}
                                </Text>
                                <Text style={[styles.statBoxLabel, { color: theme.colors.textTertiary }]}>
                                    Total Mined
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Top Performers */}
                {referrals.length > 0 && (
                    <View style={[styles.topPerformersCard, { backgroundColor: theme.colors.card }]}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                            Top Performers
                        </Text>

                        {referrals
                            .sort((a, b) => b.totalMined - a.totalMined)
                            .slice(0, 3)
                            .map((referral, index) => (
                                <View key={referral.id} style={styles.performerItem}>
                                    <View style={styles.performerRank}>
                                        <Text style={[styles.rankText, { color: theme.colors.textPrimary }]}>
                                            #{index + 1}
                                        </Text>
                                    </View>
                                    <View style={styles.performerInfo}>
                                        <Text style={[styles.performerName, { color: theme.colors.textPrimary }]}>
                                            {referral.firstName && referral.lastName
                                                ? `${referral.firstName} ${referral.lastName}`
                                                : referral.username
                                            }
                                        </Text>
                                        <Text style={[styles.performerUsername, { color: theme.colors.textSecondary }]}>
                                            @{referral.username}
                                        </Text>
                                    </View>
                                    <View style={styles.performerStats}>
                                        <Text style={[styles.performerMined, { color: theme.colors.accent }]}>
                                            {referral.totalMined.toFixed(1)} mined
                                        </Text>
                                        <Text style={[styles.performerLevel, { color: theme.colors.textTertiary }]}>
                                            Level {referral.miningLevel}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                    </View>
                )}

                {/* Referrals List */}
                {referrals.length > 0 && (
                    <View style={styles.referralsSection}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                            Your Referrals ({referrals.length})
                        </Text>

                        <View style={[styles.referralsList, { backgroundColor: theme.colors.card }]}>
                            {referrals.map((referral, index) => (
                                <View
                                    key={referral.id}
                                    style={[
                                        styles.referralItem,
                                        {
                                            borderBottomColor: theme.colors.border,
                                            borderBottomWidth: index < referrals.length - 1 ? 1 : 0
                                        }
                                    ]}
                                >
                                    <View style={styles.referralInfo}>
                                        <View style={styles.referralHeader}>
                                            <Text style={[styles.referralName, { color: theme.colors.textPrimary }]}>
                                                {referral.firstName && referral.lastName
                                                    ? `${referral.firstName} ${referral.lastName}`
                                                    : referral.username
                                                }
                                            </Text>
                                            <View style={[
                                                styles.activeIndicator,
                                                { backgroundColor: referral.isActive ? '#4CAF50' : '#9E9E9E' }
                                            ]}>
                                                <Text style={styles.activeIndicatorText}>
                                                    {referral.isActive ? '●' : '○'}
                                                </Text>
                                            </View>
                                        </View>

                                        <Text style={[styles.referralUsername, { color: theme.colors.textSecondary }]}>
                                            @{referral.username}
                                        </Text>

                                        <View style={styles.referralStats}>
                                            <View style={styles.statItem}>
                                                <Ionicons name="trophy" size={14} color="#FFD700" />
                                                <Text style={[styles.statText, { color: theme.colors.textTertiary }]}>
                                                    Level {referral.miningLevel}
                                                </Text>
                                            </View>
                                            <View style={styles.statItem}>
                                                <Ionicons name="diamond" size={14} color="#FFD700" />
                                                <Text style={[styles.statText, { color: theme.colors.textTertiary }]}>
                                                    {referral.totalMined.toFixed(1)} mined
                                                </Text>
                                            </View>
                                            <View style={styles.statItem}>
                                                <Ionicons name="wallet" size={14} color="#4CAF50" />
                                                <Text style={[styles.statText, { color: theme.colors.textTertiary }]}>
                                                    {referral.balance.toFixed(0)} coins
                                                </Text>
                                            </View>
                                        </View>

                                        <Text style={[styles.referralDate, { color: theme.colors.textTertiary }]}>
                                            Joined {formatDate(referral.joinedAt)}
                                        </Text>
                                    </View>

                                    <View style={styles.referralStatus}>
                                        <Text style={[
                                            styles.statusText,
                                            { color: getReferralStatus(referral).color }
                                        ]}>
                                            {getReferralStatus(referral).text}
                                        </Text>
                                        <Text style={[styles.earnedText, { color: theme.colors.textSecondary }]}>
                                            +{referral.earned} coins
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Empty State */}
                {referrals.length === 0 && (
                    <View style={[styles.emptyState, { backgroundColor: theme.colors.card }]}>
                        <Ionicons name="people-outline" size={64} color={theme.colors.textTertiary} />
                        <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
                            No Referrals Yet
                        </Text>
                        <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
                            Share your invite code with friends to start earning rewards!
                        </Text>
                    </View>
                )}
            </ScrollView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 8,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        flex: 1,
    },
    refreshButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    headerSubtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 22,
    },
    inviteCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    inviteHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    inviteTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 12,
    },
    codeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    inviteCode: {
        fontSize: 24,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    copyButton: {
        padding: 8,
        borderRadius: 8,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    shareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
    },
    shareButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 8,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    statCard: {
        flex: 1,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginHorizontal: 4,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        marginTop: 4,
    },
    howItWorksCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    stepContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    stepNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    stepNumberText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    stepText: {
        fontSize: 16,
        flex: 1,
    },
    referralsSection: {
        marginBottom: 20,
    },
    referralsList: {
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    referralItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    referralInfo: {
        flex: 1,
    },
    referralHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    referralName: {
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
    },
    activeIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginLeft: 8,
    },
    activeIndicatorText: {
        fontSize: 8,
        color: '#fff',
        textAlign: 'center',
        lineHeight: 8,
    },
    referralUsername: {
        fontSize: 12,
        marginBottom: 8,
    },
    referralStats: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 8,
        gap: 12,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        fontSize: 11,
    },
    referralDate: {
        fontSize: 12,
    },
    referralStatus: {
        alignItems: 'flex-end',
    },
    statusText: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    earnedText: {
        fontSize: 12,
    },
    emptyState: {
        borderRadius: 16,
        padding: 40,
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    statsCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
    },
    statBox: {
        width: '48%',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    statBoxNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 8,
        marginBottom: 4,
    },
    statBoxLabel: {
        fontSize: 12,
        textAlign: 'center',
    },
    topPerformersCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    performerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    performerRank: {
        width: 30,
        alignItems: 'center',
        marginRight: 12,
    },
    rankText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    performerInfo: {
        flex: 1,
    },
    performerName: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    performerUsername: {
        fontSize: 12,
    },
    performerStats: {
        alignItems: 'flex-end',
    },
    performerMined: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    performerLevel: {
        fontSize: 12,
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    // Error styles
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
    },
    errorText: {
        marginLeft: 8,
        fontSize: 14,
        flex: 1,
    },
    // Skeleton loading styles
    skeletonTextLarge: {
        height: 28,
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
});

export default InviteScreen;
