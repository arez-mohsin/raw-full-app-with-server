import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import {
    isRTLLanguage,
    getTextDirection,
    getWritingDirection,
    getTextAlign,
    getFlexDirection,
    getMarginDirection,
    getPaddingDirection,
    getBorderRadiusDirection
} from '../utils/RTLUtils';

/**
 * Custom hook for RTL (Right-to-Left) support
 * Automatically updates when language changes
 * @returns {object} RTL utilities and current language info
 */
export const useRTL = () => {
    const { i18n } = useTranslation();
    const currentLanguage = i18n.language;

    const rtlUtils = useMemo(() => {
        const isRTL = isRTLLanguage(currentLanguage);
        const direction = getTextDirection(currentLanguage);
        const writingDirection = getWritingDirection(currentLanguage);
        const textAlign = getTextAlign(currentLanguage);
        const flexDirection = getFlexDirection(currentLanguage);

        return {
            // Language info
            currentLanguage,
            isRTL,
            direction,

            // Text and writing direction
            writingDirection,
            textAlign,

            // Layout direction
            flexDirection,

            // Utility functions
            getMarginDirection: (startValue, endValue) =>
                getMarginDirection(currentLanguage, startValue, endValue),

            getPaddingDirection: (startValue, endValue) =>
                getPaddingDirection(currentLanguage, startValue, endValue),

            getBorderRadiusDirection: (leftValue, rightValue) =>
                getBorderRadiusDirection(currentLanguage, leftValue, rightValue),

            // Common RTL styles
            rtlStyles: {
                writingDirection,
                textAlign,
                flexDirection,
            },

            // Common RTL container styles
            containerStyles: {
                writingDirection,
                flexDirection,
            },

            // Common RTL container styles for cards (always column)
            cardContainerStyles: {
                writingDirection,
                flexDirection: 'column',
            },

            // Common RTL text styles
            textStyles: {
                writingDirection,
                textAlign,
            },
        };
    }, [currentLanguage]);

    return rtlUtils;
};
