import { NextResponse } from "next/server";

const GOOGLE_CLOUD_API_KEY = process.env.GOOGLE_CLOUD_API_KEY;
const TTS_API_URL = "https://texttospeech.googleapis.com/v1/text:synthesize";

export async function POST(request: Request) {
  try {
    // Check if API key is configured
    if (!GOOGLE_CLOUD_API_KEY) {
      console.error("GOOGLE_CLOUD_API_KEY is not set in environment variables");
      return NextResponse.json(
        {
          error: "TTS service not configured",
          message:
            "GOOGLE_CLOUD_API_KEY environment variable is not set. Please add it to your .env.local file.",
        },
        { status: 500 }
      );
    }

    const { text } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text is required", message: "No text provided for TTS" },
        { status: 400 }
      );
    }

    console.log("TTS Request - Text length:", text.length);

    // Call Google Cloud Text-to-Speech API
    const response = await fetch(`${TTS_API_URL}?key=${GOOGLE_CLOUD_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: {
          text: text,
        },
        voice: {
          languageCode: "bn-IN",
          name: "bn-IN-Chirp3-HD-Leda",
        },
        audioConfig: {
          audioEncoding: "MP3",
          speakingRate: 1,
          pitch: 0,
          volumeGainDb: 0,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { rawError: errorText };
      }

      console.error("Google TTS API error - Status:", response.status);
      console.error(
        "Google TTS API error - Details:",
        JSON.stringify(errorData, null, 2)
      );

      // Extract meaningful error message
      const errorMessage =
        errorData?.error?.message ||
        errorData?.error?.status ||
        errorData?.rawError ||
        `API returned status ${response.status}`;

      return NextResponse.json(
        {
          error: "Failed to synthesize speech",
          message: errorMessage,
          details: errorData,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.audioContent) {
      return NextResponse.json(
        { error: "No audio content received" },
        { status: 500 }
      );
    }

    // Return the base64 encoded audio
    return NextResponse.json({
      audioContent: data.audioContent,
      contentType: "audio/mp3",
    });
  } catch (error) {
    console.error("Error in TTS API:", error);
    return NextResponse.json(
      {
        error: "Failed to process TTS request",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
