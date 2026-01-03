import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCommandDetector } from './useCommandDetector';

describe('useCommandDetector', () => {
    it('should detect when trigger matches trimmed text', () => {
        const { result } = renderHook(() => useCommandDetector('/model', '/model'));

        expect(result.current.isActive).toBe(true);
    });

    it('should not detect when text has extra content', () => {
        const { result } = renderHook(() => useCommandDetector('/model extra', '/model'));

        expect(result.current.isActive).toBe(false);
    });

    it('should not detect when text is different', () => {
        const { result } = renderHook(() => useCommandDetector('/other', '/model'));

        expect(result.current.isActive).toBe(false);
    });

    it('should handle whitespace correctly', () => {
        const { result } = renderHook(() => useCommandDetector('  /model  ', '/model'));

        expect(result.current.isActive).toBe(true);
    });

    it('should provide clear function that returns empty string', () => {
        const { result } = renderHook(() => useCommandDetector('/model', '/model'));

        const cleared = result.current.clear();

        expect(cleared).toBe('');
    });

    it('should handle empty string', () => {
        const { result } = renderHook(() => useCommandDetector('', '/model'));

        expect(result.current.isActive).toBe(false);
    });

    it('should handle different triggers', () => {
        const { result: result1 } = renderHook(() => useCommandDetector('/settings', '/settings'));
        const { result: result2 } = renderHook(() => useCommandDetector('/help', '/help'));

        expect(result1.current.isActive).toBe(true);
        expect(result2.current.isActive).toBe(true);
    });

    it('should be case sensitive', () => {
        const { result: result1 } = renderHook(() => useCommandDetector('/Model', '/model'));
        const { result: result2 } = renderHook(() => useCommandDetector('/MODEL', '/model'));
        const { result: result3 } = renderHook(() => useCommandDetector('/model', '/model'));

        expect(result1.current.isActive).toBe(false);
        expect(result2.current.isActive).toBe(false);
        expect(result3.current.isActive).toBe(true);
    });
});
