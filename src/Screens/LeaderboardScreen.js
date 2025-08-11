import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    FlatList,
    Image,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { auth, db } from '../firebase';
import { collection, query, orderBy, limit, getDocs, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LeaderboardScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [currentUserRank, setCurrentUserRank] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState('balance'); // balance, level, experience, totalMined
    const insets = useSafeAreaInsets();

    useEffect(() => {
        loadLeaderboardData();
    }, [selectedFilter]);

    const loadLeaderboardData = async () => {
        try {
            setLoading(true);
            const usersRef = collection(db, 'users');

            // Create query based on selected filter
            let orderField;
            switch (selectedFilter) {
                case 'balance':
                    orderField = 'balance';
                    break;
                case 'level':
                    orderField = 'miningLevel';
                    break;
                case 'experience':
                    orderField = 'experience';
                    break;
                case 'totalMined':
                    orderField = 'totalMined';
                    break;
                default:
                    orderField = 'balance';
            }

            const q = query(usersRef, orderBy(orderField, 'desc'), limit(100));

            const unsubscribe = onSnapshot(q, async (snapshot) => {
                const users = [];
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    users.push({
                        id: doc.id,
                        username: data.username || 'Anonymous',
                        firstName: data.firstName || '',
                        lastName: data.lastName || '',
                        balance: data.balance || 0,
                        miningLevel: data.miningLevel || 1,
                        experience: data.experience || 0,
                        totalMined: data.totalMined || 0,
                        streak: data.streak?.currentStreak || 0,
                        avatar: data.avatar || null,
                        isOnline: data.isOnline || false,
                        lastActive: data.lastActive || null,
                    });
                });

                setLeaderboardData(users);

                // Find current user's rank
                if (auth.currentUser) {
                    const currentUserIndex = users.findIndex(user => user.id === auth.currentUser.uid);
                    if (currentUserIndex !== -1) {
                        setCurrentUserRank(currentUserIndex + 1);
                    }
                }

                setLoading(false);
            }, (error) => {
                console.error('Error loading leaderboard:', error);
                setLoading(false);
            });

            return unsubscribe;
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadLeaderboardData();
        setRefreshing(false);
    };

    const getFilterIcon = (filter) => {
        const icons = {
            balance: 'wallet',
            level: 'star',
            experience: 'trophy',
            totalMined: 'trending-up'
        };
        return icons[filter] || 'wallet';
    };

    const getFilterLabel = (filter) => {
        const labels = {
            balance: t('leaderboard.balance'),
            level: t('leaderboard.level'),
            experience: t('leaderboard.experience'),
            totalMined: t('leaderboard.totalMined')
        };
        return labels[filter] || t('leaderboard.balance');
    };

    const getRankBadge = (rank) => {
        if (rank === 1) return { icon: '🥇', color: '#FFD700' };
        if (rank === 2) return { icon: '🥈', color: '#C0C0C0' };
        if (rank === 3) return { icon: '🥉', color: '#CD7F32' };
        return { icon: `#${rank}`, color: theme.colors.textSecondary };
    };

    const formatValue = (value, filter) => {
        switch (filter) {
            case 'balance':
            case 'totalMined':
                return `${value.toFixed(3)} coins`;
            case 'level':
                return `${t('leaderboard.level')} ${value}`;
            case 'experience':
                return `${value} XP`;
            default:
                return value.toString();
        }
    };

    const getValueColor = (filter) => {
        const colors = {
            balance: theme.colors.success,
            level: theme.colors.accent,
            experience: theme.colors.warning,
            totalMined: theme.colors.primary
        };
        return colors[filter] || theme.colors.textPrimary;
    };

    const renderLeaderboardItem = ({ item, index }) => {
        const rank = index + 1;
        const rankBadge = getRankBadge(rank);
        const isCurrentUser = auth.currentUser && item.id === auth.currentUser.uid;
        const displayName = item.firstName && item.lastName
            ? `${item.firstName} ${item.lastName}`
            : item.username;

        return (
            <TouchableOpacity
                style={[
                    styles.leaderboardItem,
                    {
                        backgroundColor: isCurrentUser
                            ? theme.colors.accent + '20'
                            : theme.colors.card,
                        borderColor: isCurrentUser
                            ? theme.colors.accent
                            : theme.colors.border
                    }
                ]}
                // onPress={() => {
                //     if (isCurrentUser) {
                //         navigation.navigate('Profile');
                //     } else {
                //         Alert.alert(
                //             'User Profile',
                //             `View ${displayName}'s profile?`,
                //             [
                //                 { text: 'Cancel', style: 'cancel' },
                //                 { text: 'View', onPress: () => navigation.navigate('Profile') }
                //             ]
                //         );
                //     }
                // }}
                activeOpacity={0.8}
            >
                {/* Rank Badge */}
                <View style={styles.rankContainer}>
                    <Text style={[styles.rankBadge, { color: rankBadge.color }]}>
                        {rankBadge.icon}
                    </Text>
                </View>

                {/* User Avatar */}
                <View style={styles.avatarContainer}>
                    {item.avatar ? (
                        <Image source={{ uri: item.avatar }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.accent }]}>
                            <Ionicons name="person" size={20} color="#fff" />
                        </View>
                    )}
                    {item.isOnline && <View style={styles.onlineIndicator} />}
                </View>

                {/* User Info */}
                <View style={styles.userInfo}>
                    <Text style={[styles.userName, { color: theme.colors.textPrimary }]}>
                        {displayName}
                        {isCurrentUser && (
                            <Text style={[styles.currentUserBadge, { color: theme.colors.accent }]}>
                                {' (You)'}
                            </Text>
                        )}
                    </Text>
                    <View style={styles.userStats}>
                        <Text style={[styles.userStat, { color: theme.colors.textSecondary }]}>
                            Level {item.miningLevel}
                        </Text>
                        <Text style={[styles.userStat, { color: theme.colors.textSecondary }]}>
                            {item.experience} XP
                        </Text>
                        <Text style={[styles.userStat, { color: theme.colors.textSecondary }]}>
                            🔥 {item.streak}
                        </Text>
                    </View>
                </View>

                {/* Main Value */}
                <View style={styles.valueContainer}>
                    <Text style={[styles.mainValue, { color: getValueColor(selectedFilter) }]}>
                        {formatValue(item[selectedFilter], selectedFilter)}
                    </Text>
                    <Text style={[styles.valueLabel, { color: theme.colors.textSecondary }]}>
                        {getFilterLabel(selectedFilter)}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    const renderFilterButton = (filter) => {
        const isSelected = selectedFilter === filter;
        return (
            <TouchableOpacity
                key={filter}
                style={[
                    styles.filterButton,
                    {
                        backgroundColor: isSelected ? theme.colors.accent : theme.colors.card,
                        borderColor: isSelected ? theme.colors.accent : theme.colors.border
                    }
                ]}
                onPress={() => setSelectedFilter(filter)}
            >
                <Ionicons
                    name={getFilterIcon(filter)}
                    size={16}
                    color={isSelected ? '#fff' : theme.colors.textSecondary}
                />
                <Text style={[
                    styles.filterButtonText,
                    { color: isSelected ? '#fff' : theme.colors.textSecondary }
                ]}>
                    {getFilterLabel(filter)}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary, theme.colors.primary]}
            style={[styles.container, { paddingTop: insets.top }]}
        >
            {/* Header */}
            <View style={styles.header}>

                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={32} color={theme.colors.accent} />
                    </TouchableOpacity>
                    <Ionicons name="trophy" size={32} color={theme.colors.accent} />
                    <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
                        {t('leaderboard.leaderboard')}
                    </Text>
                </View>
                {currentUserRank && (
                    <View style={[styles.rankCard, { backgroundColor: theme.colors.card }]}>
                        <Text style={[styles.rankLabel, { color: theme.colors.textSecondary }]}>
                            Your Rank
                        </Text>
                        <Text style={[styles.rankNumber, { color: theme.colors.accent }]}>
                            #{currentUserRank}
                        </Text>
                    </View>
                )}
            </View>

            {/* Filter Buttons */}
            <View style={styles.filterContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterScroll}
                >
                    {renderFilterButton('balance')}
                    {renderFilterButton('level')}
                    {renderFilterButton('experience')}
                    {renderFilterButton('totalMined')}
                </ScrollView>
            </View>

            {/* Leaderboard List */}
            <FlatList
                data={leaderboardData}
                renderItem={renderLeaderboardItem}
                keyExtractor={(item) => item.id}
                style={styles.leaderboardList}
                contentContainerStyle={styles.leaderboardContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.colors.accent}
                        colors={[theme.colors.accent]}
                    />
                }
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="trophy-outline" size={64} color={theme.colors.textSecondary} />
                        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                            {loading ? t('leaderboard.loadingLeaderboard') : t('leaderboard.noUsersFound')}
                        </Text>
                    </View>
                }
                ListHeaderComponent={
                    <View style={styles.listHeader}>
                        <Text style={[styles.listHeaderText, { color: theme.colors.textSecondary }]}>
                            {t('leaderboard.topUsersBy', { count: leaderboardData.length, filter: getFilterLabel(selectedFilter) })}
                        </Text>
                    </View>
                }
            />
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backButton: {
        marginRight: 14,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginLeft: 12,
    },
    rankCard: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        alignItems: 'center',
    },
    rankLabel: {
        fontSize: 12,
        fontWeight: '500',
    },
    rankNumber: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    filterContainer: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    filterScroll: {
        paddingHorizontal: 0,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 12,
        borderWidth: 1,
    },
    filterButtonText: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
    leaderboardList: {
        flex: 1,
    },
    leaderboardContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    listHeader: {
        marginBottom: 16,
    },
    listHeaderText: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    leaderboardItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        marginBottom: 12,
        borderRadius: 16,
        borderWidth: 1,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    rankContainer: {
        width: 40,
        alignItems: 'center',
    },
    rankBadge: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 12,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#4CAF50',
        borderWidth: 2,
        borderColor: '#fff',
    },
    userInfo: {
        flex: 1,
        marginRight: 12,
    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    currentUserBadge: {
        fontSize: 14,
        fontWeight: '600',
    },
    userStats: {
        flexDirection: 'row',
        gap: 12,
    },
    userStat: {
        fontSize: 12,
        fontWeight: '500',
    },
    valueContainer: {
        alignItems: 'flex-end',
    },
    mainValue: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    valueLabel: {
        fontSize: 12,
        fontWeight: '500',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        marginTop: 16,
        textAlign: 'center',
    },
});

export default LeaderboardScreen; 