/**
 * Utility functions for managing disclaimer acceptance
 */

export const DISCLAIMER_STORAGE_KEY = 'skimmer-watcher-disclaimer-accepted';

/**
 * Check if user has accepted the disclaimer
 * @returns boolean indicating if disclaimer has been accepted
 */
export const hasAcceptedDisclaimer = (): boolean => {
    try {
        return localStorage.getItem(DISCLAIMER_STORAGE_KEY) === 'true';
    } catch (error) {
        console.warn('Unable to access localStorage:', error);
        return false;
    }
};

/**
 * Mark disclaimer as accepted
 */
export const acceptDisclaimer = (): void => {
    try {
        localStorage.setItem(DISCLAIMER_STORAGE_KEY, 'true');
    } catch (error) {
        console.warn('Unable to save to localStorage:', error);
    }
};

/**
 * Clear disclaimer acceptance (useful for testing or re-showing disclaimer)
 */
export const clearDisclaimerAcceptance = (): void => {
    try {
        localStorage.removeItem(DISCLAIMER_STORAGE_KEY);
    } catch (error) {
        console.warn('Unable to clear localStorage:', error);
    }
};

/**
 * Force show disclaimer by clearing acceptance and optionally reloading
 * @param reload Whether to reload the page after clearing
 */
export const forceShowDisclaimer = (reload = false): void => {
    clearDisclaimerAcceptance();
    if (reload) {
        window.location.reload();
    }
};
