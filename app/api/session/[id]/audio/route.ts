import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  saveAudioChunk,
  saveCompleteAudio,
  getRecordingPath,
  recordingExists,
} from "@/lib/audio";
import { createTask } from "@/lib/task-queue";
import { readFile } from "fs/promises";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await prisma.session.findUnique({
      where: { id },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;
    const isComplete = formData.get("isComplete") === "true";

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Handle complete audio file upload (from phone call simulation)
    if (isComplete) {
      await saveCompleteAudio(session.sessionCode, buffer);

      // Update session with audio filename
      await prisma.session.update({
        where: { id },
        data: {
          audioFilename: `${session.sessionCode}.webm`,
        },
      });

      return NextResponse.json({
        success: true,
        audioFilename: `${session.sessionCode}.webm`,
      });
    }

    // Handle chunk-based upload (legacy support)
    const chunkIndex = parseInt(formData.get("chunkIndex") as string);
    const isLastChunk = formData.get("isLastChunk") === "true";

    await saveAudioChunk(session.sessionCode, chunkIndex, buffer);

    if (isLastChunk) {
      const totalChunks = chunkIndex + 1;
      await createTask("MERGE_AUDIO", {
        sessionCode: session.sessionCode,
        chunkCount: totalChunks,
      });
    }

    return NextResponse.json({ success: true, chunkIndex });
  } catch (error) {
    console.error("Error saving audio:", error);
    return NextResponse.json(
      { error: "Failed to save audio" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await prisma.session.findUnique({
      where: { id },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (!session.audioFilename) {
      return NextResponse.json(
        { error: "No audio file found for this session" },
        { status: 404 }
      );
    }

    const sessionCode = session.sessionCode;
    const audioPath = getRecordingPath(sessionCode);

    if (!recordingExists(sessionCode)) {
      return NextResponse.json(
        { error: "Audio file not found on disk" },
        { status: 404 }
      );
    }

    const audioBuffer = await readFile(audioPath);

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/webm",
        "Content-Disposition": `attachment; filename="${sessionCode}.webm"`,
        "Content-Length": audioBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error fetching audio:", error);
    return NextResponse.json(
      { error: "Failed to fetch audio" },
      { status: 500 }
    );
  }
}
