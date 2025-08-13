// RTL (Right-to-Left) language utilities
// List of RTL languages
export const RTL_LANGUAGES = ['ar', 'ckb', 'he', 'fa', 'ur', 'ps', 'sd'];

/**
 * Check if a language code is RTL
 * @param {string} languageCode - The language code to check
 * @returns {boolean} - True if the language is RTL, false otherwise
 */
export const isRTLLanguage = (languageCode) => {
    if (!languageCode) return false;
    return RTL_LANGUAGES.includes(languageCode.toLowerCase());
};

/**
 * Get the text direction for a language
 * @param {string} languageCode - The language code
 * @returns {string} - 'rtl' for RTL languages, 'ltr' for LTR languages
 */
export const getTextDirection = (languageCode) => {
    return isRTLLanguage(languageCode) ? 'rtl' : 'ltr';
};

/**
 * Get the writing direction for a language
 * @param {string} languageCode - The language code
 * @returns {string} - 'right' for RTL languages, 'left' for LTR languages
 */
export const getWritingDirection = (languageCode) => {
    return isRTLLanguage(languageCode) ? 'right' : 'left';
};

/**
 * Get the alignment for a language
 * @param {string} languageCode - The language code
 * @returns {string} - 'right' for RTL languages, 'left' for LTR languages
 */
export const getTextAlign = (languageCode) => {
    return isRTLLanguage(languageCode) ? 'right' : 'left';
};

/**
 * Get the flex direction for a language
 * @param {string} languageCode - The language code
 * @returns {string} - 'row-reverse' for RTL languages, 'row' for LTR languages
 */
export const getFlexDirection = (languageCode) => {
    return isRTLLanguage(languageCode) ? 'row-reverse' : 'row';
};

/**
 * Get the margin start/end for a language
 * @param {string} languageCode - The language code
 * @param {string} startValue - Value for start margin
 * @param {string} endValue - Value for end margin
 * @returns {object} - Object with marginStart and marginEnd properties
 */
export const getMarginDirection = (languageCode, startValue, endValue) => {
    if (isRTLLanguage(languageCode)) {
        return {
            marginStart: endValue,
            marginEnd: startValue,
        };
    }
    return {
        marginStart: startValue,
        marginEnd: endValue,
    };
};

/**
 * Get the padding start/end for a language
 * @param {string} languageCode - The language code
 * @param {string} startValue - Value for start padding
 * @param {string} endValue - Value for end padding
 * @returns {object} - Object with paddingStart and paddingEnd properties
 */
export const getPaddingDirection = (languageCode, startValue, endValue) => {
    if (isRTLLanguage(languageCode)) {
        return {
            paddingStart: endValue,
            paddingEnd: startValue,
        };
    }
    return {
        paddingStart: startValue,
        paddingEnd: endValue,
    };
};

/**
 * Get the border radius for a language (useful for buttons and cards)
 * @param {string} languageCode - The language code
 * @param {string} leftValue - Value for left border radius
 * @param {string} rightValue - Value for right border radius
 * @returns {object} - Object with borderTopLeftRadius and borderTopRightRadius properties
 */
export const getBorderRadiusDirection = (languageCode, leftValue, rightValue) => {
    if (isRTLLanguage(languageCode)) {
        return {
            borderTopLeftRadius: rightValue,
            borderTopRightRadius: leftValue,
            borderBottomLeftRadius: rightValue,
            borderBottomRightRadius: leftValue,
        };
    }
    return {
        borderTopLeftRadius: leftValue,
        borderTopRightRadius: rightValue,
        borderBottomLeftRadius: leftValue,
        borderBottomRightRadius: rightValue,
    };
};
