"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { WeekBucket } from "@/lib/earnings";

export function SessionsChart({ data }: { data: WeekBucket[] }) {
  return (
    <div role="img" aria-label={`Sessions by week, last ${data.length} weeks`}>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} barCategoryGap="25%">
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="week"
            tick={{ fill: "var(--warm-gray)", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: "var(--warm-gray)", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={32}
            allowDecimals={false}
          />
          <Tooltip
            formatter={(value: number) => [value, "Sessions"]}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--popover-foreground)",
            }}
          />
          <Bar dataKey="count" name="Sessions" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
