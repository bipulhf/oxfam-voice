"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TranscriptionPanelProps {
  transcript: string;
  extractedData?: {
    name?: string;
    district?: string;
    upazila?: string;
    union?: string;
    village?: string;
    profession?: string;
    incidentType?: string;
    incidentYear?: number;
    incidentMonth?: string;
    lossAmount?: number;
    fatherName?: string;
    motherName?: string;
    additionalInfo?: string;
  };
}

export function TranscriptionPanel({
  transcript,
  extractedData,
}: TranscriptionPanelProps) {
  const transcriptRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  return (
    <div className="flex flex-col gap-4 h-full">
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <CardTitle>ট্রান্সক্রিপশন</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <div
            ref={transcriptRef}
            className="h-full overflow-y-auto text-sm leading-relaxed whitespace-pre-wrap"
          >
            {transcript || "কোনো কথোপকথন এখনও শুরু হয়নি..."}
          </div>
        </CardContent>
      </Card>

      {extractedData && (
        <Card>
          <CardHeader>
            <CardTitle>সংগৃহীত তথ্য</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {extractedData.name && (
                <div>
                  <span className="text-muted-foreground">নাম:</span>{" "}
                  {extractedData.name}
                </div>
              )}
              {extractedData.district && (
                <div>
                  <span className="text-muted-foreground">জেলা:</span>{" "}
                  {extractedData.district}
                </div>
              )}
              {extractedData.upazila && (
                <div>
                  <span className="text-muted-foreground">উপজেলা/থানা:</span>{" "}
                  {extractedData.upazila}
                </div>
              )}
              {extractedData.union && (
                <div>
                  <span className="text-muted-foreground">ইউনিয়ন:</span>{" "}
                  {extractedData.union}
                </div>
              )}
              {extractedData.village && (
                <div>
                  <span className="text-muted-foreground">গ্রাম:</span>{" "}
                  {extractedData.village}
                </div>
              )}
              {extractedData.profession && (
                <div>
                  <span className="text-muted-foreground">পেশা:</span>{" "}
                  {extractedData.profession}
                </div>
              )}
              {extractedData.incidentType && (
                <div>
                  <span className="text-muted-foreground">ক্ষতির ধরন:</span>{" "}
                  {extractedData.incidentType}
                </div>
              )}
              {extractedData.incidentYear && (
                <div>
                  <span className="text-muted-foreground">বছর:</span>{" "}
                  {extractedData.incidentYear}
                </div>
              )}
              {extractedData.incidentMonth && (
                <div>
                  <span className="text-muted-foreground">মাস:</span>{" "}
                  {extractedData.incidentMonth}
                </div>
              )}
              {extractedData.lossAmount && (
                <div>
                  <span className="text-muted-foreground">ক্ষতির পরিমাণ:</span>{" "}
                  {extractedData.lossAmount.toLocaleString("bn-BD")} টাকা
                </div>
              )}
              {extractedData.fatherName && (
                <div>
                  <span className="text-muted-foreground">পিতার নাম:</span>{" "}
                  {extractedData.fatherName}
                </div>
              )}
              {extractedData.motherName && (
                <div>
                  <span className="text-muted-foreground">মাতার নাম:</span>{" "}
                  {extractedData.motherName}
                </div>
              )}
              {extractedData.additionalInfo && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">অতিরিক্ত তথ্য:</span>{" "}
                  {extractedData.additionalInfo}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
