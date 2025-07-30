import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const darkTheme = {
    dark: true,
    colors: {
        primary: '#1a1a1a',
        secondary: '#2a2a2a',
        tertiary: '#3a3a3a',
        textPrimary: '#ffffff',
        textSecondary: '#cccccc',
        textTertiary: '#888888',
        accent: '#FFD700',
        accentSecondary: '#FFA500',
        success: '#4CAF50',
        warning: '#FF9800',
        error: '#F44336',
        info: '#2196F3',
        border: '#444444',
        divider: '#333333',
        card: '#2a2a2a',
        surface: '#1a1a1a',
        overlay: 'rgba(0, 0, 0, 0.8)',
        modal: '#2a2a2a',
    },
};

const lightTheme = {
    dark: false,
    colors: {
        primary: '#ffffff',
        secondary: '#f5f5f5',
        tertiary: '#e0e0e0',
        textPrimary: '#000000',
        textSecondary: '#333333',
        textTertiary: '#666666',
        accent: '#FFD700',
        accentSecondary: '#FFA500',
        success: '#4CAF50',
        warning: '#FF9800',
        error: '#F44336',
        info: '#2196F3',
        border: '#e0e0e0',
        divider: '#f0f0f0',
        card: '#ffffff',
        surface: '#f5f5f5',
        overlay: 'rgba(0, 0, 0, 0.5)',
        modal: '#ffffff',
    },
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [isDark, setIsDark] = useState(true); // Default to dark mode

    useEffect(() => {
        loadThemePreference();
    }, []);

    const loadThemePreference = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem('theme');
            if (savedTheme !== null) {
                setIsDark(savedTheme === 'dark');
            }
        } catch (error) {
            console.log('Error loading theme preference:', error);
        }
    };

    const saveThemePreference = async (dark) => {
        try {
            await AsyncStorage.setItem('theme', dark ? 'dark' : 'light');
        } catch (error) {
            console.log('Error saving theme preference:', error);
        }
    };

    const toggleTheme = () => {
        const newTheme = !isDark;
        setIsDark(newTheme);
        saveThemePreference(newTheme);
    };

    const setTheme = (dark) => {
        setIsDark(dark);
        saveThemePreference(dark);
    };

    const theme = isDark ? darkTheme : lightTheme;

    return (
        <ThemeContext.Provider value={{ theme, isDark, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export default ThemeContext;
