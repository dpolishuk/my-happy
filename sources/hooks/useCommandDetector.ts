import * as React from 'react';

interface UseCommandDetectorResult {
    isActive: boolean;
    clear: () => void;
}

/**
 * Hook to detect when a specific command trigger is typed in the input.
 * Triggers when the text exactly matches the trigger string.
 *
 * @param text - Current input text
 * @param trigger - Command trigger string (e.g., "/model")
 * @returns Object with isActive boolean and clear function
 *
 * @example
 * const { isActive, clear } = useCommandDetector(text, '/model');
 * if (isActive) {
 *   // Show command palette
 * }
 */
export function useCommandDetector(text: string, trigger: string): UseCommandDetectorResult {
    const trimmedText = text.trim();
    const isActive = trimmedText === trigger;

    const clear = React.useCallback(() => {
        // Return empty string to clear the input
        return '';
    }, []);

    return {
        isActive,
        clear,
    };
}
