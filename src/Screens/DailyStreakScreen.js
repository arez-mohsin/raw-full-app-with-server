import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useFocusEffect } from '@react-navigation/native';
import ActivityLogger from '../utils/ActivityLogger';
import NotificationService from '../utils/NotificationService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import adMobService from '../services/AdMobService';

const DailyStreakScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const [streak, setStreak] = useState(0);
    const [lastClaimDate, setLastClaimDate] = useState(null);
    const [canClaim, setCanClaim] = useState(false);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState(false);
    const [totalEarned, setTotalEarned] = useState(0);

    // Linear coin rewards (day 1: 1 coin, day 2: 2 coins, etc.)
    const getRewardForDay = (day) => {
        if (day <= 0) return 0;
        if (day <= 30) {
            // Simple linear progression: day 1 = 1 coin, day 2 = 2 coins, ..., day 30 = 30 coins
            return day;
        }
        return 0; // Reset after 30 days
    };

    const getOrdinalDay = (day) => {
        if (day >= 11 && day <= 13) {
            return `${day}th`;
        }

        switch (day % 10) {
            case 1:
                return `${day}st`;
            case 2:
                return `${day}nd`;
            case 3:
                return `${day}rd`;
            default:
                return `${day}th`;
        }
    };

    const loadStreakData = useCallback(async () => {
        try {
            const user = auth.currentUser;
            if (!user) return;

            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                const streakData = userData.streak || {};

                setStreak(streakData.currentStreak || 0);
                setLastClaimDate(streakData.lastClaimDate ? new Date(streakData.lastClaimDate.toDate()) : null);
                setTotalEarned(streakData.totalEarned || 0);

                checkIfCanClaim(streakData.lastClaimDate);
            }
        } catch (error) {
            console.error('Error loading streak data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const checkIfCanClaim = (lastClaim) => {
        if (!lastClaim) {
            setCanClaim(true);
            return;
        }

        const lastClaimDate = new Date(lastClaim.toDate());
        const today = new Date();

        // Check if it's a new day (after midnight)
        const isNewDay = today.getDate() !== lastClaimDate.getDate() ||
            today.getMonth() !== lastClaimDate.getMonth() ||
            today.getFullYear() !== lastClaimDate.getFullYear();

        // Check if it's been more than 24 hours since last claim
        const hoursSinceLastClaim = (today - lastClaimDate) / (1000 * 60 * 60);
        const canClaimToday = hoursSinceLastClaim >= 24;

        setCanClaim(isNewDay && canClaimToday);
    };

    // Refresh data when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            loadStreakData();
        }, [loadStreakData])
    );

    useEffect(() => {
        loadStreakData();

        // Check ad availability when component mounts
        setTimeout(async () => {
            try {
                const adStatus = await adMobService.checkAdAvailability();
                console.log('DailyStreakScreen - Ad availability check result:', adStatus);
            } catch (error) {
                console.warn('DailyStreakScreen - Failed to check ad availability:', error);
            }
        }, 2000);
    }, [loadStreakData]);

    const handleDailyClaim = async () => {
        if (!canClaim || claiming) return;

        setClaiming(true);
        try {
            // Check if rewarded ad is ready before offering it
            let rewardedEarned = false;
            if (adMobService.isRewardedAdReady()) {
                console.log('Rewarded ad is ready, showing ad before streak claim...');
                // Offer rewarded ad before claim
                rewardedEarned = await adMobService.showRewardedAdSafely('streak_claim');
            } else if (adMobService.shouldSkipAds()) {
                console.log('Skipping ads due to fallback mode, claiming streak directly...');
                // Skip ads and claim streak directly
            } else {
                console.log('Rewarded ad not ready, claiming without ad');
                // Debug ad status
                adMobService.debugAdStatus();
                // Try to preload ads for next time
                setTimeout(() => {
                    adMobService.preloadAds();
                }, 1000);
            }

            let bonusCoins = 0;
            if (rewardedEarned) {
                bonusCoins = 2;
            }

            const user = auth.currentUser;
            if (!user) throw new Error('User not authenticated');

            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                throw new Error('User document not found');
            }

            const userData = userDoc.data();
            const currentStreak = userData.streak?.currentStreak || 0;
            const lastClaimDate = userData.streak?.lastClaimDate;

            // Check if streak should continue or reset
            let newStreak = currentStreak + 1;
            let reward = getRewardForDay(newStreak);

            if (lastClaimDate) {
                const lastClaim = new Date(lastClaimDate.toDate());
                const today = new Date();
                const daysDifference = Math.floor((today - lastClaim) / (1000 * 60 * 60 * 24));

                if (daysDifference > 1) {
                    // Streak broken, reset to day 1
                    newStreak = 1;
                    reward = getRewardForDay(1);
                } else if (daysDifference === 0) {
                    // Already claimed today
                    Alert.alert('Already Claimed', 'You have already claimed your daily reward today!');
                    return;
                }
            }

            // Check if streak exceeds 30 days
            if (newStreak > 30) {
                newStreak = 1;
                reward = getRewardForDay(1);
            }

            // Update user document
            const totalEarned = (userData.streak?.totalEarned || 0) + reward + bonusCoins;
            const currentBalance = (userData.balance || 0) + reward + bonusCoins;

            await updateDoc(userDocRef, {
                'streak.currentStreak': newStreak,
                'streak.lastClaimDate': serverTimestamp(),
                'streak.totalEarned': totalEarned,
                'balance': currentBalance,
            });

            // Update local state
            setStreak(newStreak);
            setLastClaimDate(new Date());
            setCanClaim(false);
            setTotalEarned(totalEarned);

            // Log streak claim activity
            await ActivityLogger.logStreakClaim(user.uid, newStreak, reward);
            if (bonusCoins > 0) {
                await ActivityLogger.logBonusAward(user.uid, 'rewarded_streak_claim', bonusCoins);
            }

            // Send streak claim notification
            await NotificationService.sendStreakClaimedNotification(user.uid, newStreak, reward);

            Alert.alert(
                'Daily Reward Claimed! 🎉',
                `You earned ${reward}${bonusCoins ? ` + ${bonusCoins} bonus` : ''} coins!\n\nStreak: ${newStreak} days\nTotal earned from streaks: ${totalEarned} coins`,
                [{ text: 'Awesome!' }]
            );

        } catch (error) {
            console.error('Error claiming daily reward:', error);
            Alert.alert('Error', 'Failed to claim daily reward. Please try again.');
        } finally {
            setClaiming(false);
        }
    };

    const getStreakStatus = () => {
        if (streak === 0) return 'Start your streak!';
        if (streak >= 30) return 'Maximum streak reached!';
        return `${streak} day${streak > 1 ? 's' : ''} streak`;
    };

    const getNextReward = () => {
        const nextDay = streak + 1;
        if (nextDay > 30) return 0;
        return getRewardForDay(nextDay);
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.accent} />
            </View>
        );
    }

    return (
        <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary, theme.colors.primary]}
            style={[styles.container, {
                paddingTop: insets.top,
            }]}
        >
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <LinearGradient
                    colors={[theme.colors.primary, theme.colors.accent]}
                    style={styles.header}
                >
                    <View style={styles.headerContent}>
                        <Ionicons name="flame" size={40} color="#FFFFFF" />
                        <Text style={styles.headerTitle}>Daily Streak</Text>
                        <Text style={styles.headerSubtitle}>Claim your daily rewards!</Text>
                    </View>
                </LinearGradient>

                <View style={styles.content}>
                    {/* Current Streak Card */}
                    <View style={[styles.streakCard, { backgroundColor: theme.colors.card }]}>
                        <View style={styles.streakHeader}>
                            <Ionicons
                                name="flame"
                                size={24}
                                color={streak > 0 ? '#FF6B35' : theme.colors.textSecondary}
                            />
                            <Text style={[styles.streakTitle, { color: theme.colors.textPrimary }]}>
                                {getStreakStatus()}
                            </Text>
                        </View>

                        <View style={styles.streakStats}>
                            <View style={styles.statItem}>
                                <Text style={[styles.statValue, { color: theme.colors.accent }]}>
                                    {streak}
                                </Text>
                                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                                    Current Days
                                </Text>
                            </View>

                            <View style={styles.statItem}>
                                <Text style={[styles.statValue, { color: theme.colors.accent }]}>
                                    {totalEarned}
                                </Text>
                                <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                                    Total Earned
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Claim Button */}
                    <TouchableOpacity
                        style={[
                            styles.claimButton,
                            {
                                backgroundColor: canClaim ? theme.colors.accent : theme.colors.border,
                                opacity: claiming ? 0.7 : 1,
                            }
                        ]}
                        onPress={handleDailyClaim}
                        disabled={!canClaim || claiming}
                    >
                        {claiming ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                            <>
                                <Ionicons name="gift" size={24} color="#FFFFFF" />
                                <Text style={styles.claimButtonText}>
                                    {canClaim ? `Claim ${getNextReward()} Coins (Watch Ad)` : 'Already Claimed Today'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Reward Schedule */}
                    <View style={[styles.scheduleCard, { backgroundColor: theme.colors.card }]}>
                        <Text style={[styles.scheduleTitle, { color: theme.colors.textPrimary }]}>
                            Reward Schedule
                        </Text>
                        <Text style={[styles.scheduleSubtitle, { color: theme.colors.textSecondary }]}>
                            Linear rewards: 1 coin on day 1, 2 coins on day 2, up to 30 coins on day 30
                        </Text>

                        <View style={styles.scheduleGrid}>
                            {Array.from({ length: 30 }, (_, index) => index + 1).map((day) => (
                                <View key={day} style={[
                                    styles.scheduleItem,
                                    streak >= day && { opacity: 0.5 },
                                    day === streak + 1 && canClaim && {
                                        backgroundColor: theme.colors.accent + '20',
                                        borderRadius: 8,
                                        paddingVertical: 5,
                                        paddingHorizontal: 10,
                                        marginTop: 5,
                                    }
                                ]}>
                                    <Text style={[
                                        styles.dayText,
                                        { color: theme.colors.textPrimary },
                                        streak >= day && {
                                            textDecorationLine: 'line-through',
                                            color: theme.colors.textSecondary
                                        },
                                        day === streak + 1 && canClaim && {
                                            color: theme.colors.accent,
                                            fontWeight: 'bold'
                                        }
                                    ]}>
                                        {getOrdinalDay(day)}
                                    </Text>
                                    <Text style={[
                                        styles.rewardText,
                                        { color: theme.colors.accent },
                                        streak >= day && {
                                            textDecorationLine: 'line-through',
                                            color: theme.colors.textSecondary
                                        },
                                        day === streak + 1 && canClaim && {
                                            color: theme.colors.accent,
                                            fontWeight: 'bold'
                                        }
                                    ]}>
                                        {getRewardForDay(day)}
                                    </Text>
                                    {streak >= day && (
                                        <Ionicons name="checkmark-circle" size={12} color="#4CAF50" style={styles.checkIcon} />
                                    )}
                                    {day === streak + 1 && canClaim && (
                                        <View style={styles.currentIndicator}>
                                            <Text style={styles.currentIndicatorText}>!</Text>
                                        </View>
                                    )}
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Info Section */}
                    <View style={[styles.infoCard, { backgroundColor: theme.colors.card }]}>
                        <Text style={[styles.infoTitle, { color: theme.colors.textPrimary }]}>
                            How it works
                        </Text>
                        <View style={styles.infoList}>
                            <View style={styles.infoItem}>
                                <Ionicons name="checkmark-circle" size={16} color={theme.colors.accent} />
                                <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                                    Claim your reward once every 24 hours
                                </Text>
                            </View>
                            <View style={styles.infoItem}>
                                <Ionicons name="checkmark-circle" size={16} color={theme.colors.accent} />
                                <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                                    Rewards increase by 1 coin each day: 1, 2, 3... up to 30 coins
                                </Text>
                            </View>
                            <View style={styles.infoItem}>
                                <Ionicons name="checkmark-circle" size={16} color={theme.colors.accent} />
                                <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                                    Miss a day and your streak resets to day 1
                                </Text>
                            </View>
                            <View style={styles.infoItem}>
                                <Ionicons name="checkmark-circle" size={16} color={theme.colors.accent} />
                                <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                                    After 30 days, streak resets automatically
                                </Text>
                            </View>
                        </View>
                    </View>
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
    },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 30,
        paddingHorizontal: 20,
    },
    headerContent: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginTop: 10,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#FFFFFF',
        opacity: 0.9,
        marginTop: 5,
    },
    content: {
        padding: 20,
    },
    streakCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    streakHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    streakTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 10,
    },
    streakStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 12,
        marginTop: 2,
    },
    claimButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        marginBottom: 20,
    },
    claimButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    scheduleCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    scheduleTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 5,
    },
    scheduleSubtitle: {
        fontSize: 14,
        marginBottom: 15,
    },
    scheduleGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 5,
    },
    scheduleItem: {
        width: '18%',
        alignItems: 'center',
        paddingVertical: 8,
        marginBottom: 8,
        borderRadius: 8,
        minHeight: 70,
        justifyContent: 'center',
    },
    dayText: {
        fontSize: 10,
        fontWeight: '500',
        textAlign: 'center',
    },
    rewardText: {
        fontSize: 15,
        fontWeight: 'bold',
        marginTop: 2,
        textAlign: 'center',
    },
    infoCard: {
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    infoTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 15,
    },
    infoList: {
        gap: 10,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    infoText: {
        fontSize: 14,
        marginLeft: 8,
        flex: 1,
        lineHeight: 20,
    },
    checkIcon: {
        marginTop: 5,
    },
    currentIndicator: {
        backgroundColor: '#FF4444',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 5,
    },
    currentIndicatorText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
});

export default DailyStreakScreen; 