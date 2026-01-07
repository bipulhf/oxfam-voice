"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface SessionStatusProps {
  sessionCode: string;
  status: "IN_PROGRESS" | "COMPLETED" | "FAILED";
  isRecording: boolean;
}

export function SessionStatus({
  sessionCode,
  status,
  isRecording,
}: SessionStatusProps) {
  const statusLabels = {
    IN_PROGRESS: "চলমান",
    COMPLETED: "সম্পন্ন",
    FAILED: "ব্যর্থ",
  };

  const statusColors = {
    IN_PROGRESS: "bg-blue-500",
    COMPLETED: "bg-green-500",
    FAILED: "bg-red-500",
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">সেশন কোড</p>
            <p className="text-lg font-semibold">{sessionCode}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge
              variant="outline"
              className={statusColors[status]}
            >
              {statusLabels[status]}
            </Badge>
            {isRecording && (
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs text-muted-foreground">রেকর্ডিং</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
