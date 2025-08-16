import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const IconButton = ({
    name,
    size = 24,
    color = '#000',
    onPress,
    disabled = false,
    style,
    iconStyle,
    backgroundColor = 'transparent',
    padding = 8,
    borderRadius = 8,
    activeOpacity = 0.7
}) => {
    return (
        <TouchableOpacity
            style={[
                styles.container,
                {
                    backgroundColor,
                    padding,
                    borderRadius,
                    opacity: disabled ? 0.5 : 1,
                },
                style
            ]}
            onPress={onPress}
            disabled={disabled}
            activeOpacity={activeOpacity}
        >
            <Ionicons
                name={name}
                size={size}
                color={color}
                style={iconStyle}
            />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default IconButton;
