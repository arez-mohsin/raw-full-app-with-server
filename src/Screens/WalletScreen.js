import React from 'react';
import {
    View,
    Text,
    StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const WalletScreen = () => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();

    return (
        <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary, theme.colors.primary]}
            style={[styles.container, { paddingTop: insets.top }]}
        >
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Ionicons name="wallet" size={80} color={theme.colors.accent} />
                </View>

                <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
                    {t('wallet.walletComingSoon')}
                </Text>

                <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                    {t('wallet.workingOnSomethingAmazing')}
                </Text>

                <View style={[styles.featuresCard, { backgroundColor: theme.colors.card }]}>
                    <Text style={[styles.featuresTitle, { color: theme.colors.textPrimary }]}>
                        {t('wallet.futureFeatures')}
                    </Text>

                    <View style={styles.featureItem}>
                        <Ionicons name="trending-up" size={20} color={theme.colors.accent} />
                        <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>
                            {t('wallet.coinListingAndTrading')}
                        </Text>
                    </View>

                    <View style={styles.featureItem}>
                        <Ionicons name="swap-horizontal" size={20} color={theme.colors.accent} />
                        <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>
                            {t('wallet.exchangeWithOtherCryptocurrencies')}
                        </Text>
                    </View>

                    <View style={styles.featureItem}>
                        <Ionicons name="card" size={20} color={theme.colors.accent} />
                        <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>
                            {t('wallet.withdrawToBankAccount')}
                        </Text>
                    </View>

                    <View style={styles.featureItem}>
                        <Ionicons name="gift" size={20} color={theme.colors.accent} />
                        <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>
                            {t('wallet.giftCardsAndRewards')}
                        </Text>
                    </View>

                    <View style={styles.featureItem}>
                        <Ionicons name="shield-checkmark" size={20} color={theme.colors.accent} />
                        <Text style={[styles.featureText, { color: theme.colors.textSecondary }]}>
                            {t('wallet.secureWalletWith2FA')}
                        </Text>
                    </View>
                </View>

                <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                    {t('wallet.keepMiningAndEarningCoins')}
                </Text>
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    iconContainer: {
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 32,
    },
    featuresCard: {
        width: '100%',
        padding: 24,
        borderRadius: 16,
        marginBottom: 24,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    featuresTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    featureText: {
        fontSize: 14,
        marginLeft: 12,
        flex: 1,
    },
    infoText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 20,
    },
});

export default WalletScreen;
