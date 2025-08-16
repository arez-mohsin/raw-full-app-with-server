import React, { useState, useEffect } from 'react';
import { 
    
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Linking,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth, db } from '../firebase';
import { doc, updateDoc, getDoc, collection, addDoc, serverTimestamp, getDocs, query, where, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import ActivityLogger from '../utils/ActivityLogger.js';
import ToastService from '../utils/ToastService';
import { hapticMedium, hapticSuccess, hapticError } from '../utils/HapticUtils';

const TasksScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const [userId, setUserId] = useState(null);
    const [userBalance, setUserBalance] = useState(0);
    const [userExperience, setUserExperience] = useState(0);
    const [userLevel, setUserLevel] = useState(1);
    const [completedTasks, setCompletedTasks] = useState({});
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tasksLoading, setTasksLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [timeUntilReset, setTimeUntilReset] = useState('');
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

    // Calculate time until daily reset (midnight)
    const calculateTimeUntilReset = () => {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const timeDiff = tomorrow - now;
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

        return `${hours}h ${minutes}m`;
    };

    // Tasks will be fetched from Firebase collection

    // Fetch tasks from Firebase collection
    const fetchTasks = async () => {
        setTasksLoading(true);
        try {
            const tasksRef = collection(db, "tasks");
            const tasksQuery = query(
                tasksRef,
                where("isActive", "==", true),
                orderBy("order", "asc")
            );

            const tasksSnapshot = await getDocs(tasksQuery);
            const fetchedTasks = [];

            // Icon mapping for common task types
            const getTaskIcon = (taskData) => {
                if (taskData.icon) return taskData.icon;

                // Auto-assign icons based on task type or title
                const title = taskData.title?.toLowerCase() || '';
                const type = taskData.type || '';

                if (type === 'social') {
                    if (title.includes('instagram') || title.includes('insta')) return 'logo-instagram';
                    if (title.includes('facebook') || title.includes('fb')) return 'logo-facebook';
                    if (title.includes('twitter')) return 'logo-twitter';
                    if (title.includes('youtube')) return 'logo-youtube';
                    if (title.includes('telegram')) return 'chatbubbles';
                    if (title.includes('discord')) return 'people';
                    return 'share-social';
                } else if (type === 'daily') {
                    return 'calendar';
                } else if (type === 'action') {
                    if (title.includes('share')) return 'share-social';
                    if (title.includes('invite')) return 'person-add';
                    return 'star';
                }

                return 'star';
            };

            tasksSnapshot.forEach((doc) => {
                const taskData = doc.data();
                fetchedTasks.push({
                    id: doc.id,
                    ...taskData,
                    // Provide fallback values for missing fields
                    title: taskData.title || 'Untitled Task',
                    description: taskData.description || 'No description available',
                    reward: taskData.reward || 0,
                    xp: taskData.xp || 0,
                    icon: getTaskIcon(taskData),
                    color: taskData.color || '#666666',
                    url: taskData.url || '',
                    type: taskData.type || 'action',
                    isActive: taskData.isActive !== false,
                    order: taskData.order || 999
                });
            });

            // Sort by order field
            fetchedTasks.sort((a, b) => a.order - b.order);

            setTasks(fetchedTasks);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            // Fallback to default tasks if Firebase fails
            setTasks([
                {
                    id: 'daily_login',
                    title: 'Daily Login',
                    description: 'Log in to the app today',
                    reward: 5,
                    xp: 15,
                    icon: 'calendar',
                    color: '#4CAF50',
                    type: 'daily'
                }
            ]);
        } finally {
            setTasksLoading(false);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid);
                await loadUserData(user.uid);
                await fetchTasks(); // Fetch tasks when user is authenticated
            } else {
                setUserId(null);
            }
        });

        return unsubscribe;
    }, []);

    // Update countdown timer every minute
    useEffect(() => {
        const updateTimer = () => {
            setTimeUntilReset(calculateTimeUntilReset());
        };

        // Update immediately
        updateTimer();

        // Update every minute
        const interval = setInterval(updateTimer, 60000);

        return () => clearInterval(interval);
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
                await fetchTasks(); // Refresh tasks as well
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
                hapticMedium();
                ToastService.warning('You have already completed this task today.');
                return;
            }

            // For social media tasks, open the URL first
            if (task.type === 'social') {
                // Check if URL exists and is valid
                if (!task.url || task.url.trim() === '') {
                    // If no URL, show alert and complete task directly
                    Alert.alert(
                        'Task Completion',
                        `Did you complete the ${task.title} task?`,
                        [
                            {
                                text: 'No',
                                style: 'cancel',
                                onPress: () => {
                                    ToastService.info('Please complete the task and try again.');
                                }
                            },
                            {
                                text: 'Yes',
                                onPress: () => {
                                    // Complete task immediately
                                    startTaskImmediately(task);
                                }
                            }
                        ],
                        { cancelable: false }
                    );
                    return;
                }

                // Validate URL format
                try {
                    const url = new URL(task.url);
                    if (!url.protocol || !url.hostname) {
                        throw new Error('Invalid URL format');
                    }
                } catch (urlError) {
                    // If URL is invalid, show alert and complete task directly
                    Alert.alert(
                        'Task Completion',
                        `Did you complete the ${task.title} task?`,
                        [
                            {
                                text: 'No',
                                style: 'cancel',
                                onPress: () => {
                                    ToastService.info('Please complete the task and try again.');
                                }
                            },
                            {
                                text: 'Yes',
                                onPress: () => {
                                    // Complete task immediately
                                    startTaskImmediately(task);
                                }
                            }
                        ],
                        { cancelable: false }
                    );
                    return;
                }

                // URL is valid, try to open it
                try {
                    const supported = await Linking.canOpenURL(task.url);
                    if (supported) {
                        await Linking.openURL(task.url);

                        // Show alert asking if user completed the task
                        setTimeout(() => {
                            Alert.alert(
                                'Task Completion',
                                `Did you complete the ${task.title} task?`,
                                [
                                    {
                                        text: 'No',
                                        style: 'cancel',
                                        onPress: () => {
                                            ToastService.info('Please complete the task and try again.');
                                        }
                                    },
                                    {
                                        text: 'Yes',
                                        onPress: () => {
                                            // Complete task immediately
                                            startTaskImmediately(task);
                                        }
                                    }
                                ],
                                { cancelable: false }
                            );
                        }, 1000); // Small delay to ensure user has time to see the link opened

                        return;
                    } else {
                        ToastService.error('Cannot open this link. Please try again.');
                        return;
                    }
                } catch (linkError) {
                    console.warn('Error opening URL:', linkError);
                    // If opening URL fails, show alert and complete task directly
                    Alert.alert(
                        'Task Completion',
                        `Did you complete the ${task.title} task?`,
                        [
                            {
                                text: 'No',
                                style: 'cancel',
                                onPress: () => {
                                    ToastService.info('Please complete the task and try again.');
                                }
                            },
                            {
                                text: 'Yes',
                                onPress: () => {
                                    // Complete task immediately
                                    startTaskImmediately(task);
                                }
                            }
                        ],
                        { cancelable: false }
                    );
                    return;
                }
            } else if (task.type === 'action') {
                // For action tasks like share
                if (task.id === 'share_app') {
                    Alert.alert(
                        'Task Completion',
                        'Did you share the app with your friends?',
                        [
                            {
                                text: 'No',
                                style: 'cancel',
                                onPress: () => {
                                    ToastService.info('Please share the app and try again.');
                                }
                            },
                            {
                                text: 'Yes',
                                onPress: () => {
                                    // Complete task immediately
                                    startTaskImmediately(task);
                                }
                            }
                        ],
                        { cancelable: false }
                    );
                    return;
                }
            } else {
                // For daily tasks, complete immediately
                startTaskImmediately(task);
            }

        } catch (error) {
            console.error('Error handling task:', error);
            ToastService.error('Failed to process task. Please try again.');
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

            // Log task completion to Firebase for analytics
            try {
                await addDoc(collection(db, "taskCompletions"), {
                    userId: userId,
                    taskId: task.id,
                    taskTitle: task.title,
                    reward: task.reward,
                    xp: task.xp,
                    completedAt: serverTimestamp(),
                    userLevel: newLevel,
                    userExperience: newExperience
                });
            } catch (logError) {
                console.warn('Failed to log task completion to Firebase:', logError);
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

            // Haptic feedback for task completion
            hapticSuccess();

            // Enhanced success message with detailed rewards
            const successMessage = `✅ Task Completed Successfully!\n\n💰 +${task.reward} coins added to your balance\n⭐ +${task.xp} XP earned\n\n${levelUpMessage}\n\n💎 New Balance: ${newBalance.toFixed(3)} coins\n📊 Total Experience: ${newExperience} XP\n📈 Current Level: ${newLevel}`;

            ToastService.success(successMessage);

        } catch (error) {
            console.error('Error completing task:', error);
            hapticError();
            ToastService.error('Failed to complete task. Please try again.');
        }
    };

    const startTaskImmediately = async (task) => {
        try {
            if (!userId) return;

            // Haptic feedback for starting task
            hapticMedium();

            // Complete the task immediately
            await completeTask(task);

        } catch (error) {
            console.error('Error starting task:', error);
            hapticError();
            ToastService.error('Failed to start task. Please try again.');
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
                        {task.type === 'social' ? (
                            <TouchableOpacity
                                style={styles.taskIconButton}
                                activeOpacity={0.7}
                                onPress={() => {
                                    // For social tasks, the icon can be interactive
                                    if (task.url && task.url.trim() !== '') {
                                        try {
                                            // Validate URL format
                                            const url = new URL(task.url);
                                            if (url.protocol && url.hostname) {
                                                Linking.openURL(task.url);
                                            } else {
                                                ToastService.info('Task icon clicked - complete the task to earn rewards!');
                                            }
                                        } catch (urlError) {
                                            ToastService.info('Task icon clicked - complete the task to earn rewards!');
                                        }
                                    } else {
                                        ToastService.info('Task icon clicked - complete the task to earn rewards!');
                                    }
                                }}
                            >
                                <Ionicons
                                    name={task.icon || 'star'}
                                    size={24}
                                    color={task.color}
                                />
                            </TouchableOpacity>
                        ) : (
                            <Ionicons
                                name={task.icon || 'star'}
                                size={24}
                                color={task.color}
                            />
                        )}
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
                            <Text style={styles.completedSubtext}>Resets in {timeUntilReset}</Text>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={[styles.completeButton, { backgroundColor: theme.colors.accent }]}
                            onPress={() => handleTaskComplete(task)}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="play" size={20} color="#fff" />
                            <Text style={styles.completeText}>
                                {task.type === 'social' || task.type === 'action' ? 'Open Link' : 'Start Task'}
                            </Text>
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
                        {t('common.loadingTasks')}
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
                {/* Header
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
                        {t('common.dailyTasks')}
                    </Text>
                    <View style={styles.headerSpacer} />
                </View> */}

                {/* Level Display */}
                <View style={[styles.levelCard, { backgroundColor: theme.colors.card }]}>
                    <View style={styles.levelHeader}>
                        <Ionicons
                            name="star"
                            size={24}
                            color="#FFD700"
                        />
                        <Text style={[styles.levelTitle, { color: theme.colors.textPrimary }]}>
                            {t('common.level')} {userLevel}
                        </Text>
                    </View>
                    <View style={styles.levelProgress}>
                        <View style={styles.levelInfo}>
                            <Text style={[styles.levelXP, { color: theme.colors.textSecondary }]}>
                                {userExperience} XP
                            </Text>
                            <Text style={[styles.levelNext, { color: theme.colors.textSecondary }]}>
                                {t('common.nextLevelXp')}: {getXPForNextLevel(userLevel)} XP
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
                        <Ionicons
                            name="trophy"
                            size={24}
                            color={theme.colors.accent}
                        />
                        <Text style={[styles.progressTitle, { color: theme.colors.textPrimary }]}>
                            {t('common.todaysProgress')}
                        </Text>
                    </View>
                    <View style={styles.progressStats}>
                        <View style={styles.progressStat}>
                            <Text style={[styles.progressNumber, { color: theme.colors.accent }]}>
                                {getCompletedTasksCount()}/{tasks.length}
                            </Text>
                            <Text style={[styles.progressLabel, { color: theme.colors.textSecondary }]}>
                                {t('common.tasksCompleted')}
                            </Text>
                        </View>
                        <View style={styles.progressStat}>
                            <Text style={[styles.progressNumber, { color: theme.colors.accent }]}>
                                +{getTotalReward()}
                            </Text>
                            <Text style={[styles.progressLabel, { color: theme.colors.textSecondary }]}>
                                {t('common.coinsEarned')}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Daily Reset Countdown Card */}
                <View style={[styles.resetCard, { backgroundColor: theme.colors.card }]}>
                    <View style={styles.resetHeader}>
                        <Ionicons
                            name="refresh"
                            size={24}
                            color="#FF6B35"
                        />
                        <Text style={[styles.resetTitle, { color: theme.colors.textPrimary }]}>
                            Daily Reset
                        </Text>
                    </View>
                    <View style={styles.resetContent}>
                        <Text style={[styles.resetDescription, { color: theme.colors.textSecondary }]}>
                            All tasks reset at midnight. Complete them before they expire!
                        </Text>
                        <View style={styles.resetTimer}>
                            <Ionicons
                                name="time"
                                size={20}
                                color="#FF6B35"
                            />
                            <Text style={[styles.resetTimeText, { color: '#FF6B35' }]}>
                                {timeUntilReset} until reset
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Tasks List */}
                <View style={styles.tasksSection}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                        {t('common.availableTasks')}
                    </Text>

                    {tasksLoading ? (
                        <View style={styles.tasksLoadingContainer}>
                            <Text style={[styles.tasksLoadingText, { color: theme.colors.textSecondary }]}>
                                Loading tasks...
                            </Text>
                        </View>
                    ) : tasks.length === 0 ? (
                        <View style={[styles.noTasksContainer, { backgroundColor: theme.colors.card }]}>
                            <Ionicons
                                name="list"
                                size={48}
                                color={theme.colors.textTertiary}
                            />
                            <Text style={[styles.noTasksText, { color: theme.colors.textSecondary }]}>
                                No tasks available at the moment
                            </Text>
                            <Text style={[styles.noTasksSubtext, { color: theme.colors.textTertiary }]}>
                                Check back later for new tasks
                            </Text>
                        </View>
                    ) : (
                        tasks.map(renderTaskCard)
                    )}
                </View>

                {/* Tips Section */}
                <View style={[styles.tipsCard, { backgroundColor: theme.colors.card }]}>
                    <View style={styles.tipsHeader}>
                        <Ionicons
                            name="bulb"
                            size={24}
                            color={theme.colors.accent}
                        />
                        <Text style={[styles.tipsTitle, { color: theme.colors.textPrimary }]}>
                            {t('common.tips')}
                        </Text>
                    </View>
                    <View style={styles.tipsContent}>
                        <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                            {t('common.tipCompleteDaily')}
                        </Text>
                        <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                            {t('common.tipSocialReset')}
                        </Text>
                        <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                            {t('common.tipExternalActions')}
                        </Text>
                        <Text style={[styles.tipText, { color: theme.colors.textSecondary }]}>
                            {t('common.tipCheckDaily')}
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
        paddingTop: 120, // Extra padding for large title header
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
        marginBottom: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    resetCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 30,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
        borderLeftWidth: 4,
        borderLeftColor: '#FF6B35',
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
    resetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    resetTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 12,
    },
    resetContent: {
        gap: 12,
    },
    resetDescription: {
        fontSize: 14,
        lineHeight: 20,
    },
    resetTimer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF6B3510',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        alignSelf: 'flex-start',
    },
    resetTimeText: {
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 8,
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
    tasksLoadingContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    tasksLoadingText: {
        fontSize: 16,
        fontStyle: 'italic',
    },
    noTasksContainer: {
        alignItems: 'center',
        paddingVertical: 40,
        borderRadius: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1.41,
    },
    noTasksText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
    },
    noTasksSubtext: {
        fontSize: 14,
        textAlign: 'center',
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
    taskIconButton: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
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
        opacity: 0.8,
        borderWidth: 1,
        borderColor: '#45a049',
    },
    completedText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    completedSubtext: {
        color: '#fff',
        fontSize: 12,
        opacity: 0.9,
        marginLeft: 8,
        fontStyle: 'italic',
    },

    progressBarContainer: {
        height: 4,
        width: '100%',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        borderRadius: 2,
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
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