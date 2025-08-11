import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Animated,
    RefreshControl,
    Alert,
    Modal,
    Dimensions,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth, db } from '../firebase';
import { 
    collection, 
    query, 
    orderBy, 
    limit, 
    getDocs, 
    where, 
    onSnapshot,
    startAfter,
    doc,
    updateDoc,
    serverTimestamp
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';
import ToastService from '../utils/ToastService';
import AdminActivityLogger from '../utils/AdminActivityLogger';

const { width } = Dimensions.get('window');

const AdminDashboardScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const [userId, setUserId] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [selectedSeverity, setSelectedSeverity] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [timeRange, setTimeRange] = useState('24h');
    const [stats, setStats] = useState({});
    const [lastDoc, setLastDoc] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    
    // Modal states
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [showActivityModal, setShowActivityModal] = useState(false);
    const [adminNotes, setAdminNotes] = useState('');
    const [processingActivity, setProcessingActivity] = useState(false);

    // Animation values
    const [fadeAnim] = useState(new Animated.Value(0));
    const [slideAnim] = useState(new Animated.Value(50));

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid);
                await checkAdminStatus(user.uid);
            } else {
                setUserId(null);
                setIsAdmin(false);
            }
        });

        return unsubscribe;
    }, []);

    useEffect(() => {
        if (isAdmin) {
            loadActivities();
            loadStats();
            startRealtimeListener();
        }
    }, [isAdmin, selectedFilter, selectedSeverity, selectedStatus, timeRange]);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const checkAdminStatus = async (uid) => {
        try {
            // Check if user has admin role in users collection
            const userRef = doc(db, 'users', uid);
            const userDoc = await getDocs(userRef);
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const hasAdminRole = userData.role === 'admin' || userData.role === 'super_admin';
                setIsAdmin(hasAdminRole);
                
                if (!hasAdminRole) {
                    ToastService.error('Access denied. Admin privileges required.');
                    navigation.goBack();
                }
            } else {
                setIsAdmin(false);
                ToastService.error('User not found.');
                navigation.goBack();
            }
        } catch (error) {
            console.error('Error checking admin status:', error);
            setIsAdmin(false);
            ToastService.error('Error verifying admin status.');
            navigation.goBack();
        }
    };

    const loadActivities = async (refresh = false) => {
        try {
            if (refresh) {
                setActivities([]);
                setLastDoc(null);
                setHasMore(true);
            }

            setLoading(true);
            
            let activitiesQuery = query(
                collection(db, AdminActivityLogger.ADMIN_ACTIVITIES_COLLECTION),
                orderBy('timestamp', 'desc'),
                limit(50)
            );

            // Apply filters
            if (selectedFilter !== 'all') {
                activitiesQuery = query(activitiesQuery, where('type', '==', selectedFilter));
            }
            if (selectedSeverity !== 'all') {
                activitiesQuery = query(activitiesQuery, where('severity', '==', selectedSeverity));
            }
            if (selectedStatus !== 'all') {
                activitiesQuery = query(activitiesQuery, where('status', '==', selectedStatus));
            }

            const snapshot = await getDocs(activitiesQuery);
            const activitiesList = [];
            
            snapshot.forEach((doc) => {
                const data = doc.data();
                activitiesList.push({
                    id: doc.id,
                    ...data,
                    timestamp: data.timestamp?.toDate() || new Date(),
                });
            });

            if (refresh) {
                setActivities(activitiesList);
            } else {
                setActivities(prev => [...prev, ...activitiesList]);
            }

            setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
            setHasMore(snapshot.docs.length === 50);
        } catch (error) {
            console.error('Error loading activities:', error);
            ToastService.error('Error loading activities');
        } finally {
            setLoading(false);
        }
    };

    const loadMoreActivities = async () => {
        if (!hasMore || loadingMore || !lastDoc) return;

        try {
            setLoadingMore(true);
            
            let activitiesQuery = query(
                collection(db, AdminActivityLogger.ADMIN_ACTIVITIES_COLLECTION),
                orderBy('timestamp', 'desc'),
                startAfter(lastDoc),
                limit(50)
            );

            // Apply filters
            if (selectedFilter !== 'all') {
                activitiesQuery = query(activitiesQuery, where('type', '==', selectedFilter));
            }
            if (selectedSeverity !== 'all') {
                activitiesQuery = query(activitiesQuery, where('severity', '==', selectedSeverity));
            }
            if (selectedStatus !== 'all') {
                activitiesQuery = query(activitiesQuery, where('status', '==', selectedStatus));
            }

            const snapshot = await getDocs(activitiesQuery);
            const activitiesList = [];
            
            snapshot.forEach((doc) => {
                const data = doc.data();
                activitiesList.push({
                    id: doc.id,
                    ...data,
                    timestamp: data.timestamp?.toDate() || new Date(),
                });
            });

            setActivities(prev => [...prev, ...activitiesList]);
            setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
            setHasMore(snapshot.docs.length === 50);
        } catch (error) {
            console.error('Error loading more activities:', error);
            ToastService.error('Error loading more activities');
        } finally {
            setLoadingMore(false);
        }
    };

    const loadStats = async () => {
        try {
            const statsRef = collection(db, AdminActivityLogger.ADMIN_ACTIVITIES_COLLECTION);
            const snapshot = await getDocs(statsRef);
            
            const statsData = {
                totalActivities: snapshot.size,
                activitiesByType: {},
                activitiesBySeverity: {},
                activitiesByStatus: {},
                recentViolations: 0,
                suspiciousActivities: 0,
                totalAmount: 0
            };

            snapshot.forEach((doc) => {
                const data = doc.data();
                
                // Count by type
                statsData.activitiesByType[data.type] = (statsData.activitiesByType[data.type] || 0) + 1;
                
                // Count by severity
                statsData.activitiesBySeverity[data.severity] = (statsData.activitiesBySeverity[data.severity] || 0) + 1;
                
                // Count by status
                statsData.activitiesByStatus[data.status] = (statsData.activitiesByStatus[data.status] || 0) + 1;
                
                // Count violations and suspicious activities
                if (data.status === 'violation') statsData.recentViolations++;
                if (data.status === 'suspicious') statsData.suspiciousActivities++;
                
                // Sum amounts
                if (data.amount) statsData.totalAmount += data.amount;
            });

            setStats(statsData);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const startRealtimeListener = () => {
        const activitiesRef = collection(db, AdminActivityLogger.ADMIN_ACTIVITIES_COLLECTION);
        const q = query(activitiesRef, orderBy('timestamp', 'desc'), limit(10));
        
        return onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const newActivity = {
                        id: change.doc.id,
                        ...change.doc.data(),
                        timestamp: change.doc.data().timestamp?.toDate() || new Date(),
                    };
                    
                    setActivities(prev => [newActivity, ...prev.slice(0, -1)]);
                    loadStats(); // Refresh stats
                }
            });
        });
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadActivities(true);
        await loadStats();
        setRefreshing(false);
    }, []);

    const getActivityIcon = (type) => {
        const icons = {
            'mining_start': 'flash',
            'mining_progress': 'trending-up',
            'mining_complete': 'checkmark-circle',
            'mining_anti_cheat': 'shield',
            'user_login': 'log-in',
            'user_logout': 'log-out',
            'user_register': 'person-add',
            'suspicious_activity': 'warning',
            'error_occurred': 'alert-circle',
            'admin_action': 'settings',
            'default': 'time'
        };
        return icons[type] || icons.default;
    };

    const getActivityColor = (severity) => {
        const colors = {
            'info': theme.colors.success,
            'warning': theme.colors.accent,
            'error': theme.colors.error,
            'critical': '#FF0000'
        };
        return colors[severity] || theme.colors.textSecondary;
    };

    const getStatusColor = (status) => {
        const colors = {
            'success': theme.colors.success,
            'warning': theme.colors.accent,
            'error': theme.colors.error,
            'violation': '#FF6B35',
            'suspicious': '#FFD93D',
            'admin_action': theme.colors.primary
        };
        return colors[status] || theme.colors.textSecondary;
    };

    const formatActivityTime = (timestamp) => {
        if (!timestamp) return 'Unknown time';

        const now = new Date();
        const activityTime = new Date(timestamp);
        const diffInSeconds = Math.floor((now - activityTime) / 1000);

        if (diffInSeconds < 60) {
            return 'Just now';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes}m ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours}h ago`;
        } else {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days}d ago`;
        }
    };

    const getFilteredActivities = () => {
        let filtered = activities;

        // Apply search filter
        if (searchQuery) {
            filtered = filtered.filter(activity =>
                activity.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                activity.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                activity.type.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return filtered;
    };

    const openActivityModal = (activity) => {
        setSelectedActivity(activity);
        setAdminNotes(activity.adminNotes || '');
        setShowActivityModal(true);
    };

    const closeActivityModal = () => {
        setShowActivityModal(false);
        setSelectedActivity(null);
        setAdminNotes('');
    };

    const flagActivity = async () => {
        if (!selectedActivity || !adminNotes.trim()) {
            ToastService.error('Please provide a reason for flagging');
            return;
        }

        try {
            setProcessingActivity(true);
            await AdminActivityLogger.flagActivity(selectedActivity.id, adminNotes, userId);
            ToastService.success('Activity flagged successfully');
            closeActivityModal();
            loadActivities(true);
        } catch (error) {
            console.error('Error flagging activity:', error);
            ToastService.error('Error flagging activity');
        } finally {
            setProcessingActivity(false);
        }
    };

    const markAsProcessed = async () => {
        if (!selectedActivity) return;

        try {
            setProcessingActivity(true);
            await AdminActivityLogger.markActivityProcessed(selectedActivity.id, userId, adminNotes);
            ToastService.success('Activity marked as processed');
            closeActivityModal();
            loadActivities(true);
        } catch (error) {
            console.error('Error marking activity as processed:', error);
            ToastService.error('Error marking activity as processed');
        } finally {
            setProcessingActivity(false);
        }
    };

    const filteredActivities = getFilteredActivities();

    if (!isAdmin) {
        return (
            <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary, theme.colors.primary]}
                style={[styles.container, { paddingTop: insets.top }]}
            >
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.accent} />
                    <Text style={[styles.loadingText, { color: theme.colors.text }]}>
                        Verifying admin access...
                    </Text>
                </View>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary, theme.colors.primary]}
            style={[styles.container, { paddingTop: insets.top }]}
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
                    Admin Dashboard
                </Text>
                <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={onRefresh}
                >
                    <Ionicons name="refresh" size={24} color={theme.colors.textSecondary} />
                </TouchableOpacity>
            </View>

            {/* Stats Cards */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.statsContainer}
                contentContainerStyle={styles.statsContent}
            >
                <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
                    <Ionicons name="analytics" size={24} color={theme.colors.accent} />
                    <Text style={[styles.statNumber, { color: theme.colors.text }]}>
                        {stats.totalActivities || 0}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                        Total Activities
                    </Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
                    <Ionicons name="warning" size={24} color={theme.colors.error} />
                    <Text style={[styles.statNumber, { color: theme.colors.text }]}>
                        {stats.recentViolations || 0}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                        Violations
                    </Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
                    <Ionicons name="shield" size={24} color={theme.colors.accent} />
                    <Text style={[styles.statNumber, { color: theme.colors.text }]}>
                        {stats.suspiciousActivities || 0}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                        Suspicious
                    </Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
                    <Ionicons name="coin" size={24} color={theme.colors.success} />
                    <Text style={[styles.statNumber, { color: theme.colors.text }]}>
                        {(stats.totalAmount || 0).toFixed(3)}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                        Total Coins
                    </Text>
                </View>
            </ScrollView>

            {/* Search and Filters */}
            <View style={[styles.searchContainer, { backgroundColor: theme.colors.card }]}>
                <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
                <TextInput
                    style={[styles.searchInput, { color: theme.colors.textSecondary }]}
                    placeholder="Search activities..."
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
                <TouchableOpacity
                    style={[
                        styles.filterButton,
                        { backgroundColor: theme.colors.card },
                        selectedFilter === 'all' && { backgroundColor: theme.colors.accent }
                    ]}
                    onPress={() => setSelectedFilter('all')}
                >
                    <Text style={[
                        styles.filterButtonText,
                        { color: selectedFilter === 'all' ? theme.colors.primary : theme.colors.text }
                    ]}>
                        All Types
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.filterButton,
                        { backgroundColor: theme.colors.card },
                        selectedFilter === 'mining_start' && { backgroundColor: theme.colors.accent }
                    ]}
                    onPress={() => setSelectedFilter('mining_start')}
                >
                    <Text style={[
                        styles.filterButtonText,
                        { color: selectedFilter === 'mining_start' ? theme.colors.primary : theme.colors.text }
                    ]}>
                        Mining
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.filterButton,
                        { backgroundColor: theme.colors.card },
                        selectedFilter === 'user_login' && { backgroundColor: theme.colors.accent }
                    ]}
                    onPress={() => setSelectedFilter('user_login')}
                >
                    <Text style={[
                        styles.filterButtonText,
                        { color: selectedFilter === 'user_login' ? theme.colors.primary : theme.colors.text }
                    ]}>
                        User Auth
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.filterButton,
                        { backgroundColor: theme.colors.card },
                        selectedFilter === 'suspicious_activity' && { backgroundColor: theme.colors.accent }
                    ]}
                    onPress={() => setSelectedFilter('suspicious_activity')}
                >
                    <Text style={[
                        styles.filterButtonText,
                        { color: selectedFilter === 'suspicious_activity' ? theme.colors.primary : theme.colors.text }
                    ]}>
                        Security
                    </Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Activities List */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                onScroll={({ nativeEvent }) => {
                    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
                    const paddingToBottom = 20;
                    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
                        loadMoreActivities();
                    }
                }}
                scrollEventThrottle={400}
            >
                {filteredActivities.length > 0 ? (
                    filteredActivities.map((activity, index) => (
                        <TouchableOpacity
                            key={activity.id}
                            style={[
                                styles.activityItem,
                                { backgroundColor: theme.colors.card },
                                index === filteredActivities.length - 1 && { marginBottom: 0 }
                            ]}
                            onPress={() => openActivityModal(activity)}
                        >
                            <View style={[
                                styles.activityIcon,
                                { backgroundColor: `${getActivityColor(activity.severity)}20` }
                            ]}>
                                <Ionicons
                                    name={getActivityIcon(activity.type)}
                                    size={24}
                                    color={getActivityColor(activity.severity)}
                                />
                            </View>
                            
                            <View style={styles.activityContent}>
                                <Text style={[styles.activityText, { color: theme.colors.textSecondary }]}>
                                    {activity.description}
                                </Text>
                                <Text style={[styles.activityDetails, { color: theme.colors.textSecondary }]}>
                                    User: {activity.userId} • Type: {activity.type}
                                </Text>
                                <Text style={[styles.activityTime, { color: theme.colors.textSecondary }]}>
                                    {formatActivityTime(activity.timestamp)}
                                </Text>
                            </View>
                            
                            <View style={styles.activityRight}>
                                <View style={[
                                    styles.statusBadge,
                                    { backgroundColor: getStatusColor(activity.status) }
                                ]}>
                                    <Text style={styles.statusText}>
                                        {activity.status}
                                    </Text>
                                </View>
                                
                                {activity.amount !== 0 && (
                                    <Text style={[
                                        styles.activityAmount,
                                        { color: activity.amount > 0 ? theme.colors.success : theme.colors.error }
                                    ]}>
                                        {activity.amount > 0 ? '+' : ''}{activity.amount.toFixed(3)}
                                    </Text>
                                )}
                                
                                {activity.flagged && (
                                    <Ionicons name="flag" size={16} color={theme.colors.error} />
                                )}
                            </View>
                        </TouchableOpacity>
                    ))
                ) : (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="analytics-outline" size={64} color={theme.colors.textSecondary} />
                        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                            No activities found
                        </Text>
                        <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
                            {searchQuery || selectedFilter !== 'all'
                                ? 'Try adjusting your search or filters'
                                : 'Activities will appear here as they occur'
                            }
                        </Text>
                    </View>
                )}

                {loadingMore && (
                    <View style={styles.loadingMoreContainer}>
                        <ActivityIndicator size="small" color={theme.colors.accent} />
                        <Text style={[styles.loadingMoreText, { color: theme.colors.textSecondary }]}>
                            Loading more...
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* Activity Detail Modal */}
            <Modal
                visible={showActivityModal}
                animationType="slide"
                transparent={true}
                onRequestClose={closeActivityModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                                Activity Details
                            </Text>
                            <TouchableOpacity onPress={closeActivityModal}>
                                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {selectedActivity && (
                            <ScrollView style={styles.modalBody}>
                                <View style={styles.detailRow}>
                                    <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                                        Type:
                                    </Text>
                                    <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                                        {selectedActivity.type}
                                    </Text>
                                </View>

                                <View style={styles.detailRow}>
                                    <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                                        User ID:
                                    </Text>
                                    <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                                        {selectedActivity.userId}
                                    </Text>
                                </View>

                                <View style={styles.detailRow}>
                                    <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                                        Description:
                                    </Text>
                                    <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                                        {selectedActivity.description}
                                    </Text>
                                </View>

                                <View style={styles.detailRow}>
                                    <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                                        Severity:
                                    </Text>
                                    <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                                        {selectedActivity.severity}
                                    </Text>
                                </View>

                                <View style={styles.detailRow}>
                                    <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                                        Status:
                                    </Text>
                                    <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                                        {selectedActivity.status}
                                    </Text>
                                </View>

                                {selectedActivity.amount !== 0 && (
                                    <View style={styles.detailRow}>
                                        <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                                            Amount:
                                        </Text>
                                        <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                                            {selectedActivity.amount.toFixed(3)} coins
                                        </Text>
                                    </View>
                                )}

                                <View style={styles.detailRow}>
                                    <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                                        Timestamp:
                                    </Text>
                                    <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                                        {selectedActivity.timestamp.toLocaleString()}
                                    </Text>
                                </View>

                                {selectedActivity.metadata && Object.keys(selectedActivity.metadata).length > 0 && (
                                    <View style={styles.detailRow}>
                                        <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                                            Metadata:
                                        </Text>
                                        <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                                            {JSON.stringify(selectedActivity.metadata, null, 2)}
                                        </Text>
                                    </View>
                                )}

                                <View style={styles.adminNotesContainer}>
                                    <Text style={[styles.adminNotesLabel, { color: theme.colors.textSecondary }]}>
                                        Admin Notes:
                                    </Text>
                                    <TextInput
                                        style={[styles.adminNotesInput, { 
                                            color: theme.colors.text,
                                            backgroundColor: theme.colors.background,
                                            borderColor: theme.colors.border
                                        }]}
                                        placeholder="Add admin notes..."
                                        placeholderTextColor={theme.colors.textSecondary}
                                        value={adminNotes}
                                        onChangeText={setAdminNotes}
                                        multiline
                                        numberOfLines={3}
                                    />
                                </View>

                                <View style={styles.modalActions}>
                                    <TouchableOpacity
                                        style={[styles.actionButton, { backgroundColor: theme.colors.error }]}
                                        onPress={flagActivity}
                                        disabled={processingActivity}
                                    >
                                        {processingActivity ? (
                                            <ActivityIndicator size="small" color="white" />
                                        ) : (
                                            <>
                                                <Ionicons name="flag" size={16} color="white" />
                                                <Text style={styles.actionButtonText}>Flag</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[styles.actionButton, { backgroundColor: theme.colors.success }]}
                                        onPress={markAsProcessed}
                                        disabled={processingActivity}
                                    >
                                        {processingActivity ? (
                                            <ActivityIndicator size="small" color="white" />
                                        ) : (
                                            <>
                                                <Ionicons name="checkmark" size={16} color="white" />
                                                <Text style={styles.actionButtonText}>Mark Processed</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
    refreshButton: {
        padding: 8,
    },
    statsContainer: {
        marginBottom: 16,
    },
    statsContent: {
        paddingHorizontal: 20,
    },
    statCard: {
        width: 120,
        padding: 16,
        borderRadius: 16,
        marginRight: 12,
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 8,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        textAlign: 'center',
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
    scrollView: {
        flex: 1,
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
    activityDetails: {
        fontSize: 12,
        opacity: 0.7,
        marginBottom: 4,
    },
    activityTime: {
        fontSize: 12,
        opacity: 0.6,
        lineHeight: 18,
    },
    activityRight: {
        alignItems: 'flex-end',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 8,
    },
    statusText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    activityAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'right',
        marginBottom: 4,
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
    loadingMoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
    },
    loadingMoreText: {
        marginLeft: 8,
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: width * 0.9,
        maxHeight: '80%',
        borderRadius: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalBody: {
        padding: 20,
    },
    detailRow: {
        flexDirection: 'row',
        marginBottom: 12,
        alignItems: 'flex-start',
    },
    detailLabel: {
        fontSize: 14,
        fontWeight: '600',
        width: 80,
        marginRight: 12,
    },
    detailValue: {
        fontSize: 14,
        flex: 1,
    },
    adminNotesContainer: {
        marginTop: 20,
        marginBottom: 20,
    },
    adminNotesLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    adminNotesInput: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        textAlignVertical: 'top',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        flex: 0.48,
        justifyContent: 'center',
    },
    actionButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 8,
    },
});

export default AdminDashboardScreen;
