import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
import { saveCompleteAudio } from "@/lib/audio";
import { extractDataFromAudio } from "@/lib/gemini";
import type { RespondentData } from "@/types";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "audio/webm",
      "audio/mp3",
      "audio/wav",
      "audio/ogg",
      "audio/m4a",
      "audio/mpeg",
      "audio/x-m4a",
      "audio/aac",
      "audio/aacp",
      "audio/mp4",
      "audio/x-aac",
    ];
    const fileType = audioFile.type;
    if (!allowedTypes.includes(fileType) && !audioFile.name.match(/\.(webm|mp3|wav|ogg|m4a|aac)$/i)) {
      return NextResponse.json(
        { error: "Invalid audio file type. Supported formats: webm, mp3, wav, ogg, m4a, aac" },
        { status: 400 }
      );
    }

    // Create session
    const sessionCode = uuidv4().substring(0, 8).toUpperCase();
    const session = await prisma.session.create({
      data: {
        sessionCode,
        status: "IN_PROGRESS",
      },
    });

    // Convert audio file to buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    // Save audio file (always saved as .webm for consistency)
    await saveCompleteAudio(sessionCode, audioBuffer);

    // Update session with audio filename
    await prisma.session.update({
      where: { id: session.id },
      data: {
        audioFilename: `${sessionCode}.webm`,
      },
    });

    // Extract data from audio using Gemini
    const extractedData = await extractDataFromAudio(audioBuffer, fileType);

    // Save extracted data to database
    if (extractedData && Object.keys(extractedData).length > 0) {
      await prisma.respondent.create({
        data: {
          sessionId: session.id,
          ...extractedData,
        },
      });
    }

    // Update session status to completed
    const updatedSession = await prisma.session.update({
      where: { id: session.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
      include: {
        respondent: true,
      },
    });

    return NextResponse.json({
      id: updatedSession.id,
      sessionCode: updatedSession.sessionCode,
      status: updatedSession.status,
      audioFilename: updatedSession.audioFilename,
      createdAt: updatedSession.createdAt,
      completedAt: updatedSession.completedAt,
      respondent: updatedSession.respondent
        ? {
            name: updatedSession.respondent.name || undefined,
            fatherName: updatedSession.respondent.fatherName || undefined,
            motherName: updatedSession.respondent.motherName || undefined,
            district: updatedSession.respondent.district || undefined,
            upazila: updatedSession.respondent.upazila || undefined,
            union: updatedSession.respondent.union || undefined,
            village: updatedSession.respondent.village || undefined,
            profession: updatedSession.respondent.profession || undefined,
            incidentType: updatedSession.respondent.incidentType || undefined,
            incidentYear: updatedSession.respondent.incidentYear || undefined,
            incidentMonth: updatedSession.respondent.incidentMonth || undefined,
            lossAmount: updatedSession.respondent.lossAmount || undefined,
            additionalInfo: updatedSession.respondent.additionalInfo || undefined,
          }
        : undefined,
    });
  } catch (error) {
    console.error("Error processing audio upload:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to process audio";
    return NextResponse.json(
      { error: "Failed to process audio", message: errorMessage },
      { status: 500 }
    );
  }
}
