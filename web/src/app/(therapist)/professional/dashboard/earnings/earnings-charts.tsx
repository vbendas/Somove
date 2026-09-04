"use client";

import nextDynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { MonthBucket, WeekBucket } from "@/lib/earnings";

const RevenueChart = nextDynamic(
  () => import("@/components/charts/revenue-chart").then((m) => m.RevenueChart),
  { ssr: false, loading: () => <Skeleton className="h-[280px] w-full" /> }
);

const SessionsChart = nextDynamic(
  () => import("@/components/charts/sessions-chart").then((m) => m.SessionsChart),
  { ssr: false, loading: () => <Skeleton className="h-[280px] w-full" /> }
);

interface EarningsChartsProps {
  revenueByMonth: MonthBucket[];
  sessionsByWeek: WeekBucket[];
}

export function EarningsCharts({ revenueByMonth, sessionsByWeek }: EarningsChartsProps) {
  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueChart data={revenueByMonth} />
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <SessionsChart data={sessionsByWeek} />
        </CardContent>
      </Card>
    </>
  );
}
