import { NextResponse } from "next/server";
import { processPendingTasks } from "@/lib/task-queue";

export async function POST() {
  try {
    const processedCount = await processPendingTasks();
    return NextResponse.json({
      success: true,
      processedCount,
    });
  } catch (error) {
    console.error("Error processing tasks:", error);
    return NextResponse.json(
      { error: "Failed to process tasks" },
      { status: 500 }
    );
  }
}
