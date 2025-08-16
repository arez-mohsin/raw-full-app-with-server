import { useEffect, useState } from 'react';
import { ensureI18nInitialized, isI18nReady } from '../i18n';

export const useI18n = () => {
    const [isReady, setIsReady] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const initializeI18n = async () => {
            try {
                setIsLoading(true);
                await ensureI18nInitialized();

                if (mounted) {
                    setIsReady(true);
                    setIsLoading(false);
                }
            } catch (error) {
                console.error('Failed to initialize i18n:', error);
                if (mounted) {
                    setIsLoading(false);
                }
            }
        };

        initializeI18n();

        return () => {
            mounted = false;
        };
    }, []);

    return {
        isReady,
        isLoading,
        isI18nReady: isI18nReady()
    };
};
