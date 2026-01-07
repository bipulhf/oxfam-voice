import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";

export async function POST() {
  try {
    const sessionCode = uuidv4().substring(0, 8).toUpperCase();
    
    const session = await prisma.session.create({
      data: {
        sessionCode,
        status: "IN_PROGRESS",
      },
    });

    return NextResponse.json({
      id: session.id,
      sessionCode: session.sessionCode,
      status: session.status,
      createdAt: session.createdAt,
    });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
