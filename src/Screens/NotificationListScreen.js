import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth, db } from '../firebase';
import { doc, collection, query, orderBy, limit, onSnapshot, updateDoc, deleteDoc, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const NotificationListScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const [userId, setUserId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid);
                await loadNotifications(user.uid);
            } else {
                setUserId(null);
            }
        });

        return unsubscribe;
    }, []);

    const loadNotifications = async (uid) => {
        try {
            setLoading(true);
            const notificationsRef = collection(db, "users", uid, "notifications");
            const notificationsQuery = query(
                notificationsRef,
                orderBy("timestamp", "desc"),
                limit(50)
            );

            const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
                const notificationsList = [];
                let unread = 0;

                snapshot.forEach((doc) => {
                    const data = doc.data();
                    notificationsList.push({
                        id: doc.id,
                        title: data.title,
                        message: data.message,
                        type: data.type,
                        timestamp: data.timestamp?.toDate(),
                        read: data.read || false,
                        action: data.action,
                        data: data.data || {},
                    });

                    if (!data.read) {
                        unread++;
                    }
                });

                setNotifications(notificationsList);
                setUnreadCount(unread);
            });

            return unsubscribe;
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        try {
            setRefreshing(true);
            const user = auth.currentUser;
            if (user) {
                await loadNotifications(user.uid);
            }
        } catch (error) {
            console.error('Error refreshing notifications:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            const notificationRef = doc(db, "users", userId, "notifications", notificationId);
            await updateDoc(notificationRef, {
                read: true,
                readAt: new Date(),
            });
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const unreadNotifications = notifications.filter(n => !n.read);
            const batch = db.batch();

            unreadNotifications.forEach(notification => {
                const notificationRef = doc(db, "users", userId, "notifications", notification.id);
                batch.update(notificationRef, {
                    read: true,
                    readAt: new Date(),
                });
            });

            await batch.commit();
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    const deleteNotification = async (notificationId) => {
        try {
            const notificationRef = doc(db, "users", userId, "notifications", notificationId);
            await deleteDoc(notificationRef);
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const clearAllNotifications = async () => {
        Alert.alert(
            'Clear All Notifications',
            'Are you sure you want to delete all notifications? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear All',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const batch = db.batch();
                            notifications.forEach(notification => {
                                const notificationRef = doc(db, "users", userId, "notifications", notification.id);
                                batch.delete(notificationRef);
                            });
                            await batch.commit();
                        } catch (error) {
                            console.error('Error clearing notifications:', error);
                        }
                    },
                },
            ]
        );
    };

    const handleNotificationPress = async (notification) => {
        // Mark as read
        if (!notification.read) {
            await markAsRead(notification.id);
        }

        // Handle different notification types
        switch (notification.type) {
            case 'mining_complete':
                navigation.navigate('Home');
                break;
            case 'streak_available':
                navigation.navigate('Streak');
                break;
            case 'upgrade_available':
                navigation.navigate('Upgrade');
                break;
            case 'referral_bonus':
                navigation.navigate('Invite');
                break;
            case 'level_up':
                navigation.navigate('Profile');
                break;
            default:
                // Default action or no action
                break;
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'mining_complete': return 'checkmark-circle';
            case 'mining_start': return 'play-circle';
            case 'streak_available': return 'flame';
            case 'upgrade_available': return 'rocket';
            case 'referral_bonus': return 'people';
            case 'level_up': return 'trophy';
            case 'bonus': return 'gift';
            case 'warning': return 'warning';
            case 'error': return 'alert-circle';
            default: return 'notifications';
        }
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case 'mining_complete': return '#4CAF50';
            case 'mining_start': return '#2196F3';
            case 'streak_available': return '#FF5722';
            case 'upgrade_available': return '#FF6B35';
            case 'referral_bonus': return '#9C27B0';
            case 'level_up': return '#FFD700';
            case 'bonus': return '#FF9800';
            case 'warning': return '#FF9800';
            case 'error': return '#F44336';
            default: return '#9E9E9E';
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return 'Unknown';
        const now = new Date();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return timestamp.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
                <ActivityIndicator size="large" color={theme.colors.accent} />
                <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                    Loading notifications...
                </Text>
            </View>
        );
    }

    return (
        <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary, theme.colors.primary]}
            style={[styles.container, { paddingTop: insets.top }]}
        >
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
                        Notifications
                    </Text>
                    <View style={styles.headerActions}>
                        {unreadCount > 0 && (
                            <TouchableOpacity
                                style={[styles.markAllButton, { backgroundColor: theme.colors.accent }]}
                                onPress={markAllAsRead}
                            >
                                <Text style={styles.markAllText}>Mark All Read</Text>
                            </TouchableOpacity>
                        )}
                        {notifications.length > 0 && (
                            <TouchableOpacity
                                style={styles.clearButton}
                                onPress={clearAllNotifications}
                            >
                                <Ionicons name="trash" size={20} color={theme.colors.textTertiary} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
                {unreadCount > 0 && (
                    <Text style={[styles.unreadCount, { color: theme.colors.accent }]}>
                        {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
                    </Text>
                )}
            </View>

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
                {notifications.length === 0 ? (
                    <View style={[styles.emptyState, { backgroundColor: theme.colors.card }]}>
                        <Ionicons name="notifications-off" size={64} color={theme.colors.textTertiary} />
                        <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
                            No Notifications
                        </Text>
                        <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
                            You're all caught up! New notifications will appear here.
                        </Text>
                    </View>
                ) : (
                    <View style={styles.notificationsList}>
                        {notifications.map((notification, index) => (
                            <TouchableOpacity
                                key={notification.id}
                                style={[
                                    styles.notificationItem,
                                    {
                                        backgroundColor: theme.colors.card,
                                        borderLeftColor: getNotificationColor(notification.type),
                                        borderLeftWidth: 4,
                                        opacity: notification.read ? 0.7 : 1,
                                    }
                                ]}
                                onPress={() => handleNotificationPress(notification)}
                                onLongPress={() => {
                                    Alert.alert(
                                        'Delete Notification',
                                        'Do you want to delete this notification?',
                                        [
                                            { text: 'Cancel', style: 'cancel' },
                                            {
                                                text: 'Delete',
                                                style: 'destructive',
                                                onPress: () => deleteNotification(notification.id),
                                            },
                                        ]
                                    );
                                }}
                            >
                                <View style={styles.notificationContent}>
                                    <View style={styles.notificationHeader}>
                                        <View style={styles.notificationIcon}>
                                            <Ionicons
                                                name={getNotificationIcon(notification.type)}
                                                size={24}
                                                color={getNotificationColor(notification.type)}
                                            />
                                        </View>
                                        <View style={styles.notificationInfo}>
                                            <Text style={[styles.notificationTitle, { color: theme.colors.textPrimary }]}>
                                                {notification.title}
                                            </Text>
                                            <Text style={[styles.notificationTime, { color: theme.colors.textTertiary }]}>
                                                {formatTime(notification.timestamp)}
                                            </Text>
                                        </View>
                                        {!notification.read && (
                                            <View style={[styles.unreadDot, { backgroundColor: theme.colors.accent }]} />
                                        )}
                                    </View>
                                    <Text style={[styles.notificationMessage, { color: theme.colors.textSecondary }]}>
                                        {notification.message}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
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
    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    markAllButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    markAllText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    clearButton: {
        padding: 8,
    },
    unreadCount: {
        fontSize: 14,
        textAlign: 'center',
        fontWeight: '500',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
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
    notificationsList: {
        gap: 12,
    },
    notificationItem: {
        borderRadius: 12,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    notificationContent: {
        flex: 1,
    },
    notificationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    notificationIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    notificationInfo: {
        flex: 1,
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    notificationTime: {
        fontSize: 12,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    notificationMessage: {
        fontSize: 14,
        lineHeight: 20,
        marginLeft: 52,
    },
});

export default NotificationListScreen; 