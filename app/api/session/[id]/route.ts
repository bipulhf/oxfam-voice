import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { matchLocation } from "@/lib/name-matcher";
import type { RespondentData } from "@/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await prisma.session.findUnique({
      where: { id },
      include: { respondent: true },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: session.id,
      sessionCode: session.sessionCode,
      status: session.status,
      audioFilename: session.audioFilename,
      createdAt: session.createdAt,
      completedAt: session.completedAt,
      respondent: session.respondent || undefined,
    });
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json(
      { error: "Failed to fetch session" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = (await request.json()) as {
      status?: "IN_PROGRESS" | "COMPLETED" | "FAILED";
      respondent?: RespondentData;
    };

    const session = await prisma.session.findUnique({
      where: { id },
      include: { respondent: true },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const updateData: {
      status?: "IN_PROGRESS" | "COMPLETED" | "FAILED";
      completedAt?: Date;
    } = {};

    if (data.status) {
      updateData.status = data.status;
      if (data.status === "COMPLETED") {
        updateData.completedAt = new Date();
      }
    }

    const updatedSession = await prisma.session.update({
      where: { id },
      data: updateData,
    });

    if (data.respondent) {
      // Apply location matching for district, upazila, and union
      const respondentData = { ...data.respondent };
      if (
        respondentData.district ||
        respondentData.upazila ||
        respondentData.union
      ) {
        const matchedLocation = matchLocation(
          respondentData.district,
          respondentData.upazila,
          respondentData.union
        );
        if (matchedLocation.district) {
          respondentData.district = matchedLocation.district;
        }
        if (matchedLocation.upazila) {
          respondentData.upazila = matchedLocation.upazila;
        }
        if (matchedLocation.union) {
          respondentData.union = matchedLocation.union;
        }
      }

      if (session.respondent) {
        await prisma.respondent.update({
          where: { sessionId: id },
          data: respondentData,
        });
      } else {
        await prisma.respondent.create({
          data: {
            sessionId: id,
            ...respondentData,
          },
        });
      }
    }

    const finalSession = await prisma.session.findUnique({
      where: { id },
      include: { respondent: true },
    });

    return NextResponse.json({
      id: finalSession!.id,
      sessionCode: finalSession!.sessionCode,
      status: finalSession!.status,
      audioFilename: finalSession!.audioFilename,
      createdAt: finalSession!.createdAt,
      completedAt: finalSession!.completedAt,
      respondent: finalSession!.respondent || undefined,
    });
  } catch (error) {
    console.error("Error updating session:", error);
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    );
  }
}
