import { doc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

class ActivityLogger {
    static async logActivity(userId, type, amount, description) {
        try {
            if (!userId) {
                console.warn('Cannot log activity: No user ID provided');
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

            console.log(`✅ Activity logged: ${type} - ${description} (${amount})`);
        } catch (error) {
            console.error('❌ Error logging activity:', error);
        }
    }

    // Mining activities
    static async logMiningStart(userId, sessionDuration = 7200) {
        await this.logActivity(
            userId,
            'mining',
            0,
            `Started mining session (${Math.floor(sessionDuration / 3600)}h)`
        );
    }

    static async logMiningComplete(userId, earned) {
        await this.logActivity(
            userId,
            'mining',
            earned,
            `Mining session completed (+${earned.toFixed(3)} coins)`
        );
    }

    static async logMiningProgress(userId, earned) {
        await this.logActivity(
            userId,
            'mining',
            earned,
            `Mining progress saved (+${earned.toFixed(3)} coins)`
        );
    }

    // Streak activities
    static async logStreakClaim(userId, streakDay, reward) {
        await this.logActivity(
            userId,
            'streak',
            reward,
            `Daily streak claimed (Day ${streakDay}, +${reward.toFixed(3)} coins)`
        );
    }

    static async logStreakReset(userId) {
        await this.logActivity(
            userId,
            'streak',
            0,
            'Daily streak reset (missed a day)'
        );
    }

    // Upgrade activities
    static async logUpgradePurchase(userId, upgradeType, cost, level) {
        await this.logActivity(
            userId,
            'upgrade',
            -cost,
            `${upgradeType} upgrade purchased (Level ${level}, -${cost.toFixed(3)} coins)`
        );
    }

    // Boost activities
    static async logBoostActivation(userId, boostType, cost, multiplier) {
        await this.logActivity(
            userId,
            'bonus',
            -cost,
            `${multiplier}x boost activated (${boostType}, -${cost.toFixed(3)} coins)`
        );
    }

    // Referral activities
    static async logReferralBonus(userId, amount, description) {
        await this.logActivity(
            userId,
            'referral',
            amount,
            description || `Referral bonus earned (+${amount.toFixed(3)} coins)`
        );
    }

    // Task activities
    static async logTaskCompletion(userId, taskName, reward) {
        await this.logActivity(
            userId,
            'task',
            reward,
            `Task completed: ${taskName} (+${reward.toFixed(3)} coins)`
        );
    }

    // Withdrawal activities
    static async logWithdrawal(userId, amount) {
        await this.logActivity(
            userId,
            'withdrawal',
            -amount,
            `Withdrawal processed (-${amount.toFixed(3)} coins)`
        );
    }

    // Bonus activities
    static async logBonus(userId, bonusType, amount) {
        await this.logActivity(
            userId,
            'bonus',
            amount,
            `${bonusType} bonus earned (+${amount.toFixed(3)} coins)`
        );
    }

    // Rewarded ad bonus wrapper for clarity in call sites
    static async logBonusAward(userId, source, amount) {
        await this.logBonus(userId, source, amount);
    }

    // Level up activities
    static async logLevelUp(userId, newLevel, bonus) {
        await this.logActivity(
            userId,
            'bonus',
            bonus,
            `Level up! (Level ${newLevel}, +${bonus.toFixed(3)} coins)`
        );
    }

    // Achievement activities
    static async logAchievement(userId, achievementName, reward) {
        await this.logActivity(
            userId,
            'bonus',
            reward,
            `Achievement unlocked: ${achievementName} (+${reward.toFixed(3)} coins)`
        );
    }

    // Error activities
    static async logError(userId, errorType, description) {
        await this.logActivity(
            userId,
            'error',
            0,
            `Error: ${errorType} - ${description}`
        );
    }

    // Custom activity
    static async logCustom(userId, type, amount, description) {
        await this.logActivity(userId, type, amount, description);
    }
}

export default ActivityLogger; 