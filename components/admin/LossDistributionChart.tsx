"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { fetchApi } from "@/lib/api";
import { Effect } from "effect";
import type { StatsResponse } from "@/types";

export function LossDistributionChart() {
  const [data, setData] = React.useState<{ range: string; count: number }[]>(
    []
  );

  React.useEffect(() => {
    const loadData = async () => {
      try {
        const result = await Effect.runPromise(
          fetchApi<StatsResponse>("/api/stats")
        );

        if (!("error" in result) && result.lossDistribution) {
          setData(result.lossDistribution);
        }
      } catch (error) {
        console.error("Error loading loss distribution data:", error);
      }
    };

    loadData();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>ক্ষতির পরিমাণ অনুযায়ী বন্টন</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="range" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="oklch(0.65 0.18 55)" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
