import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ScrollView } from 'react-native';
import ToastService from '../utils/ToastService';
import { useTheme } from '../context/ThemeContext';

const ToastDemo = () => {
    const { theme } = useTheme();

    const showToast = (type, options = {}) => {
        switch (type) {
            case 'success':
                ToastService.success('This is a success message! 🎉', 3000, options);
                break;
            case 'error':
                ToastService.error('This is an error message! ❌', 4000, options);
                break;
            case 'warning':
                ToastService.warning('This is a warning message! ⚠️', 3000, options);
                break;
            case 'info':
                ToastService.info('This is an info message! ℹ️', 3000, options);
                break;
            case 'default':
                ToastService.default('This is a default message! 📱', 3000, options);
                break;
            case 'copied':
                ToastService.copied();
                break;
            case 'saved':
                ToastService.saved();
                break;
            case 'network':
                ToastService.networkError();
                break;
            case 'top':
                ToastService.top('This toast appears at the top! ⬆️', 'success');
                break;
            case 'bottom':
                ToastService.bottom('This toast appears at the bottom! ⬇️', 'info');
                break;
            case 'center':
                ToastService.center('This toast appears in the center! 🎯', 'warning');
                break;
            case 'quick':
                ToastService.quick('Quick message! ⚡', 'success');
                break;
            case 'long':
                ToastService.long('This is a longer message that stays visible for 6 seconds! 🕐', 'info');
                break;
            case 'interactive':
                ToastService.withAction(
                    'Item deleted successfully!',
                    'success',
                    'Undo',
                    () => {
                        ToastService.success('Item restored! 🔄');
                    }
                );
                break;
            case 'miningStarted':
                ToastService.miningStarted();
                break;
            case 'miningCompleted':
                ToastService.miningCompleted(25.5);
                break;
            case 'streakMaintained':
                ToastService.streakMaintained(7);
                break;
            case 'taskCompleted':
                ToastService.taskCompleted(10, 50);
                break;
            case 'profileUpdated':
                ToastService.profileUpdated();
                break;
            case 'referralBonus':
                ToastService.referralBonus(100);
                break;
        }
    };

    const toastCategories = [
        {
            title: 'Basic Types',
            toasts: [
                { type: 'success', label: 'Success', emoji: '🎉' },
                { type: 'error', label: 'Error', emoji: '❌' },
                { type: 'warning', label: 'Warning', emoji: '⚠️' },
                { type: 'info', label: 'Info', emoji: 'ℹ️' },
                { type: 'default', label: 'Default', emoji: '📱' },
            ]
        },
        {
            title: 'Common Actions',
            toasts: [
                { type: 'copied', label: 'Copied', emoji: '📋' },
                { type: 'saved', label: 'Saved', emoji: '💾' },
                { type: 'network', label: 'Network Error', emoji: '🌐' },
            ]
        },
        {
            title: 'Positions',
            toasts: [
                { type: 'top', label: 'Top', emoji: '⬆️' },
                { type: 'bottom', label: 'Bottom', emoji: '⬇️' },
                { type: 'center', label: 'Center', emoji: '🎯' },
            ]
        },
        {
            title: 'Durations',
            toasts: [
                { type: 'quick', label: 'Quick', emoji: '⚡' },
                { type: 'long', label: 'Long', emoji: '🕐' },
            ]
        },
        {
            title: 'Interactive',
            toasts: [
                { type: 'interactive', label: 'With Action', emoji: '👆' },
            ]
        },
        {
            title: 'App Specific',
            toasts: [
                { type: 'miningStarted', label: 'Mining Started', emoji: '⛏️' },
                { type: 'miningCompleted', label: 'Mining Completed', emoji: '🎉' },
                { type: 'streakMaintained', label: 'Streak Maintained', emoji: '🔥' },
                { type: 'taskCompleted', label: 'Task Completed', emoji: '🎯' },
                { type: 'profileUpdated', label: 'Profile Updated', emoji: '✅' },
                { type: 'referralBonus', label: 'Referral Bonus', emoji: '🎁' },
            ]
        },
    ];

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.primary }]}>
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
                Toast Demo
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                Tap any button to see the styled toast notifications
            </Text>

            {toastCategories.map((category, categoryIndex) => (
                <View key={categoryIndex} style={styles.categoryContainer}>
                    <Text style={[styles.categoryTitle, { color: theme.colors.textPrimary }]}>
                        {category.title}
                    </Text>
                    <View style={styles.buttonGrid}>
                        {category.toasts.map((toast) => (
                            <TouchableOpacity
                                key={toast.type}
                                style={[styles.button, { backgroundColor: theme.colors.card }]}
                                onPress={() => showToast(toast.type)}
                            >
                                <Text style={styles.buttonEmoji}>
                                    {toast.emoji}
                                </Text>
                                <Text style={[styles.buttonText, { color: theme.colors.textPrimary }]}>
                                    {toast.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
        marginTop: 20,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 30,
    },
    categoryContainer: {
        marginBottom: 30,
    },
    categoryTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 15,
        textAlign: 'center',
    },
    buttonGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
    },
    button: {
        width: '48%',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    buttonEmoji: {
        fontSize: 24,
        marginBottom: 8,
    },
    buttonText: {
        fontSize: 14,
        fontWeight: '600',
    },
});

export default ToastDemo;
