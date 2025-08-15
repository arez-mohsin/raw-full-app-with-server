import React, { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import UserStatusService from '../services/UserStatusService';

export const useAppState = () => {
    const appState = useRef(AppState.currentState);

    useEffect(() => {
        const handleAppStateChange = (nextAppState) => {
            console.log('🔄 App state change detected:', appState.current, '→', nextAppState);

            // Handle all possible state transitions
            if (nextAppState === 'active') {
                // App became active (from any other state)
                if (appState.current !== 'active') {
                    console.log('✅ App became active - setting user ONLINE');
                    UserStatusService.handleAppBecameActive();
                }
            } else if (nextAppState === 'background') {
                // App went to background
                if (appState.current === 'active') {
                    console.log('❌ App went to background - setting user OFFLINE');
                    UserStatusService.handleAppWentToBackground();
                    // Also trigger immediate background check
                    UserStatusService.handleAppBackgrounded();
                }
            } else if (nextAppState === 'inactive') {
                // App became inactive (transitioning)
                if (appState.current === 'active') {
                    console.log('⏸️ App became inactive - setting user OFFLINE');
                    UserStatusService.handleAppWentToBackground();
                    // Also trigger immediate background check
                    UserStatusService.handleAppBackgrounded();
                }
            }

            appState.current = nextAppState;
        };

        // Also listen for app state changes when the hook is first mounted
        console.log('🚀 useAppState hook initialized, current state:', appState.current);

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        return () => {
            console.log('🧹 useAppState hook cleanup');
            subscription?.remove();
        };
    }, []);



    // Add periodic background check for better reliability
    useEffect(() => {
        let backgroundCheckInterval;

        const startBackgroundCheck = () => {
            backgroundCheckInterval = setInterval(() => {
                const currentState = AppState.currentState;
                if (currentState !== 'active') {
                    console.log('⏰ Background check - app not active, ensuring user is offline');
                    UserStatusService.setUserOffline();
                }
            }, 3000); // Check every 3 seconds for faster response
        };

        const stopBackgroundCheck = () => {
            if (backgroundCheckInterval) {
                clearInterval(backgroundCheckInterval);
            }
        };

        // Start background checking when app goes to background
        const handleBackgroundTransition = (nextAppState) => {
            if (nextAppState === 'background' || nextAppState === 'inactive') {
                startBackgroundCheck();
            } else if (nextAppState === 'active') {
                stopBackgroundCheck();
            }
        };

        const backgroundSubscription = AppState.addEventListener('change', handleBackgroundTransition);

        return () => {
            stopBackgroundCheck();
            backgroundSubscription?.remove();
        };
    }, []);

    return appState.current;
};
