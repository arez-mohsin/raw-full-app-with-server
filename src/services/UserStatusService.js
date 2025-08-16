import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { AppState } from 'react-native';

class UserStatusService {
    constructor() {
        this.currentUser = null;
        this.userDocRef = null;
        this.currentAppState = 'active'; // Track current app state
    }

    // Initialize the service with current user
    initialize() {
        this.currentUser = auth.currentUser;
        if (this.currentUser) {
            this.userDocRef = doc(db, 'users', this.currentUser.uid);
            console.log('UserStatusService initialized for user:', this.currentUser.uid);
        } else {
            console.log('No authenticated user found for UserStatusService initialization');
        }
    }

    // Handle user login
    handleUserLogin(user) {
        this.currentUser = user;
        this.userDocRef = doc(db, 'users', user.uid);
        console.log('UserStatusService: User logged in:', user.uid);
        this.setUserOnline();
    }

    // Update user status to online
    async setUserOnline() {
        try {
            if (!this.currentUser || !this.userDocRef) {
                this.initialize();
                if (!this.currentUser || !this.userDocRef) {
                    console.log('No authenticated user found for status update');
                    return;
                }
            }

            // Check if document exists before updating
            const documentExists = await this.checkUserDocumentExists();
            if (!documentExists) {
                console.log('User document does not exist, skipping online status update');
                return;
            }

            await updateDoc(this.userDocRef, {
                isOnline: true,
                lastSeen: serverTimestamp(),
                status: 'online',
                lastActive: serverTimestamp(),
                appState: 'active',
                updatedAt: serverTimestamp()
            });

            console.log('User status updated to online');
        } catch (error) {
            console.error('Error updating user status to online:', error);
            // Retry once after a short delay
            setTimeout(() => {
                this.retrySetUserOnline();
            }, 1000);
        }
    }

    // Retry setting user online
    async retrySetUserOnline() {
        try {
            if (this.currentUser && this.userDocRef) {
                // Check if document exists before updating
                const documentExists = await this.checkUserDocumentExists();
                if (!documentExists) {
                    console.log('User document does not exist, skipping retry online status update');
                    return;
                }

                await updateDoc(this.userDocRef, {
                    isOnline: true,
                    lastSeen: serverTimestamp(),
                    status: 'online',
                    lastActive: serverTimestamp(),
                    appState: 'active',
                    updatedAt: serverTimestamp()
                });
                console.log('User status retry update to online successful');
            }
        } catch (error) {
            console.error('Retry failed for setting user online:', error);
        }
    }

    // Check if user document exists
    async checkUserDocumentExists() {
        try {
            if (!this.userDocRef) return false;
            const docSnap = await getDoc(this.userDocRef);
            return docSnap.exists();
        } catch (error) {
            console.error('Error checking if user document exists:', error);
            return false;
        }
    }

    // Update user status to offline
    async setUserOffline() {
        try {
            if (!this.currentUser || !this.userDocRef) {
                this.initialize();
                if (!this.currentUser || !this.userDocRef) {
                    console.log('No authenticated user found for status update');
                    return;
                }
            }

            // Check if document exists before updating
            const documentExists = await this.checkUserDocumentExists();
            if (!documentExists) {
                console.log('User document does not exist, skipping offline status update');
                return;
            }

            await updateDoc(this.userDocRef, {
                isOnline: false,
                lastSeen: serverTimestamp(),
                status: 'offline',
                lastActive: serverTimestamp(),
                appState: 'background',
                updatedAt: serverTimestamp()
            });

            console.log('User status updated to offline');
        } catch (error) {
            console.error('Error updating user status to offline:', error);
            // Retry once after a short delay
            setTimeout(() => {
                this.retrySetUserOffline();
            }, 1000);
        }
    }

    // Retry setting user offline
    async retrySetUserOffline() {
        try {
            if (this.currentUser && this.userDocRef) {
                // Check if document exists before updating
                const documentExists = await this.checkUserDocumentExists();
                if (!documentExists) {
                    console.log('User document does not exist, skipping retry offline status update');
                    return;
                }

                await updateDoc(this.userDocRef, {
                    isOnline: false,
                    lastSeen: serverTimestamp(),
                    status: 'offline',
                    lastActive: serverTimestamp(),
                    appState: 'background',
                    updatedAt: serverTimestamp()
                });
                console.log('User status retry update to offline successful');
            }
        } catch (error) {
            console.error('Retry failed for setting user offline:', error);
        }
    }

    // Handle app state changes
    handleAppStateChange = (nextAppState) => {
        console.log('App state changed from', this.currentAppState, 'to', nextAppState);

        if (nextAppState === 'active') {
            // App became active (opened)
            this.setUserOnline();
        } else if (nextAppState === 'background' || nextAppState === 'inactive') {
            // App went to background or became inactive (closed/minimized)
            this.setUserOffline();
            // Also trigger immediate background check
            this.handleAppBackgrounded();
        }

        this.currentAppState = nextAppState;
    }

    // Handle app termination
    handleAppTermination = () => {
        this.setUserOffline();
    }

    // Handle app becoming active (coming from background)
    handleAppBecameActive = () => {
        this.setUserOnline();
    }

    // Handle app going to background
    handleAppWentToBackground = () => {
        console.log('📱 App going to background - setting user OFFLINE');
        this.setUserOffline();
    }

    // Force check app state and update status
    forceCheckAppState() {
        const currentState = AppState.currentState;
        console.log('🔍 Force checking app state:', currentState);

        if (currentState === 'active') {
            this.setUserOnline();
        } else {
            this.setUserOffline();
        }
    }

    // Handle overview button press (app switcher)
    handleOverviewButtonPress() {
        console.log('📱 Overview button pressed - setting user OFFLINE immediately');
        this.setUserOffline();
    }

    // Handle any app backgrounding event
    handleAppBackgrounded() {
        console.log('📱 App backgrounded - setting user OFFLINE immediately');
        this.setUserOffline();
    }

    // Cleanup method
    cleanup() {
        // Set user offline before cleaning up
        this.setUserOffline();
        this.currentUser = null;
        this.userDocRef = null;
    }

    // Handle user logout
    handleUserLogout() {
        this.setUserOffline();
        this.cleanup();
    }
}

export default new UserStatusService();
