import { describe, it, expect } from 'vitest';

// Import a simple util to verify the setup works
// We'll test the cn utility from lib/utils
import { cn } from '@/lib/utils';

describe('cn', () => {
  it('merges class names', () => {
    const result = cn('text-red-500', 'text-blue-500');
    expect(result).toContain('text-blue-500');
  });

  it('handles falsy values', () => {
    const result = cn('base', null, undefined, false, '');
    expect(result).toBe('base');
  });
});
