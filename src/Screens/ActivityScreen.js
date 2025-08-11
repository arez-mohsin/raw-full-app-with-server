import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const ActivityScreen = () => {
    const { t } = useTranslation();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Ionicons name="list" size={48} color="#6366F1" />
                <Text style={styles.title}>{t('activity.activityDetails')}</Text>
                <Text style={styles.subtitle}>{t('common.comingSoon')}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1F2937',
        marginTop: 16,
    },
    subtitle: {
        fontSize: 18,
        color: '#6B7280',
        marginTop: 8,
    },
});

export default ActivityScreen; 