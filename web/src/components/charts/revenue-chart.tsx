"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { MonthBucket } from "@/lib/earnings";
import { formatCurrency } from "@/lib/format";

export function RevenueChart({ data }: { data: MonthBucket[] }) {
  return (
    <div role="img" aria-label={`Net revenue by month, last ${data.length} months`}>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} barCategoryGap="25%">
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="month"
            tick={{ fill: "var(--warm-gray)", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: "var(--warm-gray)", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={48}
            tickFormatter={(v: number) => formatCurrency(v, { compact: true })}
          />
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--popover-foreground)",
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: "var(--warm-gray)" }}
            iconType="circle"
            iconSize={8}
          />
          <Bar dataKey="net" name="Net revenue" stackId="revenue" fill="var(--chart-1)" radius={[0, 0, 0, 0]} />
          <Bar
            dataKey="fees"
            name="Platform fees"
            stackId="revenue"
            fill="var(--chart-2)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
