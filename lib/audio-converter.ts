import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import { writeFile, readFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import type { FfmpegCommand } from "fluent-ffmpeg";

// Set FFmpeg path from ffmpeg-static
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

/**
 * Convert audio buffer to MP3 format
 * @param audioBuffer - Input audio buffer in any format
 * @param inputFormat - Original MIME type or file extension (e.g., "audio/aac", "audio/webm", ".m4a")
 * @returns Converted MP3 buffer
 */
export async function convertToMP3(
  audioBuffer: Buffer,
  inputFormat?: string
): Promise<Buffer> {
  // Check if already MP3
  if (
    inputFormat &&
    (inputFormat.includes("mp3") || inputFormat.includes("mpeg"))
  ) {
    console.log("[Audio Converter] Audio is already MP3, skipping conversion");
    return audioBuffer;
  }

  // Determine input file extension from MIME type
  let inputExt = "webm"; // default
  if (inputFormat) {
    if (inputFormat.includes("aac") || inputFormat.includes("m4a")) {
      inputExt = "m4a";
    } else if (inputFormat.includes("wav")) {
      inputExt = "wav";
    } else if (inputFormat.includes("ogg")) {
      inputExt = "ogg";
    } else if (inputFormat.includes("webm")) {
      inputExt = "webm";
    } else if (inputFormat.startsWith(".")) {
      inputExt = inputFormat.substring(1);
    }
  }

  const tempDir = tmpdir();
  const inputFileName = join(
    tempDir,
    `audio-input-${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}.${inputExt}`
  );
  const outputFileName = join(
    tempDir,
    `audio-output-${Date.now()}-${Math.random().toString(36).substring(7)}.mp3`
  );

  try {
    // Write input buffer to temporary file
    await writeFile(inputFileName, audioBuffer);
    console.log(`[Audio Converter] Written input file: ${inputFileName}`);

    // Convert to MP3 using fluent-ffmpeg
    await new Promise<void>((resolve, reject) => {
      const command: FfmpegCommand = ffmpeg(inputFileName)
        .audioCodec("libmp3lame")
        .audioFrequency(44100)
        .audioChannels(2)
        .audioBitrate(192)
        .output(outputFileName)
        .on("start", (commandLine: string) => {
          console.log(`[Audio Converter] FFmpeg command: ${commandLine}`);
        })
        .on("progress", (progress: { percent?: number }) => {
          if (progress.percent) {
            console.log(
              `[Audio Converter] Processing: ${Math.round(
                progress.percent
              )}% done`
            );
          }
        })
        .on("end", () => {
          console.log("[Audio Converter] Conversion finished");
          resolve();
        })
        .on("error", (err: Error) => {
          console.error("[Audio Converter] FFmpeg error:", err);
          reject(err);
        });

      command.run();
    });

    // Read output file
    const outputBuffer = await readFile(outputFileName);
    console.log(
      `[Audio Converter] Conversion complete: ${audioBuffer.length} bytes -> ${outputBuffer.length} bytes`
    );

    // Clean up temporary files
    try {
      await unlink(inputFileName);
      await unlink(outputFileName);
    } catch (cleanupError) {
      console.warn(
        "[Audio Converter] Failed to cleanup temp files:",
        cleanupError
      );
    }

    return outputBuffer;
  } catch (error) {
    console.error("[Audio Converter] Conversion error:", error);

    // Clean up temporary files on error
    try {
      await unlink(inputFileName).catch(() => {});
      await unlink(outputFileName).catch(() => {});
    } catch {
      // Ignore cleanup errors
    }

    // If conversion fails, return original buffer as fallback
    console.warn("[Audio Converter] Returning original audio as fallback");
    return audioBuffer;
  }
}

/**
 * Check if audio format needs conversion
 */
export function needsConversion(mimeType: string): boolean {
  if (!mimeType) return true;
  const normalized = mimeType.toLowerCase();
  // Already MP3, no conversion needed
  return !normalized.includes("mp3") && !normalized.includes("mpeg");
}
