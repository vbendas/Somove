import { describe, it, expect } from 'vitest';
import { shade, isValidHexColor } from '@/lib/color';

describe('shade', () => {
  it('darkens a 6-digit hex color by the given percent', () => {
    expect(shade('#D4A574', -12)).toBe('#bb9166');
  });

  it('lightens a 6-digit hex color with a positive percent', () => {
    expect(shade('#000000', 50)).toBe('#808080');
  });

  it('expands and darkens a 3-digit hex color', () => {
    expect(shade('#fff', -50)).toBe('#808080');
  });

  it('clamps channels within 0-255', () => {
    expect(shade('#000000', -50)).toBe('#000000');
    expect(shade('#ffffff', 50)).toBe('#ffffff');
  });

  it('returns the input unchanged when it is not a valid hex color', () => {
    expect(shade('not-a-color', -12)).toBe('not-a-color');
    expect(shade('#12345', -12)).toBe('#12345');
  });
});

describe('isValidHexColor', () => {
  it('accepts strict 6-digit hex colors', () => {
    expect(isValidHexColor('#D4A574')).toBe(true);
    expect(isValidHexColor('#abcdef')).toBe(true);
  });

  it('rejects 3-digit hex, missing #, non-hex chars, and non-strings', () => {
    expect(isValidHexColor('#fff')).toBe(false);
    expect(isValidHexColor('D4A574')).toBe(false);
    expect(isValidHexColor('#GGHHII')).toBe(false);
    expect(isValidHexColor(null)).toBe(false);
    expect(isValidHexColor(undefined)).toBe(false);
    expect(isValidHexColor(123456)).toBe(false);
  });
});
