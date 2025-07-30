// src/Screens/RewardTaskScreen.js
import React from "react";
import { View, Text, Button } from "react-native";

export default function RewardTaskScreen({ navigation }) {
    return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text>🎁 Reward Task Screen</Text>
            <Button title="Go Back" onPress={() => navigation.goBack()} />
        </View>
    );
}
