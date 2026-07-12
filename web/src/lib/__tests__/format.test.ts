import { describe, it, expect } from 'vitest';
import {
  APP_LOCALE,
  APP_CURRENCY,
  formatCurrency,
  formatDate,
  formatTime,
  formatDateTime,
  formatMonthYear,
} from '@/lib/format';

describe('constants', () => {
  it('exposes the single source of truth for locale/currency', () => {
    expect(APP_LOCALE).toBe('en-GB');
    expect(APP_CURRENCY).toBe('EUR');
  });
});

describe('formatCurrency', () => {
  it('formats whole euros with no decimals by default', () => {
    expect(formatCurrency(9000)).toBe('€90');
  });

  it('formats cents when showCents is true', () => {
    expect(formatCurrency(9050, { showCents: true })).toBe('€90.50');
  });

  it('pads a single decimal digit when showCents is true', () => {
    expect(formatCurrency(9000, { showCents: true })).toBe('€90.00');
  });

  it('formats large amounts using compact notation', () => {
    const result = formatCurrency(1250000, { compact: true });
    expect(result).toBe('€13K');
  });

  it('rounds to the nearest whole euro by default', () => {
    // 90.4 rounds down, 90.5 rounds up (banker's rounding is not used by Intl)
    expect(formatCurrency(9040)).toBe('€90');
    expect(formatCurrency(9060)).toBe('€91');
  });

  it('handles zero', () => {
    expect(formatCurrency(0)).toBe('€0');
  });
});

describe('formatDate', () => {
  const date = new Date('2026-07-11T00:00:00');

  it('formats short style as "D Mon"', () => {
    expect(formatDate(date, 'short')).toBe('11 Jul');
  });

  it('formats medium style (default) as "Ddd, D Mon"', () => {
    expect(formatDate(date)).toBe('Sat, 11 Jul');
    expect(formatDate(date, 'medium')).toBe('Sat, 11 Jul');
  });

  it('formats long style as "D Month YYYY"', () => {
    expect(formatDate(date, 'long')).toBe('11 July 2026');
  });

  it('accepts an ISO string identically to a Date', () => {
    const iso = '2026-07-11T00:00:00';
    expect(formatDate(iso, 'short')).toBe(formatDate(date, 'short'));
    expect(formatDate(iso, 'medium')).toBe(formatDate(date, 'medium'));
    expect(formatDate(iso, 'long')).toBe(formatDate(date, 'long'));
  });
});

describe('formatTime', () => {
  it('formats as 24h "HH:MM"', () => {
    expect(formatTime(new Date('2026-07-11T14:30:00'))).toBe('14:30');
  });

  it('pads single-digit hours/minutes', () => {
    expect(formatTime(new Date('2026-07-11T09:05:00'))).toBe('09:05');
  });

  it('accepts an ISO string identically to a Date', () => {
    const date = new Date('2026-07-11T14:30:00');
    const iso = '2026-07-11T14:30:00';
    expect(formatTime(iso)).toBe(formatTime(date));
  });
});

describe('formatDateTime', () => {
  it('formats as "Ddd, D Mon at HH:MM"', () => {
    expect(formatDateTime(new Date('2026-07-11T14:30:00'))).toBe('Sat, 11 Jul at 14:30');
  });

  it('accepts an ISO string identically to a Date', () => {
    const date = new Date('2026-07-11T14:30:00');
    const iso = '2026-07-11T14:30:00';
    expect(formatDateTime(iso)).toBe(formatDateTime(date));
  });
});

describe('formatMonthYear', () => {
  it('formats as "Mon YY"', () => {
    expect(formatMonthYear(new Date('2026-07-11T00:00:00'))).toBe('Jul 26');
  });

  it('accepts an ISO string identically to a Date', () => {
    const date = new Date('2026-07-11T00:00:00');
    const iso = '2026-07-11T00:00:00';
    expect(formatMonthYear(iso)).toBe(formatMonthYear(date));
  });
});
