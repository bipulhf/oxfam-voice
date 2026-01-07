"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fetchApi } from "@/lib/api";
import { Effect } from "effect";
import Link from "next/link";
import { IconDownload, IconArrowLeft } from "@tabler/icons-react";

interface SessionWithAudio {
  id: string;
  sessionCode: string;
  audioFilename: string | null;
  status: string;
  createdAt: Date;
  completedAt: Date | null;
  respondent: {
    name: string | null;
    district: string | null;
    upazila: string | null;
  } | null;
}

export default function AudioFilesPage() {
  const [sessions, setSessions] = React.useState<SessionWithAudio[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [downloading, setDownloading] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage] = React.useState(10);

  React.useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const result = await Effect.runPromise(
          fetchApi<{ sessions: SessionWithAudio[]; total: number }>(
            "/api/sessions/audio"
          )
        );

        if (!("error" in result) && result.sessions) {
          setSessions(result.sessions);
        }
      } catch (error) {
        console.error("Error loading sessions:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredSessions = React.useMemo(() => {
    if (!searchTerm) return sessions;

    return sessions.filter(
      (s) =>
        s.sessionCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.respondent?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.respondent?.district?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sessions, searchTerm]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSessions = filteredSessions.slice(startIndex, endIndex);

  const handleDownload = async (sessionId: string, sessionCode: string) => {
    try {
      setDownloading(sessionId);
      const response = await fetch(`/api/session/${sessionId}/audio`);

      if (!response.ok) {
        throw new Error("Failed to download audio");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${sessionCode}.webm`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading audio:", error);
      alert("অডিও ডাউনলোড করতে সমস্যা হয়েছে");
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Card>
          <CardHeader>
            <CardTitle>ডেটা লোড হচ্ছে...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">অডিও ফাইল</h1>
          <p className="text-muted-foreground">
            সেশন থেকে অডিও ফাইল ডাউনলোড করুন
          </p>
        </div>
        <Link href="/admin">
          <Button variant="outline">
            <IconArrowLeft className="mr-2" />
            এডমিন ড্যাশবোর্ডে ফিরে যান
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>অডিও ফাইল তালিকা</CardTitle>
          <div className="mt-4">
            <Input
              placeholder="খুঁজুন (সেশন কোড, নাম, জেলা...)"
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
                  <th className="text-left p-2">সেশন কোড</th>
                  <th className="text-left p-2">নাম</th>
                  <th className="text-left p-2">জেলা</th>
                  <th className="text-left p-2">উপজেলা</th>
                  <th className="text-left p-2">তৈরি হয়েছে</th>
                  <th className="text-left p-2">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSessions.map((session) => (
                  <tr key={session.id} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-mono">{session.sessionCode}</td>
                    <td className="p-2">{session.respondent?.name || "-"}</td>
                    <td className="p-2">
                      {session.respondent?.district || "-"}
                    </td>
                    <td className="p-2">
                      {session.respondent?.upazila || "-"}
                    </td>
                    <td className="p-2">
                      {new Date(session.createdAt).toLocaleDateString("bn-BD", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="p-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleDownload(session.id, session.sessionCode)
                        }
                        disabled={downloading === session.id}
                      >
                        <IconDownload className="mr-1" />
                        {downloading === session.id
                          ? "ডাউনলোড হচ্ছে..."
                          : "ডাউনলোড"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredSessions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm
                  ? "কোন সেশন পাওয়া যায়নি"
                  : "কোন অডিও ফাইল পাওয়া যায়নি"}
              </div>
            )}
          </div>
          
          {filteredSessions.length > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {filteredSessions.length > 0
                  ? `পৃষ্ঠা ${currentPage} এর ${totalPages} (মোট ${filteredSessions.length} টি)`
                  : "কোন ডেটা নেই"}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  পূর্ববর্তী
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="min-w-[2.5rem]"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  পরবর্তী
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
