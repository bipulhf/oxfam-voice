import { writeFile, mkdir, readdir, readFile, unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const RECORDINGS_DIR = join(process.cwd(), "data", "recordings");
const TEMP_DIR = join(process.cwd(), "data", "temp");

export async function ensureDirectories() {
  if (!existsSync(RECORDINGS_DIR)) {
    await mkdir(RECORDINGS_DIR, { recursive: true });
  }
  if (!existsSync(TEMP_DIR)) {
    await mkdir(TEMP_DIR, { recursive: true });
  }
}

export async function saveAudioChunk(
  sessionCode: string,
  chunkIndex: number,
  audioData: Buffer
): Promise<string> {
  await ensureDirectories();
  const chunkPath = join(TEMP_DIR, `${sessionCode}_${chunkIndex}.webm`);
  await writeFile(chunkPath, audioData);
  return chunkPath;
}

export async function saveCompleteAudio(
  sessionCode: string,
  audioData: Buffer
): Promise<string> {
  await ensureDirectories();
  const outputPath = join(RECORDINGS_DIR, `${sessionCode}.webm`);
  await writeFile(outputPath, audioData);
  return outputPath;
}

export async function mergeAudioChunks(
  sessionCode: string,
  chunkCount: number
): Promise<string> {
  await ensureDirectories();
  
  const chunks: Buffer[] = [];
  for (let i = 0; i < chunkCount; i++) {
    const chunkPath = join(TEMP_DIR, `${sessionCode}_${i}.webm`);
    if (existsSync(chunkPath)) {
      const chunk = await readFile(chunkPath);
      chunks.push(chunk);
    }
  }

  if (chunks.length === 0) {
    throw new Error(`No audio chunks found for session ${sessionCode}`);
  }

  const mergedAudio = Buffer.concat(chunks);
  const outputPath = join(RECORDINGS_DIR, `${sessionCode}.webm`);
  await writeFile(outputPath, mergedAudio);

  return outputPath;
}

export async function cleanupTempChunks(sessionCode: string, chunkCount: number) {
  const tempDir = TEMP_DIR;
  const files = await readdir(tempDir);
  
  for (const file of files) {
    if (file.startsWith(`${sessionCode}_`) && file.endsWith(".webm")) {
      const filePath = join(tempDir, file);
      if (existsSync(filePath)) {
        await unlink(filePath);
      }
    }
  }
}

export function getRecordingPath(sessionCode: string): string {
  return join(RECORDINGS_DIR, `${sessionCode}.webm`);
}

export function recordingExists(sessionCode: string): boolean {
  return existsSync(getRecordingPath(sessionCode));
}
