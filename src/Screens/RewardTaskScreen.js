// src/Screens/RewardTaskScreen.js
import React from "react";
import { View, Text, Button } from "react-native";
import { useTranslation } from 'react-i18next';

export default function RewardTaskScreen({ navigation }) {
    const { t } = useTranslation();

    return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text>🎁 {t('tasks.rewardTask')}</Text>
            <Button title={t('common.back')} onPress={() => navigation.goBack()} />
        </View>
    );
}
