"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { fetchApi } from "@/lib/api";
import { Effect } from "effect";
import type { StatsResponse } from "@/types";
import type { PieLabelRenderProps } from "recharts";

interface PieLabelProps extends PieLabelRenderProps {
  type: string;
  percent?: number;
}

const COLORS = [
  "oklch(0.35 0.12 250)",
  "oklch(0.65 0.18 55)",
  "oklch(0.50 0.15 200)",
  "oklch(0.45 0.14 300)",
  "oklch(0.40 0.13 100)",
];

export function IncidentTypeChart() {
  const [data, setData] = React.useState<{ type: string; count: number }[]>([]);

  React.useEffect(() => {
    const loadData = async () => {
      try {
        const result = await Effect.runPromise(
          fetchApi<StatsResponse>("/api/stats")
        );

        if (!("error" in result) && result.incidentTypeDistribution) {
          setData(result.incidentTypeDistribution);
        }
      } catch (error) {
        console.error("Error loading incident type data:", error);
      }
    };

    loadData();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>ক্ষতির ধরন অনুযায়ী বন্টন</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => {
                const props = entry as PieLabelProps;
                const percent = props.percent ?? 0;
                return `${props.type}: ${(percent * 100).toFixed(0)}%`;
              }}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
