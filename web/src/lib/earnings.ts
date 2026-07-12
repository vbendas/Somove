/**
 * Pure aggregation helpers for the therapist earnings dashboard charts.
 *
 * These take raw Supabase rows (already scoped to a single therapist) and
 * bucket them into zero-filled, chronologically-ordered series that the
 * chart components can render directly. No React, no Supabase client —
 * keeps this trivially unit-testable.
 */

import { formatMonthYear, formatDate } from "@/lib/format";

export interface PaymentRow {
  created_at: string;
  amount_cents: number;
  platform_fee_cents: number;
  therapist_net_cents: number;
  status: string;
}

export interface SessionRow {
  scheduled_at: string;
  status: string;
}

export interface MonthBucket {
  month: string;
  net: number;
  fees: number;
}

export interface WeekBucket {
  week: string;
  count: number;
}

/** The only payment status that represents a successful, counted charge. */
const CONFIRMED_PAYMENT_STATUS = "confirmed";

/** Session statuses that represent a session that actually happened (or is booked to happen). */
const COUNTABLE_SESSION_STATUSES = new Set(["completed", "confirmed", "no_show"]);

/** Returns a new Date set to the first day of the month containing `d`. */
function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** Returns a new Date set to the Monday (ISO week start) of the week containing `d`. */
function startOfIsoWeek(d: Date): Date {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = date.getDay(); // 0 = Sunday, 1 = Monday, ...
  const diffToMonday = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diffToMonday);
  return date;
}

/**
 * Bucket payment rows into `monthsBack` trailing calendar months (oldest
 * first), ending at the calendar month of `anchorDate`. Only rows with
 * status "confirmed" are counted. Months with no matching payments still
 * appear in the output with net/fees of 0.
 */
export function bucketRevenueByMonth(
  payments: PaymentRow[],
  monthsBack: number = 12,
  anchorDate: Date = new Date()
): MonthBucket[] {
  const anchorMonth = startOfMonth(anchorDate);

  const buckets: MonthBucket[] = [];
  const bucketIndexByKey = new Map<string, number>();

  for (let i = monthsBack - 1; i >= 0; i--) {
    const bucketDate = new Date(anchorMonth.getFullYear(), anchorMonth.getMonth() - i, 1);
    const key = `${bucketDate.getFullYear()}-${bucketDate.getMonth()}`;
    bucketIndexByKey.set(key, buckets.length);
    buckets.push({ month: formatMonthYear(bucketDate), net: 0, fees: 0 });
  }

  for (const payment of payments) {
    if (payment.status !== CONFIRMED_PAYMENT_STATUS) continue;
    const paidAt = new Date(payment.created_at);
    const key = `${paidAt.getFullYear()}-${paidAt.getMonth()}`;
    const index = bucketIndexByKey.get(key);
    if (index === undefined) continue;
    buckets[index].net += payment.therapist_net_cents ?? 0;
    buckets[index].fees += payment.platform_fee_cents ?? 0;
  }

  return buckets;
}

/**
 * Bucket session rows into `weeksBack` trailing ISO weeks (Monday-start,
 * oldest first), ending at the ISO week of `anchorDate`. Only rows whose
 * status is "completed", "confirmed", or "no_show" are counted. Weeks with
 * no matching sessions still appear in the output with count 0.
 */
export function bucketSessionsByWeek(
  sessions: SessionRow[],
  weeksBack: number = 12,
  anchorDate: Date = new Date()
): WeekBucket[] {
  const anchorWeek = startOfIsoWeek(anchorDate);

  const buckets: WeekBucket[] = [];
  const bucketIndexByKey = new Map<string, number>();

  for (let i = weeksBack - 1; i >= 0; i--) {
    const bucketDate = new Date(anchorWeek);
    bucketDate.setDate(bucketDate.getDate() - i * 7);
    const key = bucketDate.toISOString().slice(0, 10);
    bucketIndexByKey.set(key, buckets.length);
    buckets.push({ week: formatDate(bucketDate, "short"), count: 0 });
  }

  for (const session of sessions) {
    if (!COUNTABLE_SESSION_STATUSES.has(session.status)) continue;
    const weekStart = startOfIsoWeek(new Date(session.scheduled_at));
    const key = weekStart.toISOString().slice(0, 10);
    const index = bucketIndexByKey.get(key);
    if (index === undefined) continue;
    buckets[index].count += 1;
  }

  return buckets;
}
