import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Animated,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';
import ActivityLogger from '../utils/ActivityLogger';

const { width } = Dimensions.get('window');

const UpgradeScreen = () => {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const [user, setUser] = useState(null);
    const [userId, setUserId] = useState(null);
    const [balance, setBalance] = useState(0);
    const [upgrades, setUpgrades] = useState({
        speed: 0,
        efficiency: 0,
        capacity: 0,
    });
    const [boosts, setBoosts] = useState({
        x1_5: { purchased: false, cost: 200 },
        x2: { purchased: false, cost: 500 },
        x3: { purchased: false, cost: 1500 },
        x5: { purchased: false, cost: 5000 },
        x10: { purchased: false, cost: 15000 },
        x20: { purchased: false, cost: 50000 },
    });
    const [loading, setLoading] = useState(true);
    const [purchaseLoading, setPurchaseLoading] = useState({});

    // Animation values
    const [scaleAnim] = useState(new Animated.Value(1));
    const [fadeAnim] = useState(new Animated.Value(0));

    // No boost timer needed for lifetime upgrades

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            console.log("Auth state changed:", user ? user.uid : "No user");
            if (user) {
                setUserId(user.uid);
                await loadUserData();
            } else {
                setUserId(null);
            }
        });

        return unsubscribe;
    }, []);

    // Refresh data when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            if (userId) {
                loadUserData();
            }
        }, [userId])
    );

    useEffect(() => {
        // Fade in animation
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
    }, []);

    const loadUserData = async () => {
        try {
            if (!userId) {
                console.log("No userId available for loadUserData");
                return;
            }

            console.log("Loading user data for userId:", userId);
            const userRef = doc(db, "users", userId);
            const userDoc = await getDoc(userRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                console.log("User data loaded:", userData);
                console.log("Balance from database:", userData.balance);
                console.log("Balance type:", typeof userData.balance);

                // Ensure balance is a number
                const balanceValue = typeof userData.balance === 'number' ? userData.balance : parseFloat(userData.balance) || 0;
                console.log("Processed balance value:", balanceValue);

                setBalance(balanceValue);
                setUpgrades(userData.upgrades || { speed: 0, efficiency: 0, capacity: 0 });
                setBoosts(userData.boosts || {
                    x1_5: { purchased: false, cost: 50 },
                    x2: { purchased: false, cost: 120 },
                    x3: { purchased: false, cost: 230 },
                    x5: { purchased: false, cost: 540 },
                    x10: { purchased: false, cost: 30000 },
                    x20: { purchased: false, cost: 50000 },
                });
            } else {
                console.log("User document does not exist");
            }
        } catch (error) {
            console.error("Error loading user data:", error);
        } finally {
            setLoading(false);
        }
    };

    const animatePress = (callback) => {
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start(callback);
    };

    const purchaseUpgrade = async (type) => {
        if (purchaseLoading[type]) return;

        setPurchaseLoading(prev => ({ ...prev, [type]: true }));

        try {
            const upgradeCosts = {
                speed: 25 + (upgrades.speed * 10),
                efficiency: 30 + (upgrades.efficiency * 15),
                capacity: 40 + (upgrades.capacity * 20),
            };

            const cost = upgradeCosts[type];

            if (balance < cost) {
                Alert.alert('Insufficient Balance', `You need ${cost} coins to purchase this upgrade.`);
                return;
            }

            const userRef = doc(db, "users", userId);
            await updateDoc(userRef, {
                balance: increment(-cost),
                [`upgrades.${type}`]: increment(1),
            });

            // Update local state
            setBalance(prev => prev - cost);
            setUpgrades(prev => ({
                ...prev,
                [type]: prev[type] + 1,
            }));

            Alert.alert('Upgrade Successful!', `${type.charAt(0).toUpperCase() + type.slice(1)} upgrade purchased!`);

            // Log upgrade purchase activity
            await ActivityLogger.logUpgradePurchase(userId, type, cost, upgrades[type] + 1);
        } catch (error) {
            console.error('Purchase error:', error);
            Alert.alert('Error', 'Failed to purchase upgrade. Please try again.');
        } finally {
            setPurchaseLoading(prev => ({ ...prev, [type]: false }));
        }
    };

    const purchaseBoost = async (boostType) => {
        if (purchaseLoading[boostType]) return;

        setPurchaseLoading(prev => ({ ...prev, [boostType]: true }));

        try {
            const boost = boosts[boostType];
            const cost = boost.cost;

            if (balance < cost) {
                Alert.alert('Insufficient Balance', `You need ${cost} coins to purchase this lifetime boost.`);
                return;
            }

            if (boost.purchased) {
                Alert.alert('Already Purchased', 'You already own this lifetime boost!');
                return;
            }

            const userRef = doc(db, "users", userId);
            await updateDoc(userRef, {
                balance: increment(-cost),
                [`boosts.${boostType}.purchased`]: true,
            });

            // Update local state
            setBalance(prev => prev - cost);
            setBoosts(prev => ({
                ...prev,
                [boostType]: {
                    ...prev[boostType],
                    purchased: true,
                },
            }));

            Alert.alert('Lifetime Boost Purchased!', `${boostType.toUpperCase()} boost is now yours forever!`);

            // Log boost purchase activity
            await ActivityLogger.logBoostActivation(userId, boostType, cost, `Lifetime ${boostType.toUpperCase()}`);
        } catch (error) {
            console.error('Boost purchase error:', error);
            Alert.alert('Error', 'Failed to purchase boost. Please try again.');
        } finally {
            setPurchaseLoading(prev => ({ ...prev, [boostType]: false }));
        }
    };

    const getUpgradeInfo = (type) => {
        const info = {
            speed: {
                title: 'Mining Speed',
                description: 'Increases mining speed by 10% per level',
                icon: 'flash',
                currentBonus: `${upgrades.speed * 10}%`,
                nextBonus: `${(upgrades.speed + 1) * 10}%`,
            },
            efficiency: {
                title: 'Mining Efficiency',
                description: 'Reduces energy consumption by 15% per level',
                icon: 'battery-charging',
                currentBonus: `${upgrades.efficiency * 15}%`,
                nextBonus: `${(upgrades.efficiency + 1) * 15}%`,
            },
            capacity: {
                title: 'Storage Capacity',
                description: 'Increases storage capacity by 20% per level',
                icon: 'hardware-chip',
                currentBonus: `${upgrades.capacity * 20}%`,
                nextBonus: `${(upgrades.capacity + 1) * 20}%`,
            },
        };
        return info[type];
    };

    const getBoostInfo = (type) => {
        const info = {
            x1_5: {
                title: '1.5x Mining Boost',
                description: 'Permanently increase mining speed by 50%',
                icon: 'flash',
                multiplier: '1.5x',
                color: '#2196F3',
            },
            x2: {
                title: '2x Mining Boost',
                description: 'Permanently double your mining speed',
                icon: 'rocket',
                multiplier: '2x',
                color: '#4CAF50',
            },
            x3: {
                title: '3x Mining Boost',
                description: 'Permanently triple your mining speed',
                icon: 'rocket',
                multiplier: '3x',
                color: '#FF9800',
            },
            x5: {
                title: '5x Mining Boost',
                description: 'Permanently 5x your mining speed',
                icon: 'rocket',
                multiplier: '5x',
                color: '#F44336',
            },
            x10: {
                title: '10x Mining Boost',
                description: 'Permanently 10x your mining speed',
                icon: 'flash',
                multiplier: '10x',
                color: '#9C27B0',
            },
            x20: {
                title: '20x Mining Boost',
                description: 'Permanently 20x your mining speed',
                icon: 'flash',
                multiplier: '20x',
                color: '#E91E63',
            },
        };
        return info[type];
    };

    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
                <View style={styles.loadingContainer}>
                    <Ionicons name="sync" size={40} color={theme.colors.accent} />
                    <Text style={[styles.loadingText, { color: theme.colors.text }]}>
                        Loading upgrades...
                    </Text>
                </View>
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
            <Animated.View
                style={[
                    styles.content,
                    { opacity: fadeAnim }
                ]}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
                        Upgrades & Boosts
                    </Text>
                    <View style={styles.balanceContainer}>
                        <Ionicons name="cash" size={20} color={theme.colors.accent} />
                        <Text style={[styles.balanceText, { color: theme.colors.textPrimary }]}>
                            {typeof balance === 'number' ? balance.toFixed(2) : '0.00'}
                        </Text>
                    </View>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Upgrades Section */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>

                            Permanent improvements to your mining operation
                        </Text>

                        {Object.keys(upgrades).map((type) => {
                            const info = getUpgradeInfo(type);
                            const cost = 25 + (upgrades[type] * (type === 'speed' ? 10 : type === 'efficiency' ? 15 : 20));

                            return (
                                <Animated.View
                                    key={type}
                                    style={[
                                        styles.upgradeCard,
                                        {
                                            backgroundColor: theme.colors.surface,
                                            borderColor: theme.colors.border,
                                        }
                                    ]}
                                >
                                    <View style={styles.upgradeHeader}>
                                        <View style={styles.upgradeIconContainer}>
                                            <Ionicons
                                                name={info.icon}
                                                size={24}
                                                color={theme.colors.accent}
                                            />
                                        </View>
                                        <View style={styles.upgradeInfo}>
                                            <Text style={[styles.upgradeTitle, { color: theme.colors.textPrimary }]}>
                                                {info.title}
                                            </Text>
                                            <Text style={[styles.upgradeDescription, { color: theme.colors.textSecondary }]}>
                                                {info.description}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.upgradeStats}>
                                        <View style={styles.statItem}>
                                            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                                                Current Bonus
                                            </Text>
                                            <Text style={[styles.statValue, { color: theme.colors.accent }]}>
                                                {info.currentBonus}
                                            </Text>
                                        </View>
                                        <View style={styles.statItem}>
                                            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                                                Next Level
                                            </Text>
                                            <Text style={[styles.statValue, { color: theme.colors.accent }]}>
                                                {info.nextBonus}
                                            </Text>
                                        </View>
                                        <View style={styles.statItem}>
                                            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                                                Level
                                            </Text>
                                            <Text style={[styles.statValue, { color: theme.colors.accent }]}>
                                                {upgrades[type]}
                                            </Text>
                                        </View>
                                    </View>

                                    <TouchableOpacity
                                        style={[
                                            styles.upgradeButton,
                                            { backgroundColor: theme.colors.accent },
                                            balance < cost && { opacity: 0.5 }
                                        ]}
                                        onPress={() => animatePress(() => purchaseUpgrade(type))}
                                        disabled={balance < cost || purchaseLoading[type]}
                                    >
                                        {purchaseLoading[type] ? (
                                            <Ionicons name="sync" size={20} color={theme.colors.primary} />
                                        ) : (
                                            <>
                                                <Ionicons name="add" size={20} color={theme.colors.primary} />
                                                <Text style={[styles.upgradeButtonText, { color: theme.colors.primary }]}>
                                                    Upgrade ({cost} coins)
                                                </Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </Animated.View>
                            );
                        })}
                    </View>

                    {/* Boosts Section */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                            Mining Boosts
                        </Text>
                        <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
                            Lifetime speed multipliers for increased earnings
                        </Text>

                        {Object.keys(boosts).map((type) => {
                            const info = getBoostInfo(type);
                            const boost = boosts[type];

                            // Debug logging
                            console.log('Rendering boost:', type, 'info:', info, 'boost:', boost);

                            // Only render if we have valid info
                            if (!info || !boost) {
                                console.log('Skipping boost:', type, 'due to missing info or boost data');
                                return null;
                            }

                            return (
                                <Animated.View
                                    key={type}
                                    style={[
                                        styles.boostCard,
                                        {
                                            backgroundColor: theme.colors.surface,
                                            borderColor: boost.purchased ? info.color : theme.colors.border,
                                        }
                                    ]}
                                >
                                    <View style={styles.boostHeader}>
                                        <View style={[
                                            styles.boostIconContainer,
                                            { backgroundColor: boost.purchased ? info.color : theme.colors.tertiary }
                                        ]}>
                                            <Ionicons
                                                name={info.icon}
                                                size={24}
                                                color={boost.purchased ? theme.colors.primary : theme.colors.accent}
                                            />
                                        </View>
                                        <View style={styles.boostInfo}>
                                            <Text style={[styles.boostTitle, { color: theme.colors.textPrimary }]}>
                                                {info.title}
                                            </Text>
                                            <Text style={[styles.boostDescription, { color: theme.colors.textSecondary }]}>
                                                {info.description}
                                            </Text>
                                            {!boost.purchased && (
                                                <Text style={[styles.boostPrice, { color: theme.colors.accent }]}>
                                                    {boost.cost || 'N/A'} coins
                                                </Text>
                                            )}
                                        </View>
                                        <View style={styles.boostMultiplier}>
                                            <Text style={[styles.multiplierText, { color: info.color }]}>
                                                {info.multiplier}
                                            </Text>
                                        </View>
                                    </View>

                                    {boost.purchased && (
                                        <View style={styles.boostTimer}>
                                            <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                                            <Text style={[styles.timerText, { color: theme.colors.success }]}>
                                                Lifetime Boost - Active Forever
                                            </Text>
                                        </View>
                                    )}

                                    <TouchableOpacity
                                        style={[
                                            styles.boostButton,
                                            {
                                                backgroundColor: boost.purchased ? theme.colors.tertiary : info.color,
                                                opacity: balance < boost.cost && !boost.purchased ? 0.5 : 1
                                            }
                                        ]}
                                        onPress={() => animatePress(() => purchaseBoost(type))}
                                        disabled={(balance < boost.cost && !boost.purchased) || purchaseLoading[type]}
                                    >
                                        {purchaseLoading[type] ? (
                                            <Ionicons name="sync" size={20} color={theme.colors.primary} />
                                        ) : boost.purchased ? (
                                            <>
                                                <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                                                <Text style={[styles.boostButtonText, { color: theme.colors.primary }]}>
                                                    Purchased
                                                </Text>
                                            </>
                                        ) : (
                                            <>
                                                <Ionicons name="rocket" size={20} color={theme.colors.primary} />
                                                <Text style={[styles.boostButtonText, { color: theme.colors.primary }]}>
                                                    Purchase ({(boost.cost || 'N/A')} coins)
                                                </Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </Animated.View>
                            );
                        })}
                    </View>
                </ScrollView>
            </Animated.View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingTop: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    balanceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 193, 7, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    balanceText: {
        marginLeft: 6,
        fontSize: 16,
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    sectionSubtitle: {
        fontSize: 14,
        marginBottom: 20,
    },
    upgradeCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    upgradeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    upgradeIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255, 193, 7, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    upgradeInfo: {
        flex: 1,
    },
    upgradeTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
    },
    upgradeDescription: {
        fontSize: 14,
        lineHeight: 20,
    },
    upgradeStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '600',
    },
    upgradeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
    },
    upgradeButtonText: {
        marginLeft: 8,
        fontSize: 16,
        fontWeight: '600',
    },
    boostCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 2,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    boostHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    boostIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    boostInfo: {
        flex: 1,
    },
    boostTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
    },
    boostDescription: {
        fontSize: 14,
        lineHeight: 20,
    },
    boostPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 4,
    },
    boostMultiplier: {
        alignItems: 'center',
    },
    multiplierText: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    boostTimer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(255, 193, 7, 0.1)',
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    timerText: {
        marginLeft: 6,
        fontSize: 14,
    },
    boostButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
    },
    boostButtonText: {
        marginLeft: 8,
        fontSize: 16,
        fontWeight: '600',
    },
});

export default UpgradeScreen; 
