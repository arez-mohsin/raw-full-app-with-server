import { doc, addDoc, collection, serverTimestamp, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';

class AdminActivityLogger {
    // Main admin activity collection
    static ADMIN_ACTIVITIES_COLLECTION = 'adminActivities';

    // Activity types for comprehensive tracking
    static ACTIVITY_TYPES = {
        // Mining activities
        MINING_START: 'mining_start',
        MINING_PROGRESS: 'mining_progress',
        MINING_COMPLETE: 'mining_complete',
        MINING_SESSION_EXPIRED: 'mining_session_expired',
        MINING_ANTI_CHEAT: 'mining_anti_cheat',

        // User activities
        USER_LOGIN: 'user_login',
        USER_LOGOUT: 'user_logout',
        USER_REGISTER: 'user_register',
        USER_PROFILE_UPDATE: 'user_profile_update',
        USER_EMAIL_VERIFICATION: 'user_email_verification',
        USER_PASSWORD_CHANGE: 'user_password_change',
        USER_ACCOUNT_LOCKOUT: 'user_account_lockout',

        // Financial activities
        BALANCE_UPDATE: 'balance_update',
        COIN_EARNED: 'coin_earned',
        WITHDRAWAL_REQUEST: 'withdrawal_request',
        WITHDRAWAL_COMPLETED: 'withdrawal_completed',
        REFERRAL_BONUS: 'referral_bonus',
        DAILY_STREAK_BONUS: 'daily_streak_bonus',

        // Security activities
        SUSPICIOUS_ACTIVITY: 'suspicious_activity',
        DEVICE_FINGERPRINT_CHANGE: 'device_fingerprint_change',
        IP_ADDRESS_CHANGE: 'ip_address_change',
        MULTIPLE_DEVICE_ATTEMPT: 'multiple_device_attempt',
        RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',

        // App system activities
        APP_LAUNCH: 'app_launch',
        APP_BACKGROUND: 'app_background',
        APP_FOREGROUND: 'app_foreground',
        NOTIFICATION_SENT: 'notification_sent',
        PUSH_TOKEN_UPDATE: 'push_token_update',

        // Error and debugging
        ERROR_OCCURRED: 'error_occurred',
        API_CALL_FAILED: 'api_call_failed',
        NETWORK_ERROR: 'network_error',
        VALIDATION_ERROR: 'validation_error',

        // Admin actions
        ADMIN_LOGIN: 'admin_login',
        ADMIN_ACTION: 'admin_action',
        SYSTEM_MAINTENANCE: 'system_maintenance',
        CONFIGURATION_CHANGE: 'configuration_change'
    };

    // Log any activity to admin collection
    static async logAdminActivity(activityData) {
        try {
            const {
                userId,
                type,
                action,
                description,
                metadata = {},
                severity = 'info',
                ipAddress = null,
                deviceId = null,
                userAgent = null,
                location = null,
                amount = 0,
                status = 'success'
            } = activityData;

            const adminActivity = {
                userId: userId || 'system',
                type,
                action,
                description,
                metadata,
                severity,
                ipAddress,
                deviceId,
                userAgent,
                location,
                amount: parseFloat(amount) || 0,
                status,
                timestamp: serverTimestamp(),
                processed: false,
                flagged: false,
                adminNotes: ''
            };

            // Add to admin activities collection
            const adminActivitiesRef = collection(db, this.ADMIN_ACTIVITIES_COLLECTION);
            await addDoc(adminActivitiesRef, adminActivity);

            // Also log to user's personal activities if userId exists
            if (userId && userId !== 'system') {
                await this.logUserActivity(userId, type, amount, description);
            }

            console.log(`✅ Admin Activity Logged: ${type} - ${action} - ${description}`);
            return true;
        } catch (error) {
            console.error('❌ Error logging admin activity:', error);
            return false;
        }
    }

    // Log user-specific activity
    static async logUserActivity(userId, type, amount, description) {
        try {
            if (!userId) {
                console.warn('Cannot log user activity: No user ID provided');
                return;
            }

            const activityData = {
                type,
                amount: parseFloat(amount) || 0,
                description,
                timestamp: serverTimestamp(),
            };

            const activitiesRef = collection(db, "users", userId, "activities");
            await addDoc(activitiesRef, activityData);

            console.log(`✅ User Activity Logged: ${type} - ${description} (${amount})`);
        } catch (error) {
            console.error('❌ Error logging user activity:', error);
        }
    }

    // Mining-specific logging methods
    static async logMiningStart(userId, sessionDuration = 7200, metadata = {}) {
        return await this.logAdminActivity({
            userId,
            type: this.ACTIVITY_TYPES.MINING_START,
            action: 'mining_session_started',
            description: `Started mining session (${Math.floor(sessionDuration / 3600)}h)`,
            metadata: {
                sessionDuration,
                sessionDurationHours: Math.floor(sessionDuration / 3600),
                ...metadata
            },
            severity: 'info'
        });
    }

    static async logMiningProgress(userId, earned, progress = 0, metadata = {}) {
        return await this.logAdminActivity({
            userId,
            type: this.ACTIVITY_TYPES.MINING_PROGRESS,
            action: 'mining_progress_saved',
            description: `Mining progress saved (+${earned.toFixed(3)} coins)`,
            amount: earned,
            metadata: {
                progress,
                ...metadata
            },
            severity: 'info'
        });
    }

    static async logMiningComplete(userId, earned, sessionDuration, metadata = {}) {
        return await this.logAdminActivity({
            userId,
            type: this.ACTIVITY_TYPES.MINING_COMPLETE,
            action: 'mining_session_completed',
            description: `Mining session completed (+${earned.toFixed(3)} coins)`,
            amount: earned,
            metadata: {
                sessionDuration,
                sessionDurationHours: Math.floor(sessionDuration / 3600),
                ...metadata
            },
            severity: 'info'
        });
    }

    static async logMiningAntiCheat(userId, violation, details, metadata = {}) {
        return await this.logAdminActivity({
            userId,
            type: this.ACTIVITY_TYPES.MINING_ANTI_CHEAT,
            action: 'anti_cheat_violation',
            description: `Anti-cheat violation: ${violation}`,
            metadata: {
                violation,
                details,
                ...metadata
            },
            severity: 'warning',
            status: 'violation'
        });
    }

    // User authentication logging
    static async logUserLogin(userId, method = 'email', metadata = {}) {
        return await this.logAdminActivity({
            userId,
            type: this.ACTIVITY_TYPES.USER_LOGIN,
            action: 'user_login_successful',
            description: `User logged in via ${method}`,
            metadata: {
                loginMethod: method,
                ...metadata
            },
            severity: 'info'
        });
    }

    static async logUserLogout(userId, metadata = {}) {
        return await this.logAdminActivity({
            userId,
            type: this.ACTIVITY_TYPES.USER_LOGOUT,
            action: 'user_logout',
            description: 'User logged out',
            metadata,
            severity: 'info'
        });
    }

    static async logUserRegister(userId, metadata = {}) {
        return await this.logAdminActivity({
            userId,
            type: this.ACTIVITY_TYPES.USER_REGISTER,
            action: 'user_registration',
            description: 'New user registered',
            metadata,
            severity: 'info'
        });
    }

    // Security logging
    static async logSuspiciousActivity(userId, activity, details, metadata = {}) {
        return await this.logAdminActivity({
            userId,
            type: this.ACTIVITY_TYPES.SUSPICIOUS_ACTIVITY,
            action: 'suspicious_activity_detected',
            description: `Suspicious activity: ${activity}`,
            metadata: {
                suspiciousActivity: activity,
                details,
                ...metadata
            },
            severity: 'warning',
            status: 'suspicious'
        });
    }

    static async logDeviceFingerprintChange(userId, oldFingerprint, newFingerprint, metadata = {}) {
        return await this.logAdminActivity({
            userId,
            type: this.ACTIVITY_TYPES.DEVICE_FINGERPRINT_CHANGE,
            action: 'device_fingerprint_changed',
            description: 'Device fingerprint changed',
            metadata: {
                oldFingerprint,
                newFingerprint,
                ...metadata
            },
            severity: 'warning',
            status: 'suspicious'
        });
    }

    // Financial logging
    static async logBalanceUpdate(userId, oldBalance, newBalance, reason, metadata = {}) {
        const change = newBalance - oldBalance;
        return await this.logAdminActivity({
            userId,
            type: this.ACTIVITY_TYPES.BALANCE_UPDATE,
            action: 'balance_updated',
            description: `Balance updated: ${oldBalance.toFixed(3)} → ${newBalance.toFixed(3)} (${change > 0 ? '+' : ''}${change.toFixed(3)})`,
            amount: change,
            metadata: {
                oldBalance,
                newBalance,
                reason,
                ...metadata
            },
            severity: 'info'
        });
    }

    static async logCoinEarned(userId, amount, source, metadata = {}) {
        return await this.logAdminActivity({
            userId,
            type: this.ACTIVITY_TYPES.COIN_EARNED,
            action: 'coins_earned',
            description: `Earned ${amount.toFixed(3)} coins from ${source}`,
            amount,
            metadata: {
                source,
                ...metadata
            },
            severity: 'info'
        });
    }

    // Error logging
    static async logError(userId, error, context, metadata = {}) {
        return await this.logAdminActivity({
            userId,
            type: this.ACTIVITY_TYPES.ERROR_OCCURRED,
            action: 'error_occurred',
            description: `Error: ${error.message || error}`,
            metadata: {
                error: error.message || error,
                stack: error.stack,
                context,
                ...metadata
            },
            severity: 'error',
            status: 'error'
        });
    }

    // API call logging
    static async logApiCall(userId, endpoint, method, status, responseTime, metadata = {}) {
        return await this.logAdminActivity({
            userId,
            type: this.ACTIVITY_TYPES.API_CALL_FAILED,
            action: 'api_call_logged',
            description: `${method} ${endpoint} - ${status} (${responseTime}ms)`,
            metadata: {
                endpoint,
                method,
                status,
                responseTime,
                ...metadata
            },
            severity: status >= 400 ? 'warning' : 'info',
            status: status >= 400 ? 'failed' : 'success'
        });
    }

    // System activities
    static async logAppLaunch(userId, metadata = {}) {
        return await this.logAdminActivity({
            userId,
            type: this.ACTIVITY_TYPES.APP_LAUNCH,
            action: 'app_launched',
            description: 'App launched',
            metadata,
            severity: 'info'
        });
    }

    static async logNotificationSent(userId, notificationType, metadata = {}) {
        return await this.logAdminActivity({
            userId,
            type: this.ACTIVITY_TYPES.NOTIFICATION_SENT,
            action: 'notification_sent',
            description: `Notification sent: ${notificationType}`,
            metadata: {
                notificationType,
                ...metadata
            },
            severity: 'info'
        });
    }

    // Admin actions
    static async logAdminAction(adminId, action, targetUserId, details, metadata = {}) {
        return await this.logAdminActivity({
            userId: adminId,
            type: this.ACTIVITY_TYPES.ADMIN_ACTION,
            action: `admin_${action}`,
            description: `Admin action: ${action} on user ${targetUserId}`,
            metadata: {
                adminId,
                action,
                targetUserId,
                details,
                ...metadata
            },
            severity: 'info',
            status: 'admin_action'
        });
    }

    // Flag activity for admin review
    static async flagActivity(activityId, reason, adminId = null) {
        try {
            const activityRef = doc(db, this.ADMIN_ACTIVITIES_COLLECTION, activityId);
            await updateDoc(activityRef, {
                flagged: true,
                flagReason: reason,
                flaggedBy: adminId,
                flaggedAt: serverTimestamp()
            });
            console.log(`✅ Activity flagged: ${activityId} - ${reason}`);
            return true;
        } catch (error) {
            console.error('❌ Error flagging activity:', error);
            return false;
        }
    }

    // Mark activity as processed
    static async markActivityProcessed(activityId, adminId, notes = '') {
        try {
            const activityRef = doc(db, this.ADMIN_ACTIVITIES_COLLECTION, activityId);
            await updateDoc(activityRef, {
                processed: true,
                processedBy: adminId,
                processedAt: serverTimestamp(),
                adminNotes: notes
            });
            console.log(`✅ Activity marked as processed: ${activityId}`);
            return true;
        } catch (error) {
            console.error('❌ Error marking activity as processed:', error);
            return false;
        }
    }

    // Get activity statistics
    static async getActivityStats(timeRange = '24h') {
        try {
            // This would be implemented in the admin dashboard
            // For now, return basic structure
            return {
                totalActivities: 0,
                activitiesByType: {},
                activitiesBySeverity: {},
                recentViolations: 0,
                suspiciousActivities: 0
            };
        } catch (error) {
            console.error('❌ Error getting activity stats:', error);
            return null;
        }
    }
}

export default AdminActivityLogger;
