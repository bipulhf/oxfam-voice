"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetchApi } from "@/lib/api";
import { Effect } from "effect";

interface Respondent {
  id: string;
  name: string | null;
  district: string | null;
  upazila: string | null;
  union: string | null;
  village: string | null;
  profession: string | null;
  incidentType: string | null;
  incidentYear: number | null;
  incidentMonth: string | null;
  lossAmount: number | null;
  fatherName: string | null;
  motherName: string | null;
  additionalInfo: string | null;
  createdAt: Date;
  session: {
    sessionCode: string;
    createdAt: Date;
    completedAt: Date | null;
    audioFilename: string | null;
  };
}

export function DataTable() {
  const [respondents, setRespondents] = React.useState<Respondent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [sortBy, setSortBy] = React.useState<keyof Respondent>("createdAt");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");

  React.useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const result = await Effect.runPromise(
          fetchApi<{ respondents: Respondent[]; total: number }>("/api/respondents")
        );
        
        if (!("error" in result) && result.respondents) {
          setRespondents(result.respondents);
        }
      } catch (error) {
        console.error("Error loading respondents:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredData = React.useMemo(() => {
    let filtered = [...respondents];

    if (searchTerm) {
      filtered = filtered.filter(
        (r) =>
          r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.district?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.session?.sessionCode?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    filtered.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortOrder === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      }
      
      if (aVal instanceof Date && bVal instanceof Date) {
        return sortOrder === "asc"
          ? aVal.getTime() - bVal.getTime()
          : bVal.getTime() - aVal.getTime();
      }
      
      return 0;
    });

    return filtered;
  }, [respondents, searchTerm, sortBy, sortOrder]);

  const handleSort = (column: keyof Respondent) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ডেটা লোড হচ্ছে...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>সমস্ত প্রতিক্রিয়া</CardTitle>
        <div className="mt-4">
          <Input
            placeholder="খুঁজুন (নাম, জেলা, সেশন কোড...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th
                  className="text-left p-2 cursor-pointer hover:bg-muted"
                  onClick={() => handleSort("name")}
                >
                  নাম {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="text-left p-2 cursor-pointer hover:bg-muted"
                  onClick={() => handleSort("district")}
                >
                  জেলা {sortBy === "district" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th className="text-left p-2">উপজেলা</th>
                <th className="text-left p-2">ইউনিয়ন</th>
                <th className="text-left p-2">গ্রাম</th>
                <th className="text-left p-2">ক্ষতির ধরন</th>
                <th
                  className="text-left p-2 cursor-pointer hover:bg-muted"
                  onClick={() => handleSort("incidentYear")}
                >
                  বছর {sortBy === "incidentYear" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="text-left p-2 cursor-pointer hover:bg-muted"
                  onClick={() => handleSort("lossAmount")}
                >
                  ক্ষতির পরিমাণ {sortBy === "lossAmount" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="text-left p-2 cursor-pointer hover:bg-muted"
                  onClick={() => handleSort("createdAt")}
                >
                  তারিখ {sortBy === "createdAt" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((r) => (
                <tr key={r.id} className="border-b hover:bg-muted/50">
                  <td className="p-2">{r.name || "-"}</td>
                  <td className="p-2">{r.district || "-"}</td>
                  <td className="p-2">{r.upazila || "-"}</td>
                  <td className="p-2">{r.union || "-"}</td>
                  <td className="p-2">{r.village || "-"}</td>
                  <td className="p-2">{r.incidentType || "-"}</td>
                  <td className="p-2">{r.incidentYear || "-"}</td>
                  <td className="p-2">
                    {r.lossAmount
                      ? `${r.lossAmount.toLocaleString("bn-BD")} টাকা`
                      : "-"}
                  </td>
                  <td className="p-2">
                    {new Date(r.createdAt).toLocaleDateString("bn-BD")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredData.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              কোন ডেটা পাওয়া যায়নি
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
