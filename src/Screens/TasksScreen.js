import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Alert,
    Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth, db } from '../firebase';
import { doc, updateDoc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import ActivityLogger from '../utils/ActivityLogger.js';

const TasksScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const [userId, setUserId] = useState(null);
    const [userBalance, setUserBalance] = useState(0);
    const [userExperience, setUserExperience] = useState(0);
    const [userLevel, setUserLevel] = useState(1);
    const [completedTasks, setCompletedTasks] = useState({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const insets = useSafeAreaInsets();

    // Level calculation functions
    const calculateLevel = (experience) => {
        // Level 1: 0-99 XP, Level 2: 100-299 XP, Level 3: 300-599 XP, etc.
        // Formula: level = Math.floor((Math.sqrt(1 + 8 * experience / 100) - 1) / 2) + 1
        return Math.floor((Math.sqrt(1 + 8 * experience / 100) - 1) / 2) + 1;
    };

    const getXPForNextLevel = (currentLevel) => {
        // XP needed for next level: (level * (level + 1) / 2) * 100
        return Math.floor((currentLevel * (currentLevel + 1) / 2) * 100);
    };

    const getXPProgress = (currentExperience, currentLevel) => {
        const xpForCurrentLevel = getXPForNextLevel(currentLevel - 1);
        const xpForNextLevel = getXPForNextLevel(currentLevel);
        const xpInCurrentLevel = currentExperience - xpForCurrentLevel;
        const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;
        return (xpInCurrentLevel / xpNeededForNextLevel) * 100;
    };

    // Task data with XP rewards
    const tasks = [
        {
            id: 'facebook_like',
            title: 'Like Our Facebook Page',
            description: 'Visit and like our Facebook page to earn coins',
            reward: 10,
            xp: 25,
            icon: 'logo-facebook',
            color: '#1877F2',
            url: 'https://facebook.com/yourpage',
            type: 'social'
        },
        {
            id: 'twitter_follow',
            title: 'Follow Us on Twitter',
            description: 'Follow our Twitter account for updates and rewards',
            reward: 15,
            xp: 35,
            icon: 'logo-twitter',
            color: '#1DA1F2',
            url: 'https://twitter.com/youraccount',
            type: 'social'
        },
        {
            id: 'instagram_follow',
            title: 'Follow Our Instagram',
            description: 'Follow our Instagram for exclusive content',
            reward: 20,
            xp: 45,
            icon: 'logo-instagram',
            color: '#E4405F',
            url: 'https://instagram.com/youraccount',
            type: 'social'
        },
        {
            id: 'youtube_subscribe',
            title: 'Subscribe to YouTube',
            description: 'Subscribe to our YouTube channel',
            reward: 25,
            xp: 55,
            icon: 'logo-youtube',
            color: '#FF0000',
            url: 'https://youtube.com/yourchannel',
            type: 'social'
        },
        {
            id: 'telegram_join',
            title: 'Join Telegram Group',
            description: 'Join our Telegram community',
            reward: 30,
            xp: 65,
            icon: 'chatbubbles',
            color: '#0088CC',
            url: 'https://t.me/yourgroup',
            type: 'social'
        },
        {
            id: 'discord_join',
            title: 'Join Discord Server',
            description: 'Join our Discord community',
            reward: 35,
            xp: 75,
            icon: 'people',
            color: '#5865F2',
            url: 'https://discord.gg/yourserver',
            type: 'social'
        },
        {
            id: 'daily_login',
            title: 'Daily Login',
            description: 'Log in to the app today',
            reward: 5,
            xp: 15,
            icon: 'calendar',
            color: '#4CAF50',
            type: 'daily'
        },
        {
            id: 'share_app',
            title: 'Share App',
            description: 'Share the app with your friends',
            reward: 50,
            xp: 120,
            icon: 'share-social',
            color: '#FF6B35',
            type: 'action'
        }
    ];

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid);
                await loadUserData(user.uid);
            } else {
                setUserId(null);
            }
        });

        return unsubscribe;
    }, []);

    const loadUserData = async (uid) => {
        try {
            const userRef = doc(db, "users", uid);
            const userDoc = await getDoc(userRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                setUserBalance(userData.balance || 0);
                setCompletedTasks(userData.completedTasks || {});

                // Load experience and level data
                const userExperience = userData.experience || 0;
                const userLevel = userData.level || 1;
                setUserExperience(userExperience);
                setUserLevel(userLevel);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            if (userId) {
                await loadUserData(userId);
            }
        } catch (error) {
            console.error('Error refreshing:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const handleTaskComplete = async (task) => {
        try {
            if (completedTasks[task.id]) {
                Alert.alert('Task Already Completed', 'You have already completed this task today.');
                return;
            }

            // For social media tasks, open the URL
            if (task.type === 'social') {
                const supported = await Linking.canOpenURL(task.url);
                if (supported) {
                    await Linking.openURL(task.url);

                    Alert.alert(
                        'Task Started',
                        `Please complete the action on ${task.title} and then tap "Mark as Complete"`,
                        [
                            { text: 'Cancel', style: 'cancel' },
                            {
                                text: 'Mark as Complete',
                                onPress: () => completeTask(task)
                            }
                        ]
                    );
                } else {
                    Alert.alert('Error', 'Cannot open this link. Please try again.');
                }
            } else if (task.type === 'action') {
                // For action tasks like share
                if (task.id === 'share_app') {
                    Alert.alert(
                        'Share App',
                        'Please share the app with your friends and then tap "Mark as Complete"',
                        [
                            { text: 'Cancel', style: 'cancel' },
                            {
                                text: 'Mark as Complete',
                                onPress: () => completeTask(task)
                            }
                        ]
                    );
                }
            } else {
                // For daily tasks
                completeTask(task);
            }
        } catch (error) {
            console.error('Error handling task:', error);
            Alert.alert('Error', 'Failed to process task. Please try again.');
        }
    };

    const completeTask = async (task) => {
        try {
            if (!userId) return;

            const userRef = doc(db, "users", userId);
            const newBalance = userBalance + task.reward;
            const newExperience = userExperience + task.xp;
            const newLevel = calculateLevel(newExperience);
            const today = new Date().toDateString();

            // Update user data
            await updateDoc(userRef, {
                balance: newBalance,
                experience: newExperience,
                level: newLevel,
                [`completedTasks.${task.id}`]: today,
            });

            // Log activity
            try {
                if (ActivityLogger && ActivityLogger.logTaskCompletion) {
                    await ActivityLogger.logTaskCompletion(userId, task.title, task.reward);
                } else if (ActivityLogger && ActivityLogger.logCustom) {
                    // Fallback to logCustom if logTaskCompletion is not available
                    await ActivityLogger.logCustom(userId, 'task', task.reward, `Task completed: ${task.title} (+${task.reward} coins)`);
                } else {
                    console.warn('ActivityLogger not available');
                }
            } catch (logError) {
                console.warn('Failed to log task completion:', logError);
            }

            // Update local state
            setUserBalance(newBalance);
            setUserExperience(newExperience);
            setUserLevel(newLevel);
            setCompletedTasks(prev => ({
                ...prev,
                [task.id]: today
            }));

            // Check if user leveled up
            const leveledUp = newLevel > userLevel;
            const levelUpMessage = leveledUp ? `\n🎉 LEVEL UP! You reached Level ${newLevel}!` : '';

            Alert.alert(
                'Task Completed! 🎉',
                `You earned ${task.reward} coins and ${task.xp} experience!${levelUpMessage}\nNew balance: ${newBalance.toFixed(3)} coins\nTotal experience: ${newExperience}`,
                [{ text: 'OK' }]
            );

        } catch (error) {
            console.error('Error completing task:', error);
            Alert.alert('Error', 'Failed to complete task. Please try again.');
        }
    };

    const isTaskCompleted = (taskId) => {
        const completedDate = completedTasks[taskId];
        if (!completedDate) return false;

        const today = new Date().toDateString();
        return completedDate === today;
    };

    const getTaskStatus = (task) => {
        if (isTaskCompleted(task.id)) {
            return 'completed';
        }
        return 'available';
    };

    const renderTaskCard = (task) => {
        const status = getTaskStatus(task);
        const isCompleted = status === 'completed';

        return (
            <View key={task.id} style={[styles.taskCard, { backgroundColor: theme.colors.card }]}>
                <View style={styles.taskHeader}>
                    <View style={[styles.taskIcon, { backgroundColor: `${task.color}20` }]}>
                        <Ionicons name={task.icon} size={24} color={task.color} />
                    </View>
                    <View style={styles.taskInfo}>
                        <Text style={[styles.taskTitle, { color: theme.colors.textPrimary }]}>
                            {task.title}
                        </Text>
                        <Text style={[styles.taskDescription, { color: theme.colors.textSecondary }]}>
                            {task.description}
                        </Text>
                    </View>
                    <View style={styles.taskReward}>
                        <Text style={[styles.rewardText, { color: theme.colors.accent }]}>
                            +{task.reward}
                        </Text>
                        <Text style={[styles.rewardLabel, { color: theme.colors.textTertiary }]}>
                            coins
                        </Text>
                        <Text style={[styles.xpText, { color: '#4CAF50' }]}>
                            +{task.xp} XP
                        </Text>
                    </View>
                </View>

                <View style={styles.taskFooter}>
                    {isCompleted ? (
                        <View style={[styles.completedButton, { backgroundColor: theme.colors.success }]}>
                            <Ionicons name="checkmark-circle" size={20} color="#fff" />
                            <Text style={styles.completedText}>Completed</Text>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={[styles.completeButton, { backgroundColor: theme.colors.accent }]}
                            onPress={() => handleTaskComplete(task)}
                        >
                            <Ionicons name="play" size={20} color="#fff" />
                            <Text style={styles.completeText}>Start Task</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    const getCompletedTasksCount = () => {
        return Object.keys(completedTasks).filter(taskId =>
            completedTasks[taskId] === new Date().toDateString()
        ).length;
    };

    const getTotalReward = () => {
        return tasks.reduce((total, task) => {
            if (isTaskCompleted(task.id)) {
                return total + task.reward;
            }
            return total;
        }, 0);
    };

    if (loading) {
        return (
            <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary, theme.colors.primary]}
                style={[styles.container, { paddingTop: insets.top }]}
            >
                <View style={styles.loadingContainer}>
                    <Text style={[styles.loadingText, { color: theme.colors.textPrimary }]}>
                        Loading tasks...
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
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
                        Daily Tasks
                    </Text>
                    <View style={styles.headerSpacer} />
                </View>

                {/* Level Display */}
                <View style={[styles.levelCard, { backgroundColor: theme.colors.card }]}>
                    <View style={styles.levelHeader}>
                        <Ionicons name="star" size={24} color="#FFD700" />
                        <Text style={[styles.levelTitle, { color: theme.colors.textPrimary }]}>
                            Level {userLevel}
                        </Text>
                    </View>
                    <View style={styles.levelProgress}>
                        <View style={styles.levelInfo}>
                            <Text style={[styles.levelXP, { color: theme.colors.textSecondary }]}>
                                {userExperience} XP
                            </Text>
                            <Text style={[styles.levelNext, { color: theme.colors.textSecondary }]}>
                                Next: {getXPForNextLevel(userLevel)} XP
                            </Text>
                        </View>
                        <View style={styles.progressBarContainer}>
                            <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
                                <View
                                    style={[
                                        styles.progressFill,
                                        {
                                            backgroundColor: '#4CAF50',
                                            width: `${getXPProgress(userExperience, userLevel)}%`
                                        }
                                    ]}
                                />
                            </View>
                        </View>
                    </View>
                </View>

                {/* Progress Card */}
                <View style={[styles.progressCard, { backgroundColor: theme.colors.card }]}>
                    <View style={styles.progressHeader}>
                        <Ionicons name="trophy" size={24} color={theme.colors.accent} />
                        <Text style={[styles.progressTitle, { color: theme.colors.textPrimary }]}>
                            Today's Progress
                        </Text>
                    </View>
                    <View style={styles.progressStats}>
                        <View style={styles.progressStat}>
                            <Text style={[styles.progressNumber, { color: theme.colors.accent }]}>
                                {getCompletedTasksCount()}/{tasks.length}
                            </Text>
                            <Text style={[styles.progressLabel, { color: theme.colors.textSecondary }]}>
                                Tasks Completed
                            </Text>
                        </View>
                        <View style={styles.progressStat}>
                            <Text style={[styles.progressNumber, { color: theme.colors.accent }]}>
                                +{getTotalReward()}
                            </Text>
                            <Text style={[styles.progressLabel, { color: theme.colors.textSecondary }]}>
                                Coins Earned
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Tasks List */}
                <View style={styles.tasksSection}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                        Available Tasks
                    </Text>
                    {tasks.map(renderTaskCard)}
                </View>

                {/* Tips Section */}
                <View style={[styles.tipsCard, { backgroundColor: theme.colors.card }]}>
                    <View style={styles.tipsHeader}>
                        <Ionicons name="bulb" size={24} color={theme.colors.accent} />
                        <Text style={[styles.tipsTitle, { color: theme.colors.textPrimary }]}>
                            Tips
                        </Text>
                    </View>
                    <View style={styles.tipsContent}>
                        <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                            • Complete tasks daily to earn extra coins
                        </Text>
                        <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                            • Social media tasks reset daily
                        </Text>
                        <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                            • Some tasks require external actions
                        </Text>
                        <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                            • Check back daily for new opportunities
                        </Text>
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
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
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
    headerSpacer: {
        width: 40,
    },
    levelCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
    },
    levelHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    levelTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 12,
    },
    levelProgress: {
        gap: 12,
    },
    levelInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    levelXP: {
        fontSize: 16,
        fontWeight: '600',
    },
    levelNext: {
        fontSize: 14,
    },
    progressBarContainer: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBar: {
        flex: 1,
        borderRadius: 4,
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    progressCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 30,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    progressHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    progressTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 12,
    },
    progressStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    progressStat: {
        alignItems: 'center',
    },
    progressNumber: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    progressLabel: {
        fontSize: 14,
        marginTop: 4,
    },
    tasksSection: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    taskCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
    },
    taskHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    taskIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    taskInfo: {
        flex: 1,
    },
    taskTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    taskDescription: {
        fontSize: 14,
        lineHeight: 20,
    },
    taskReward: {
        alignItems: 'center',
    },
    rewardText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    rewardLabel: {
        fontSize: 12,
    },
    xpText: {
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: 2,
    },
    taskFooter: {
        alignItems: 'center',
    },
    completeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFD700',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 25,
    },
    completeText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    completedButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4CAF50',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 25,
    },
    completedText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    tipsCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
    },
    tipsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    tipsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 12,
    },
    tipsContent: {
        gap: 8,
    },
    tipText: {
        fontSize: 14,
        lineHeight: 20,
    },
});

export default TasksScreen; 