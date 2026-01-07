"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchApi } from "@/lib/api";
import { Effect } from "effect";
import type { StatsResponse } from "@/types";

export function StatsCards() {
  const [stats, setStats] = React.useState<StatsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const result = await Effect.runPromise(
          fetchApi<StatsResponse>("/api/stats")
        );
        
        if (!("error" in result)) {
          setStats(result);
        }
      } catch (error) {
        console.error("Error loading stats:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle className="animate-pulse bg-muted h-6 w-24 rounded" />
            </CardHeader>
            <CardContent>
              <div className="animate-pulse bg-muted h-8 w-16 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>মোট প্রতিক্রিয়া</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.totalResponses}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>মোট ক্ষতি</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {stats.totalLossAmount.toLocaleString("bn-BD")} টাকা
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>গড় ক্ষতি</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {Math.round(stats.averageLossAmount).toLocaleString("bn-BD")} টাকা
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>চলমান সেশন</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.pendingSessions}</div>
        </CardContent>
      </Card>
    </div>
  );
}
