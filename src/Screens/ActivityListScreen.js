import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth, db } from '../firebase';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';

const ActivityListScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const [userId, setUserId] = useState(null);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('all');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid);
                await loadAllActivities(user.uid);
            } else {
                setUserId(null);
            }
        });

        return unsubscribe;
    }, []);

    const loadAllActivities = async (uid) => {
        try {
            setLoading(true);
            const activitiesRef = collection(db, "users", uid, "activities");
            const activitiesQuery = query(activitiesRef, orderBy("timestamp", "desc"));
            const activitiesSnapshot = await getDocs(activitiesQuery);

            const activitiesList = [];
            activitiesSnapshot.forEach((doc) => {
                const data = doc.data();
                activitiesList.push({
                    id: doc.id,
                    type: data.type,
                    amount: data.amount,
                    description: data.description,
                    timestamp: data.timestamp?.toDate(),
                });
            });

            setActivities(activitiesList);
        } catch (error) {
            console.error("Error loading activities:", error);
            Alert.alert(t('common.error'), t('errors.somethingWentWrong'));
        } finally {
            setLoading(false);
        }
    };

    const getActivityIcon = (type) => {
        const icons = {
            'mining': 'flash',
            'streak': 'flame',
            'referral': 'gift',
            'upgrade': 'rocket',
            'withdrawal': 'wallet',
            'bonus': 'star',
            'welcome': 'home',
            'login': 'log-in',
            'error': 'warning',
            'default': 'time'
        };
        return icons[type] || icons.default;
    };

    const getActivityColor = (type) => {
        const colors = {
            'mining': theme.colors.success,
            'streak': theme.colors.accent,
            'referral': theme.colors.accent,
            'upgrade': theme.colors.accent,
            'withdrawal': theme.colors.error,
            'bonus': theme.colors.accent,
            'error': theme.colors.error,
            'default': theme.colors.textSecondary
        };
        return colors[type] || colors.default;
    };

    const formatActivityTime = (timestamp) => {
        if (!timestamp) return t('activity.unknownTime');

        const now = new Date();
        const activityTime = new Date(timestamp);
        const diffInSeconds = Math.floor((now - activityTime) / 1000);

        if (diffInSeconds < 60) {
            return t('activity.justNow');
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return t('activity.minutesAgo', { minutes });
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return t('activity.hoursAgo', { hours });
        } else {
            const days = Math.floor(diffInSeconds / 86400);
            return t('activity.daysAgo', { days });
        }
    };

    const getFilteredActivities = () => {
        let filtered = activities;

        // Apply search filter
        if (searchQuery) {
            filtered = filtered.filter(activity =>
                activity.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Apply type filter
        if (selectedFilter !== 'all') {
            filtered = filtered.filter(activity => activity.type === selectedFilter);
        }

        return filtered;
    };

    const getFilterOptions = () => {
        const types = [...new Set(activities.map(activity => activity.type))];
        return [
            { key: 'all', label: t('activity.allActivities') },
            ...types.map(type => ({
                key: type,
                label: type.charAt(0).toUpperCase() + type.slice(1)
            }))
        ];
    };

    const filteredActivities = getFilteredActivities();
    const filterOptions = getFilterOptions();

    if (loading) {
        return (
            <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary, theme.colors.primary]}
                style={[styles.container, { paddingTop: insets.top }]}
            >
                <View style={styles.loadingContainer}>
                    <Ionicons name="sync" size={40} color={theme.colors.accent} />
                    <Text style={[styles.loadingText, { color: theme.colors.text }]}>
                        {t('activity.loadingActivities')}
                    </Text>
                </View>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary, theme.colors.primary]}
            style={[styles.container, {
                paddingTop: insets.top
            }]}
        >

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.colors.textSecondary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.colors.textSecondary }]}>
                    {t('activity.activityHistory')}
                </Text>
                <View style={styles.headerSpacer} />
            </View>

            {/* Search Bar */}
            <View style={[styles.searchContainer, { backgroundColor: theme.colors.card }]}>
                <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
                <TextInput
                    style={[styles.searchInput, { color: theme.colors.textSecondary }]}
                    placeholder={t('activity.searchActivities')}
                    placeholderTextColor={theme.colors.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Filter Buttons */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterContainer}
                contentContainerStyle={styles.filterContent}
            >
                {filterOptions.map((option) => (
                    <TouchableOpacity
                        key={option.key}
                        style={[
                            styles.filterButton,
                            { backgroundColor: theme.colors.card },
                            selectedFilter === option.key && {
                                backgroundColor: theme.colors.accent,
                            }
                        ]}
                        onPress={() => setSelectedFilter(option.key)}
                    >
                        <Text style={[
                            styles.filterButtonText,
                            { color: selectedFilter === option.key ? theme.colors.primary : theme.colors.text }
                        ]}>
                            {option.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Activities List */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {filteredActivities.length > 0 ? (
                    filteredActivities.map((activity, index) => (
                        <View
                            key={activity.id}
                            style={[
                                styles.activityItem,
                                { backgroundColor: theme.colors.card },
                                index === filteredActivities.length - 1 && { marginBottom: 0 }
                            ]}
                        >
                            <View style={[
                                styles.activityIcon,
                                { backgroundColor: `${getActivityColor(activity.type)}20` }
                            ]}>
                                <Ionicons
                                    name={getActivityIcon(activity.type)}
                                    size={24}
                                    color={getActivityColor(activity.type)}
                                />
                            </View>
                            <View style={styles.activityContent}>
                                <Text style={[styles.activityText, { color: theme.colors.textSecondary }]}>
                                    {activity.description}
                                </Text>
                                <Text style={[styles.activityTime, { color: theme.colors.textSecondary }]}>
                                    {formatActivityTime(activity.timestamp)}
                                </Text>
                            </View>
                            <Text style={[
                                styles.activityAmount,
                                { color: activity.amount > 0 ? theme.colors.success : theme.colors.error }
                            ]}>
                                {activity.amount > 0 ? '+' : ''}{activity.amount.toFixed(3)}
                            </Text>
                        </View>
                    ))
                ) : (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="time-outline" size={64} color={theme.colors.textSecondary} />
                        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                            {t('activity.noActivitiesFound')}
                        </Text>
                        <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
                            {searchQuery || selectedFilter !== 'all'
                                ? t('activity.tryAdjustingSearch')
                                : t('activity.startMiningToSeeHistory')
                            }
                        </Text>
                        {!searchQuery && selectedFilter === 'all' && (
                            <TouchableOpacity
                                style={[styles.startMiningButton, { backgroundColor: theme.colors.accent }]}
                                onPress={() => navigation.navigate('Home')}
                            >
                                <Ionicons name="flash" size={20} color={theme.colors.primary} />
                                <Text style={[styles.startMiningText, { color: theme.colors.primary }]}>
                                    {t('activity.startMining')}
                                </Text>
                            </TouchableOpacity>
                        )}
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
        marginTop: 10,
        fontSize: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        flex: 1,
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    headerSpacer: {
        width: 40,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        marginBottom: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
    },
    filterContainer: {
        marginBottom: 16,
    },
    filterContent: {
        paddingHorizontal: 20,
    },
    filterButton: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 25,
        marginRight: 10,
        height: 44,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    filterButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18,
        marginBottom: 16,
        borderRadius: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
    },
    activityIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 193, 7, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    activityContent: {
        flex: 1,
    },
    activityText: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 6,
        lineHeight: 22,
    },
    activityTime: {
        fontSize: 14,
        opacity: 0.8,
        lineHeight: 18,
    },
    activityAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'right',
        minWidth: 80,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
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
        paddingHorizontal: 40,
    },
    startMiningButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 25,
        marginTop: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    startMiningText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
});

export default ActivityListScreen; 