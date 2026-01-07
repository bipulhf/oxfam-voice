import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [
      totalResponses,
      totalLossAmount,
      pendingSessions,
      districtData,
      incidentTypeData,
      yearlyData,
      lossData,
    ] = await Promise.all([
      prisma.respondent.count(),
      prisma.respondent.aggregate({
        _sum: { lossAmount: true },
        _avg: { lossAmount: true },
      }),
      prisma.session.count({
        where: { status: "IN_PROGRESS" },
      }),
      prisma.respondent.groupBy({
        by: ["district"],
        where: { district: { not: null } },
        _count: true,
      }),
      prisma.respondent.groupBy({
        by: ["incidentType"],
        where: { incidentType: { not: null } },
        _count: true,
      }),
      prisma.respondent.groupBy({
        by: ["incidentYear"],
        where: { incidentYear: { not: null } },
        _count: true,
      }),
      prisma.respondent.findMany({
        where: { lossAmount: { not: null } },
        select: { lossAmount: true },
      }),
    ]);

    const lossRanges = [
      { min: 0, max: 50000, label: "০-৫০,০০০" },
      { min: 50000, max: 100000, label: "৫০,০০০-১,০০,০০০" },
      { min: 100000, max: 200000, label: "১,০০,০০০-২,০০,০০০" },
      { min: 200000, max: 500000, label: "২,০০,০০০-৫,০০,০০০" },
      { min: 500000, max: Infinity, label: "৫,০০,০০০+" },
    ];

    const lossDistribution = lossRanges.map((range) => ({
      range: range.label,
      count: lossData.filter(
        (r) =>
          r.lossAmount &&
          r.lossAmount >= range.min &&
          r.lossAmount < range.max
      ).length,
    }));

    return NextResponse.json({
      totalResponses,
      totalLossAmount: totalLossAmount._sum.lossAmount || 0,
      averageLossAmount: totalLossAmount._avg.lossAmount || 0,
      pendingSessions,
      districtDistribution: districtData.map((d) => ({
        district: d.district || "অজানা",
        count: d._count,
      })),
      incidentTypeDistribution: incidentTypeData.map((d) => ({
        type: d.incidentType || "অজানা",
        count: d._count,
      })),
      yearlyTrends: yearlyData
        .map((d) => ({
          year: d.incidentYear!,
          count: d._count,
        }))
        .sort((a, b) => a.year - b.year),
      lossDistribution,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
