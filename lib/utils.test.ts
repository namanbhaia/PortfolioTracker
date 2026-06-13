import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility', () => {
    it('should merge classes correctly', () => {
        expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('should handle conditional classes', () => {
        expect(cn('class1', true && 'class2', false && 'class3')).toBe('class1 class2');
    });

    it('should merge tailwind classes using twMerge', () => {
        // p-4 and p-8 should merge to p-8
        expect(cn('p-4', 'p-8')).toBe('p-8');
    });

    it('should handle arrays and objects', () => {
        expect(cn(['class1', 'class2'], { class3: true, class4: false })).toBe('class1 class2 class3');
    });

    it('should handle undefined and null', () => {
        expect(cn('class1', undefined, null)).toBe('class1');
    });
});
