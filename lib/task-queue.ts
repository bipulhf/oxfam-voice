import { prisma } from "./prisma";
import { mergeAudioChunks, cleanupTempChunks } from "./audio";
import type { TaskType, TaskStatus } from "../generated/prisma/client";

export async function createTask(
  type: TaskType,
  payload: Record<string, unknown>
) {
  return prisma.taskQueue.create({
    data: {
      type,
      payload: payload as object,
      status: "PENDING",
      attempts: 0,
      maxAttempts: 3,
    },
  });
}

export async function processPendingTasks() {
  const tasks = await prisma.taskQueue.findMany({
    where: {
      status: "PENDING",
      attempts: {
        lt: 3, // maxAttempts default value
      },
    },
    take: 10,
  });

  for (const task of tasks) {
    await processTask(task.id);
  }

  return tasks.length;
}

async function processTask(taskId: string) {
  const task = await prisma.taskQueue.findUnique({
    where: { id: taskId },
  });

  if (!task || task.status !== "PENDING") {
    return;
  }

  await prisma.taskQueue.update({
    where: { id: taskId },
    data: { status: "PROCESSING", attempts: { increment: 1 } },
  });

  try {
    if (task.type === "MERGE_AUDIO") {
      const { sessionCode, chunkCount } = task.payload as {
        sessionCode: string;
        chunkCount: number;
      };
      await mergeAudioChunks(sessionCode, chunkCount);
      await cleanupTempChunks(sessionCode, chunkCount);
      
      await prisma.session.update({
        where: { sessionCode },
        data: {
          audioFilename: `${sessionCode}.webm`,
        },
      });
    }

    await prisma.taskQueue.update({
      where: { id: taskId },
      data: {
        status: "COMPLETED",
        processedAt: new Date(),
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    
    await prisma.taskQueue.update({
      where: { id: taskId },
      data: {
        status: task.attempts >= task.maxAttempts ? "FAILED" : "PENDING",
        error: errorMessage,
      },
    });
  }
}
