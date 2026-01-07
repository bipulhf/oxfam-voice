import { StatsCards } from "@/components/admin/StatsCards";
import { DistrictChart } from "@/components/admin/DistrictChart";
import { IncidentTypeChart } from "@/components/admin/IncidentTypeChart";
import { YearlyTrendChart } from "@/components/admin/YearlyTrendChart";
import { LossDistributionChart } from "@/components/admin/LossDistributionChart";
import { DataTable } from "@/components/admin/DataTable";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { IconHome, IconMusic } from "@tabler/icons-react";

// ... imports ...
export default function AdminPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden selection:bg-primary/30 font-sans">
      {/* Ambient Background Effects */}
      <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px] animate-pulse pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-secondary/5 blur-[100px] animate-pulse delay-1000 pointer-events-none" />

      <div className="container mx-auto p-6 max-w-7xl relative z-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] animate-[gradient_5s_linear_infinite]">
              এডমিন ড্যাশবোর্ড
            </h1>
            <p className="text-slate-400 mt-2 text-sm tracking-wide">
              ক্ষতিগ্রস্ত তথ্যের বিশ্লেষণ ও পরিসংখ্যান
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/audio">
              <Button variant="outline">
                <IconMusic />
                অডিও ফাইল
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline">
                <IconHome /> হোমে ফিরে যান
              </Button>
            </Link>
          </div>
        </div>

        <div className="space-y-8 animate-in slide-in-from-bottom-5 fade-in duration-700">
          <div className="backdrop-blur-xl bg-card/30 border border-white/5 rounded-2xl p-1 shadow-2xl">
            <StatsCards />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="backdrop-blur-xl bg-card/30 border border-white/5 rounded-2xl overflow-hidden shadow-lg transition-transform hover:scale-[1.01] duration-300">
              <DistrictChart />
            </div>
            <div className="backdrop-blur-xl bg-card/30 border border-white/5 rounded-2xl overflow-hidden shadow-lg transition-transform hover:scale-[1.01] duration-300">
              <IncidentTypeChart />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="backdrop-blur-xl bg-card/30 border border-white/5 rounded-2xl overflow-hidden shadow-lg transition-transform hover:scale-[1.01] duration-300">
              <YearlyTrendChart />
            </div>
            <div className="backdrop-blur-xl bg-card/30 border border-white/5 rounded-2xl overflow-hidden shadow-lg transition-transform hover:scale-[1.01] duration-300">
              <LossDistributionChart />
            </div>
          </div>

          <div className="backdrop-blur-xl bg-card/30 border border-white/5 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-1">
              <DataTable />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
