"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/components/theme-provider";
import { useState } from "react";

type MonthlyData = { month: string; revenue: number; expenses: number };

const revenueColors = ["#8b7aff", "#7259ff", "#5d47d6"];
const expensesColors = ["#fbbf24", "#f59e0b", "#d97706"];

export function DashboardCharts({ monthlyData }: { monthlyData: MonthlyData[] }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const gridColor = isDark ? "#2f2950" : "#e5e7eb";
  const textColor = isDark ? "#a8a3c9" : "#6b7280";
  const [hoveredRev, setHoveredRev] = useState<number | null>(null);
  const [hoveredExp, setHoveredExp] = useState<number | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue vs Expenses</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: textColor, fontSize: 12 }} />
              <Tooltip
                cursor={{ fill: isDark ? "#252045" : "#f9fafb" }}
                contentStyle={{
                  backgroundColor: isDark ? "#1a1530" : "#fff",
                  border: `1px solid ${isDark ? "#2f2950" : "#e5e7eb"}`,
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
                  fontSize: "13px",
                }}
                labelStyle={{ fontWeight: 600, marginBottom: 4, color: isDark ? "#e8e6f5" : "#111827" }}
              />
              <Legend
                wrapperStyle={{ paddingTop: 8 }}
                iconType="circle"
                formatter={(value: string) => <span style={{ color: textColor, fontSize: 13 }}>{value}</span>}
              />
              <Bar
                dataKey="revenue"
                name="Revenue"
                radius={[20, 20, 0, 0]}
                maxBarSize={40}
                animationDuration={1200}
                animationEasing="ease-out"
                animationBegin={0}
                onMouseLeave={() => setHoveredRev(null)}
              >
                {monthlyData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={revenueColors[i % revenueColors.length]}
                    opacity={hoveredRev !== null && hoveredRev !== i ? 0.4 : 1}
                    onMouseEnter={() => setHoveredRev(i)}
                    style={{ transition: "opacity 0.25s ease", cursor: "pointer" }}
                  />
                ))}
              </Bar>
              <Bar
                dataKey="expenses"
                name="Expenses"
                radius={[20, 20, 0, 0]}
                maxBarSize={40}
                animationDuration={1200}
                animationEasing="ease-out"
                animationBegin={200}
                onMouseLeave={() => setHoveredExp(null)}
              >
                {monthlyData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={expensesColors[i % expensesColors.length]}
                    opacity={hoveredExp !== null && hoveredExp !== i ? 0.4 : 1}
                    onMouseEnter={() => setHoveredExp(i)}
                    style={{ transition: "opacity 0.25s ease", cursor: "pointer" }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
