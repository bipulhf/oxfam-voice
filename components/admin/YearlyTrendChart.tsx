"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { fetchApi } from "@/lib/api";
import { Effect } from "effect";
import type { StatsResponse } from "@/types";

export function YearlyTrendChart() {
  const [data, setData] = React.useState<{ year: number; count: number }[]>([]);

  React.useEffect(() => {
    const loadData = async () => {
      try {
        const result = await Effect.runPromise(
          fetchApi<StatsResponse>("/api/stats")
        );
        
        if (!("error" in result) && result.yearlyTrends) {
          setData(result.yearlyTrends);
        }
      } catch (error) {
        console.error("Error loading yearly trend data:", error);
      }
    };

    loadData();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>বার্ষিক প্রবণতা</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="count"
              stroke="oklch(0.35 0.12 250)"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
