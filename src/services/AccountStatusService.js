import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

class AccountStatusService {
    constructor() {
        this.currentUser = null;
        this.userDocRef = null;
    }

    // Initialize the service with current user
    initialize(userId) {
        if (userId) {
            this.currentUser = userId;
            this.userDocRef = doc(db, 'users', userId);
            console.log('AccountStatusService initialized for user:', userId);
        } else {
            console.log('No user ID provided for AccountStatusService initialization');
        }
    }

    // Check if user account is disabled or locked
    async checkAccountStatus(userId) {
        try {
            if (!userId) {
                console.error('No user ID provided to checkAccountStatus');
                return {
                    isDisabled: false,
                    isLocked: false,
                    status: 'active',
                    message: 'No user ID provided'
                };
            }

            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) {
                console.error('User document not found for account status check');
                return {
                    isDisabled: false,
                    isLocked: false,
                    status: 'not_found',
                    message: 'User document not found'
                };
            }

            const userData = userDoc.data();

            // Check for disabled and locked status
            const isDisabled = userData.isDisabled === true;
            const isLocked = userData.isLocked === true;

            // Check for automatic locking based on failed attempts
            const failedAttempts = userData.failedLoginAttempts || 0;
            const maxFailedAttempts = userData.maxFailedAttempts || 5; // Default to 5 attempts
            const lockoutDuration = userData.lockoutDuration || 15 * 60 * 1000; // Default to 15 minutes
            const lastFailedAttempt = userData.lastFailedAttempt;

            // Check for hourly rate limiting
            const hourlyAttempts = userData.hourlyAttempts || [];
            const currentHour = Math.floor(Date.now() / (60 * 60 * 1000)); // Current hour timestamp
            const hourlyAttemptsInCurrentHour = hourlyAttempts.filter(timestamp =>
                Math.floor(timestamp / (60 * 60 * 1000)) === currentHour
            ).length;

            let status = 'active';
            let message = 'Account is active';
            let autoLocked = false;
            let hourlyLocked = false;

            // Check if account should be locked due to hourly rate limit
            if (hourlyAttemptsInCurrentHour >= 5) {
                hourlyLocked = true;
                status = 'locked';
                const nextHour = (currentHour + 1) * 60 * 60 * 1000;
                const timeUntilNextHour = nextHour - Date.now();
                const minutesUntilNextHour = Math.ceil(timeUntilNextHour / 60000);
                message = `Account locked due to 5 failed attempts within 1 hour. Try again in ${minutesUntilNextHour} minutes.`;
            }
            // Check if account should be automatically locked due to consecutive failed attempts
            else if (failedAttempts >= maxFailedAttempts && lastFailedAttempt) {
                const timeSinceLastAttempt = Date.now() - lastFailedAttempt.toDate();
                if (timeSinceLastAttempt < lockoutDuration) {
                    autoLocked = true;
                    status = 'locked';
                    message = `Account temporarily locked due to ${failedAttempts} consecutive failed login attempts. Try again in ${Math.ceil((lockoutDuration - timeSinceLastAttempt) / 60000)} minutes.`;
                }
            }

            if (isDisabled) {
                status = 'disabled';
                message = 'Account has been disabled by administrator';
            } else if (isLocked || autoLocked || hourlyLocked) {
                status = 'locked';
                message = autoLocked || hourlyLocked ? message : 'Account has been locked by administrator';
            }

            console.log('Account status check result:', {
                userId,
                isDisabled,
                isLocked,
                autoLocked,
                hourlyLocked,
                failedAttempts,
                maxFailedAttempts,
                hourlyAttemptsInCurrentHour,
                status,
                message
            });

            return {
                isDisabled,
                isLocked: isLocked || autoLocked || hourlyLocked,
                autoLocked,
                hourlyLocked,
                status,
                message,
                failedAttempts,
                maxFailedAttempts,
                lockoutDuration,
                lastFailedAttempt,
                hourlyAttemptsInCurrentHour,
                currentHour,
                userData: {
                    username: userData.username,
                    email: userData.email,
                    role: userData.role,
                    createdAt: userData.createdAt,
                    lastLogin: userData.lastLogin
                }
            };

        } catch (error) {
            console.error('Error checking account status:', error);
            return {
                isDisabled: false,
                isLocked: false,
                status: 'error',
                message: 'Error checking account status',
                error: error.message
            };
        }
    }

    // Check if user can access the app
    async canUserAccess(userId) {
        try {
            const accountStatus = await this.checkAccountStatus(userId);

            // User can access if account is neither disabled nor locked
            const canAccess = !accountStatus.isDisabled && !accountStatus.isLocked;

            console.log('User access check result:', {
                userId,
                canAccess,
                status: accountStatus.status
            });

            return {
                canAccess,
                ...accountStatus
            };

        } catch (error) {
            console.error('Error checking user access:', error);
            return {
                canAccess: false,
                isDisabled: false,
                isLocked: false,
                status: 'error',
                message: 'Error checking user access',
                error: error.message
            };
        }
    }

    // Get account status details for display
    async getAccountStatusDetails(userId) {
        try {
            const accountStatus = await this.checkAccountStatus(userId);

            if (accountStatus.isDisabled) {
                return {
                    title: 'Account Disabled',
                    message: 'Your account has been disabled by an administrator. Please contact support for assistance.',
                    icon: 'ban',
                    color: '#EF4444',
                    action: 'contact_support'
                };
            } else if (accountStatus.isLocked) {
                return {
                    title: 'Account Locked',
                    message: 'Your account has been locked due to security concerns. Please contact support to unlock your account.',
                    icon: 'lock-closed',
                    color: '#F59E0B',
                    action: 'contact_support'
                };
            }

            return {
                title: 'Account Active',
                message: 'Your account is active and you can access all features.',
                icon: 'checkmark-circle',
                color: '#10B981',
                action: 'none'
            };

        } catch (error) {
            console.error('Error getting account status details:', error);
            return {
                title: 'Status Unknown',
                message: 'Unable to determine account status. Please try again or contact support.',
                icon: 'help-circle',
                color: '#6B7280',
                action: 'contact_support'
            };
        }
    }

    // Record a failed login attempt
    async recordFailedLoginAttempt(userId, attemptInfo = {}) {
        try {
            if (!userId) {
                console.error('No user ID provided to recordFailedLoginAttempt');
                return false;
            }

            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) {
                console.error('User document not found for recording failed attempt');
                return false;
            }

            const userData = userDoc.data();
            const currentAttempts = userData.failedLoginAttempts || 0;
            const maxAttempts = userData.maxFailedAttempts || 5;
            const newAttempts = currentAttempts + 1;

            // Get current hourly attempts and clean old ones
            const currentHour = Math.floor(Date.now() / (60 * 60 * 1000));
            const hourlyAttempts = userData.hourlyAttempts || [];

            // Remove attempts older than 1 hour
            const recentHourlyAttempts = hourlyAttempts.filter(timestamp =>
                Math.floor(timestamp / (60 * 60 * 1000)) >= currentHour - 1
            );

            // Add current attempt
            recentHourlyAttempts.push(Date.now());

            // Check if hourly limit exceeded
            const attemptsInCurrentHour = recentHourlyAttempts.filter(timestamp =>
                Math.floor(timestamp / (60 * 60 * 1000)) === currentHour
            ).length;

            // Update failed attempts count, timestamp, and hourly attempts
            await updateDoc(userRef, {
                failedLoginAttempts: newAttempts,
                lastFailedAttempt: serverTimestamp(),
                hourlyAttempts: recentHourlyAttempts,
                lastFailedLoginInfo: {
                    timestamp: new Date().toISOString(),
                    deviceInfo: attemptInfo.deviceInfo || {},
                    ipAddress: attemptInfo.ipAddress || 'unknown',
                    userAgent: attemptInfo.userAgent || 'unknown'
                }
            });

            console.log('Failed login attempt recorded:', {
                userId,
                attemptNumber: newAttempts,
                maxAttempts,
                willLock: newAttempts >= maxAttempts,
                attemptsInCurrentHour,
                hourlyLimitExceeded: attemptsInCurrentHour >= 5
            });

            // Check if account should be automatically locked due to consecutive attempts
            if (newAttempts >= maxAttempts) {
                await this.lockAccountForFailedAttempts(userId, newAttempts);
            }

            // Check if account should be locked due to hourly rate limit
            if (attemptsInCurrentHour >= 5) {
                await this.lockAccountForHourlyLimit(userId, attemptsInCurrentHour);
            }

            return true;

        } catch (error) {
            console.error('Error recording failed login attempt:', error);
            return false;
        }
    }

    // Lock account due to failed attempts
    async lockAccountForFailedAttempts(userId, failedAttempts) {
        try {
            if (!userId) {
                console.error('No user ID provided to lockAccountForFailedAttempts');
                return false;
            }

            const userRef = doc(db, 'users', userId);
            const lockoutDuration = 15 * 60 * 1000; // 15 minutes default

            await updateDoc(userRef, {
                isLocked: true,
                lockedAt: serverTimestamp(),
                lockedReason: `Automatic lock due to ${failedAttempts} consecutive failed login attempts`,
                lockoutDuration: lockoutDuration,
                lockoutExpiresAt: new Date(Date.now() + lockoutDuration),
                lockoutType: 'consecutive_attempts'
            });

            console.log('Account automatically locked due to consecutive failed attempts:', {
                userId,
                failedAttempts,
                lockoutDuration: lockoutDuration / 60000 + ' minutes'
            });

            return true;

        } catch (error) {
            console.error('Error locking account for failed attempts:', error);
            return false;
        }
    }

    // Lock account due to hourly rate limit
    async lockAccountForHourlyLimit(userId, attemptsInCurrentHour) {
        try {
            if (!userId) {
                console.error('No user ID provided to lockAccountForHourlyLimit');
                return false;
            }

            const userRef = doc(db, 'users', userId);
            const currentHour = Math.floor(Date.now() / (60 * 60 * 1000));
            const nextHour = (currentHour + 1) * 60 * 60 * 1000;
            const lockoutDuration = nextHour - Date.now(); // Until next hour

            await updateDoc(userRef, {
                isLocked: true,
                lockedAt: serverTimestamp(),
                lockedReason: `Automatic lock due to ${attemptsInCurrentHour} failed attempts within 1 hour`,
                lockoutDuration: lockoutDuration,
                lockoutExpiresAt: new Date(nextHour),
                lockoutType: 'hourly_rate_limit'
            });

            console.log('Account automatically locked due to hourly rate limit:', {
                userId,
                attemptsInCurrentHour,
                lockoutDuration: lockoutDuration / 60000 + ' minutes',
                unlocksAt: new Date(nextHour)
            });

            return true;

        } catch (error) {
            console.error('Error locking account for hourly rate limit:', error);
            return false;
        }
    }

    // Reset failed login attempts (call on successful login)
    async resetFailedLoginAttempts(userId) {
        try {
            if (!userId) {
                console.error('No user ID provided to resetFailedLoginAttempts');
                return false;
            }

            const userRef = doc(db, 'users', userId);

            await updateDoc(userRef, {
                failedLoginAttempts: 0,
                lastFailedAttempt: null,
                lastFailedLoginInfo: null,
                hourlyAttempts: [],
                isLocked: false,
                lockedAt: null,
                lockedReason: null,
                lockoutExpiresAt: null,
                lockoutType: null
            });


            return true;

        } catch (error) {
            console.error('Error resetting failed login attempts:', error);
            return false;
        }
    }

    // Check if account is temporarily locked and when it will unlock
    async getLockoutStatus(userId) {
        try {
            const accountStatus = await this.checkAccountStatus(userId);

            if (!accountStatus.isLocked) {
                return {
                    isLocked: false,
                    remainingTime: 0,
                    canUnlock: true
                };
            }

            // Check for hourly rate limit lockout
            if (accountStatus.hourlyLocked) {
                const currentHour = Math.floor(Date.now() / (60 * 60 * 1000));
                const nextHour = (currentHour + 1) * 60 * 60 * 1000;
                const remainingTime = Math.max(0, nextHour - Date.now());
                const canUnlock = remainingTime === 0;

                return {
                    isLocked: true,
                    remainingTime,
                    canUnlock,
                    lockoutExpiresAt: new Date(nextHour),
                    lockoutType: 'hourly_rate_limit',
                    hourlyAttempts: accountStatus.hourlyAttemptsInCurrentHour,
                    reason: 'Hourly rate limit exceeded'
                };
            }

            // Check for consecutive attempts lockout
            if (accountStatus.autoLocked && accountStatus.lastFailedAttempt) {
                const lockoutExpiresAt = accountStatus.lastFailedAttempt.toDate().getTime() + accountStatus.lockoutDuration;
                const remainingTime = Math.max(0, lockoutExpiresAt - Date.now());
                const canUnlock = remainingTime === 0;

                return {
                    isLocked: true,
                    remainingTime,
                    canUnlock,
                    lockoutExpiresAt: new Date(lockoutExpiresAt),
                    lockoutType: 'consecutive_attempts',
                    failedAttempts: accountStatus.failedAttempts,
                    maxAttempts: accountStatus.maxFailedAttempts,
                    reason: 'Consecutive failed attempts exceeded'
                };
            }

            return {
                isLocked: true,
                remainingTime: 0,
                canUnlock: false,
                reason: 'Account locked by administrator'
            };

        } catch (error) {
            console.error('Error getting lockout status:', error);
            return {
                isLocked: false,
                remainingTime: 0,
                canUnlock: true
            };
        }
    }

    // Track "Check Again" button usage to prevent spam
    async recordCheckAgainAttempt(userId) {
        try {
            if (!userId) {
                console.error('No user ID provided to recordCheckAgainAttempt');
                return false;
            }

            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) {
                console.error('User document not found for recording check again attempt');
                return false;
            }

            const userData = userDoc.data();
            const checkAgainAttempts = userData.checkAgainAttempts || [];
            const currentHour = Math.floor(Date.now() / (60 * 60 * 1000));

            // Remove attempts older than 1 hour
            const recentCheckAgainAttempts = checkAgainAttempts.filter(timestamp =>
                Math.floor(timestamp / (60 * 60 * 1000)) >= currentHour - 1
            );

            // Add current attempt
            recentCheckAgainAttempts.push(Date.now());

            // Check if hourly limit exceeded (5 attempts per hour)
            const attemptsInCurrentHour = recentCheckAgainAttempts.filter(timestamp =>
                Math.floor(timestamp / (60 * 60 * 1000)) === currentHour
            ).length;

            await updateDoc(userRef, {
                checkAgainAttempts: recentCheckAgainAttempts
            });

            console.log('Check again attempt recorded:', {
                userId,
                attemptsInCurrentHour,
                hourlyLimitExceeded: attemptsInCurrentHour >= 5
            });

            return {
                canCheck: attemptsInCurrentHour < 5,
                attemptsInCurrentHour,
                remainingAttempts: Math.max(0, 5 - attemptsInCurrentHour)
            };

        } catch (error) {
            console.error('Error recording check again attempt:', error);
            return {
                canCheck: true,
                attemptsInCurrentHour: 0,
                remainingAttempts: 5
            };
        }
    }

    // Check if "Check Again" button should be disabled
    async canCheckAgain(userId) {
        try {
            if (!userId) {
                return { canCheck: true, remainingAttempts: 5, disabledUntil: null };
            }

            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);

            if (!userDoc.exists()) {
                return { canCheck: true, remainingAttempts: 5, disabledUntil: null };
            }

            const userData = userDoc.data();
            const checkAgainAttempts = userData.checkAgainAttempts || [];
            const currentHour = Math.floor(Date.now() / (60 * 60 * 1000));

            const attemptsInCurrentHour = checkAgainAttempts.filter(timestamp =>
                Math.floor(timestamp / (60 * 60 * 1000)) === currentHour
            ).length;

            if (attemptsInCurrentHour >= 5) {
                const nextHour = (currentHour + 1) * 60 * 60 * 1000;
                const disabledUntil = new Date(nextHour);
                return {
                    canCheck: false,
                    remainingAttempts: 0,
                    disabledUntil,
                    reason: 'Rate limit exceeded - try again in 1 hour'
                };
            }

            return {
                canCheck: true,
                remainingAttempts: 5 - attemptsInCurrentHour,
                disabledUntil: null
            };

        } catch (error) {
            console.error('Error checking if can check again:', error);
            return { canCheck: true, remainingAttempts: 5, disabledUntil: null };
        }
    }

    // Cleanup method
    cleanup() {
        this.currentUser = null;
        this.userDocRef = null;
    }
}

export default new AccountStatusService();
