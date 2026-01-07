import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const skip = parseInt(searchParams.get("skip") || "0");
    const take = parseInt(searchParams.get("take") || "50");

    const [sessions, total] = await Promise.all([
      prisma.session.findMany({
        where: {
          audioFilename: {
            not: null,
          },
        },
        include: {
          respondent: {
            select: {
              name: true,
              district: true,
              upazila: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.session.count({
        where: {
          audioFilename: {
            not: null,
          },
        },
      }),
    ]);

    return NextResponse.json({
      sessions,
      total,
      skip,
      take,
    });
  } catch (error) {
    console.error("Error fetching sessions with audio:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}
