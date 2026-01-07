import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const district = searchParams.get("district");
    const year = searchParams.get("year");
    const skip = parseInt(searchParams.get("skip") || "0");
    const take = parseInt(searchParams.get("take") || "50");

    const where: {
      district?: string;
      incidentYear?: number;
    } = {};

    if (district) {
      where.district = district;
    }
    if (year) {
      where.incidentYear = parseInt(year);
    }

    const [respondents, total] = await Promise.all([
      prisma.respondent.findMany({
        where,
        include: {
          session: {
            select: {
              sessionCode: true,
              createdAt: true,
              completedAt: true,
              audioFilename: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.respondent.count({ where }),
    ]);

    return NextResponse.json({
      respondents,
      total,
      skip,
      take,
    });
  } catch (error) {
    console.error("Error fetching respondents:", error);
    return NextResponse.json(
      { error: "Failed to fetch respondents" },
      { status: 500 }
    );
  }
}
