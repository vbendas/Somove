import { describe, it, expect } from 'vitest';
import { bucketRevenueByMonth, bucketSessionsByWeek, type PaymentRow, type SessionRow } from '@/lib/earnings';

const ANCHOR = new Date('2026-07-11T12:00:00');

function payment(overrides: Partial<PaymentRow>): PaymentRow {
  return {
    created_at: '2026-07-01T00:00:00',
    amount_cents: 10000,
    platform_fee_cents: 1000,
    therapist_net_cents: 9000,
    status: 'confirmed',
    ...overrides,
  };
}

function session(overrides: Partial<SessionRow>): SessionRow {
  return {
    scheduled_at: '2026-07-06T10:00:00',
    status: 'completed',
    ...overrides,
  };
}

describe('bucketRevenueByMonth', () => {
  it('returns 12 buckets by default', () => {
    expect(bucketRevenueByMonth([], undefined, ANCHOR)).toHaveLength(12);
  });

  it('returns the requested number of buckets', () => {
    expect(bucketRevenueByMonth([], 6, ANCHOR)).toHaveLength(6);
  });

  it('zero-fills months with no matching payments', () => {
    const buckets = bucketRevenueByMonth([], 12, ANCHOR);
    for (const bucket of buckets) {
      expect(bucket.net).toBe(0);
      expect(bucket.fees).toBe(0);
    }
  });

  it('sums multiple payments landing in the same month', () => {
    const payments = [
      payment({ created_at: '2026-07-02T00:00:00', therapist_net_cents: 9000, platform_fee_cents: 1000 }),
      payment({ created_at: '2026-07-20T00:00:00', therapist_net_cents: 5000, platform_fee_cents: 500 }),
    ];
    const buckets = bucketRevenueByMonth(payments, 12, ANCHOR);
    const july = buckets[buckets.length - 1];
    expect(july.net).toBe(14000);
    expect(july.fees).toBe(1500);
  });

  it('filters out non-confirmed statuses', () => {
    const payments = [
      payment({ created_at: '2026-07-02T00:00:00', status: 'pending', therapist_net_cents: 9000 }),
      payment({ created_at: '2026-07-02T00:00:00', status: 'refunded', therapist_net_cents: 9000 }),
    ];
    const buckets = bucketRevenueByMonth(payments, 12, ANCHOR);
    const july = buckets[buckets.length - 1];
    expect(july.net).toBe(0);
    expect(july.fees).toBe(0);
  });

  it('excludes payments outside the trailing window', () => {
    const payments = [payment({ created_at: '2020-01-01T00:00:00', therapist_net_cents: 9000 })];
    const buckets = bucketRevenueByMonth(payments, 12, ANCHOR);
    const total = buckets.reduce((sum, b) => sum + b.net, 0);
    expect(total).toBe(0);
  });

  it('produces exact month labels ending at a fixed anchor date, oldest first', () => {
    const buckets = bucketRevenueByMonth([], 3, ANCHOR);
    expect(buckets.map((b) => b.month)).toEqual(['May 26', 'Jun 26', 'Jul 26']);
  });
});

describe('bucketSessionsByWeek', () => {
  it('returns 12 buckets by default', () => {
    expect(bucketSessionsByWeek([], undefined, ANCHOR)).toHaveLength(12);
  });

  it('returns the requested number of buckets', () => {
    expect(bucketSessionsByWeek([], 4, ANCHOR)).toHaveLength(4);
  });

  it('zero-fills weeks with no matching sessions', () => {
    const buckets = bucketSessionsByWeek([], 12, ANCHOR);
    for (const bucket of buckets) {
      expect(bucket.count).toBe(0);
    }
  });

  it('counts multiple sessions landing in the same week', () => {
    // ANCHOR (2026-07-11) is a Saturday; its ISO week starts Mon 2026-07-06.
    const sessions = [
      session({ scheduled_at: '2026-07-06T09:00:00', status: 'completed' }),
      session({ scheduled_at: '2026-07-09T15:00:00', status: 'confirmed' }),
    ];
    const buckets = bucketSessionsByWeek(sessions, 12, ANCHOR);
    const currentWeek = buckets[buckets.length - 1];
    expect(currentWeek.count).toBe(2);
  });

  it('filters out non-countable statuses', () => {
    const sessions = [
      session({ scheduled_at: '2026-07-06T09:00:00', status: 'pending_payment' }),
      session({ scheduled_at: '2026-07-06T09:00:00', status: 'cancelled' }),
      session({ scheduled_at: '2026-07-06T09:00:00', status: 'active' }),
    ];
    const buckets = bucketSessionsByWeek(sessions, 12, ANCHOR);
    const currentWeek = buckets[buckets.length - 1];
    expect(currentWeek.count).toBe(0);
  });

  it('counts completed, confirmed, and no_show statuses', () => {
    const sessions = [
      session({ scheduled_at: '2026-07-06T09:00:00', status: 'completed' }),
      session({ scheduled_at: '2026-07-07T09:00:00', status: 'confirmed' }),
      session({ scheduled_at: '2026-07-08T09:00:00', status: 'no_show' }),
    ];
    const buckets = bucketSessionsByWeek(sessions, 12, ANCHOR);
    const currentWeek = buckets[buckets.length - 1];
    expect(currentWeek.count).toBe(3);
  });

  it('excludes sessions outside the trailing window', () => {
    const sessions = [session({ scheduled_at: '2020-01-01T09:00:00', status: 'completed' })];
    const buckets = bucketSessionsByWeek(sessions, 12, ANCHOR);
    const total = buckets.reduce((sum, b) => sum + b.count, 0);
    expect(total).toBe(0);
  });

  it('produces exact week labels (Monday of each ISO week) ending at a fixed anchor date, oldest first', () => {
    const buckets = bucketSessionsByWeek([], 3, ANCHOR);
    // ANCHOR is Sat 2026-07-11 -> current week's Monday is 2026-07-06.
    expect(buckets.map((b) => b.week)).toEqual(['22 Jun', '29 Jun', '6 Jul']);
  });
});
