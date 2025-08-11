import { db } from '../firebase';
import { doc, addDoc, collection, serverTimestamp } from 'firebase/firestore';

class NotificationService {
    // Send notification to a specific user
    static async sendNotification(userId, notificationData) {
        try {
            const notificationsRef = collection(db, "users", userId, "notifications");

            const notification = {
                title: notificationData.title,
                message: notificationData.message,
                type: notificationData.type,
                timestamp: serverTimestamp(),
                read: false,
                action: notificationData.action || null,
                data: notificationData.data || {},
            };

            await addDoc(notificationsRef, notification);
            console.log('Notification sent successfully:', notificationData.title);
        } catch (error) {
            console.error('Error sending notification:', error);
        }
    }

    // Mining notifications
    static async sendMiningStartNotification(userId, sessionDuration = 7200) {
        await this.sendNotification(userId, {
            title: 'Mining Started! ⛏️',
            message: `Your mining session has begun. You'll earn coins over the next ${Math.floor(sessionDuration / 3600)} hours.`,
            type: 'mining_start',
            action: 'navigate_to_home',
        });
    }

    static async sendMiningCompleteNotification(userId, earnedCoins) {
        await this.sendNotification(userId, {
            title: 'Mining Complete! 🎉',
            message: `Congratulations! You've earned ${earnedCoins.toFixed(2)} coins from your mining session.`,
            type: 'mining_complete',
            action: 'navigate_to_home',
            data: { earnedCoins },
        });
    }

    static async sendMiningProgressNotification(userId, progress, earnedSoFar) {
        await this.sendNotification(userId, {
            title: 'Mining Progress Update 📈',
            message: `Your mining is ${Math.round(progress * 100)}% complete. You've earned ${earnedSoFar.toFixed(2)} coins so far!`,
            type: 'mining_progress',
            action: 'navigate_to_home',
            data: { progress, earnedSoFar },
        });
    }

    // Streak notifications
    static async sendStreakAvailableNotification(userId, streakDay, reward) {
        await this.sendNotification(userId, {
            title: 'Daily Streak Available! 🔥',
            message: `Day ${streakDay} streak reward is ready! Claim ${reward.toFixed(2)} coins now.`,
            type: 'streak_available',
            action: 'navigate_to_streak',
            data: { streakDay, reward },
        });
    }

    static async sendStreakClaimedNotification(userId, streakDay, reward) {
        await this.sendNotification(userId, {
            title: 'Streak Claimed! 🎯',
            message: `Day ${streakDay} streak claimed! You earned ${reward.toFixed(2)} coins.`,
            type: 'streak_claimed',
            action: 'navigate_to_streak',
            data: { streakDay, reward },
        });
    }

    static async sendStreakResetNotification(userId) {
        await this.sendNotification(userId, {
            title: 'Streak Reset ⚠️',
            message: 'You missed a day! Your streak has been reset. Start a new streak today!',
            type: 'streak_reset',
            action: 'navigate_to_streak',
        });
    }

    // Upgrade notifications
    static async sendUpgradeAvailableNotification(userId, upgradeType, cost) {
        await this.sendNotification(userId, {
            title: 'Upgrade Available! 🚀',
            message: `${upgradeType} upgrade is available for ${cost.toFixed(2)} coins. Boost your mining power!`,
            type: 'upgrade_available',
            action: 'navigate_to_upgrade',
            data: { upgradeType, cost },
        });
    }

    static async sendUpgradePurchasedNotification(userId, upgradeType, level, cost) {
        await this.sendNotification(userId, {
            title: 'Upgrade Purchased! ⚡',
            message: `${upgradeType} upgraded to level ${level}! Cost: ${cost.toFixed(2)} coins.`,
            type: 'upgrade_purchased',
            action: 'navigate_to_upgrade',
            data: { upgradeType, level, cost },
        });
    }

    // Referral notifications
    static async sendReferralBonusNotification(userId, bonusAmount, referredUser) {
        await this.sendNotification(userId, {
            title: 'Referral Bonus! 👥',
            message: `You earned ${bonusAmount.toFixed(2)} coins from ${referredUser}'s registration!`,
            type: 'referral_bonus',
            action: 'navigate_to_invite',
            data: { bonusAmount, referredUser },
        });
    }

    static async sendWelcomeBonusNotification(userId, bonusAmount, referrerName) {
        await this.sendNotification(userId, {
            title: 'Welcome Bonus! 🎁',
            message: `Welcome! You received ${bonusAmount.toFixed(2)} coins from ${referrerName}'s invite code.`,
            type: 'welcome_bonus',
            action: 'navigate_to_home',
            data: { bonusAmount, referrerName },
        });
    }

    // Level up notifications
    static async sendLevelUpNotification(userId, newLevel, bonus) {
        await this.sendNotification(userId, {
            title: 'Level Up! 🏆',
            message: `Congratulations! You reached mining level ${newLevel}! Bonus: ${bonus.toFixed(2)} coins.`,
            type: 'level_up',
            action: 'navigate_to_profile',
            data: { newLevel, bonus },
        });
    }

    // Bonus notifications
    static async sendBonusNotification(userId, bonusType, amount) {
        await this.sendNotification(userId, {
            title: 'Bonus Earned! 💎',
            message: `You earned ${amount.toFixed(2)} coins from ${bonusType}!`,
            type: 'bonus',
            action: 'navigate_to_home',
            data: { bonusType, amount },
        });
    }

    // Achievement notifications
    static async sendAchievementNotification(userId, achievementName, reward) {
        await this.sendNotification(userId, {
            title: 'Achievement Unlocked! 🏅',
            message: `Achievement: ${achievementName}! Reward: ${reward.toFixed(2)} coins.`,
            type: 'achievement',
            action: 'navigate_to_profile',
            data: { achievementName, reward },
        });
    }

    // Security notifications
    static async sendSecurityAlertNotification(userId, alertType, message) {
        await this.sendNotification(userId, {
            title: 'Security Alert! 🔒',
            message: message,
            type: 'security_alert',
            action: 'navigate_to_security',
            data: { alertType },
        });
    }

    static async sendLoginNotification(userId, deviceInfo) {
        await this.sendNotification(userId, {
            title: 'New Login Detected 📱',
            message: `New login from ${deviceInfo.device || 'unknown device'}.`,
            type: 'login_alert',
            action: 'navigate_to_security',
            data: { deviceInfo },
        });
    }

    // System notifications
    static async sendSystemNotification(userId, title, message, type = 'system') {
        await this.sendNotification(userId, {
            title,
            message,
            type,
            action: null,
        });
    }

    static async sendMaintenanceNotification(userId, maintenanceInfo) {
        await this.sendNotification(userId, {
            title: 'Maintenance Notice 🔧',
            message: `Scheduled maintenance: ${maintenanceInfo.message}. Duration: ${maintenanceInfo.duration}.`,
            type: 'maintenance',
            action: null,
            data: { maintenanceInfo },
        });
    }

    // Error notifications
    static async sendErrorNotification(userId, errorType, errorMessage) {
        await this.sendNotification(userId, {
            title: 'Error Occurred ⚠️',
            message: `${errorType}: ${errorMessage}`,
            type: 'error',
            action: null,
            data: { errorType, errorMessage },
        });
    }

    // Custom notification
    static async sendCustomNotification(userId, title, message, type = 'custom', action = null, data = {}) {
        await this.sendNotification(userId, {
            title,
            message,
            type,
            action,
            data,
        });
    }

    // Bulk notifications (for admin purposes)
    static async sendBulkNotification(userIds, notificationData) {
        const promises = userIds.map(userId =>
            this.sendNotification(userId, notificationData)
        );

        try {
            await Promise.all(promises);
            console.log(`Bulk notification sent to ${userIds.length} users`);
        } catch (error) {
            console.error('Error sending bulk notifications:', error);
        }
    }

    // Notification templates
    static getNotificationTemplates() {
        return {
            welcome: {
                title: 'Welcome to RAW CHAIN! 🎉',
                message: 'Start mining and earn coins! Complete the tutorial to get started.',
                type: 'welcome',
            },
            daily_reminder: {
                title: 'Daily Mining Reminder ⛏️',
                message: 'Don\'t forget to start your daily mining session!',
                type: 'reminder',
            },
            weekly_summary: {
                title: 'Weekly Summary 📊',
                message: 'Check your weekly mining performance and earnings!',
                type: 'summary',
            },
            special_offer: {
                title: 'Special Offer! 🎁',
                message: 'Limited time offer: Double mining rewards for the next 24 hours!',
                type: 'offer',
            },
        };
    }
}

export default NotificationService; 