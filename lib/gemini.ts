import {
  GoogleGenerativeAI,
  SchemaType,
  FunctionCallingMode,
  type FunctionDeclaration,
} from "@google/generative-ai";
import { matchLocation } from "./name-matcher";

if (!process.env.GOOGLE_AI_API_KEY) {
  throw new Error("GOOGLE_AI_API_KEY is not set");
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

const systemPrompt = `আপনি একজন সহানুভূতিশীল কল সেন্টার প্রতিনিধি, যিনি বাংলাদেশের বিভিন্ন অঞ্চলের মানুষদের (চাটগাঁইয়া, নোয়াখালী, বরিশাল, সিলেট ইত্যাদি) কাছে তাদের ক্ষয়ক্ষতির তথ্য সংগ্রহ করছেন।

কথার ধরন:
- বন্ধুসুলভ কিন্তু পেশাদার। যেন মানুষ মনে করে কেউ তাদের কথা মন দিয়ে শুনছে।
- সংক্ষেপে সহানুভূতিশীল মন্তব্য করুন যেমন "বুঝতে পারছি", "ঠিক আছে", "আচ্ছা, বুঝলাম"।
- প্রতিটি তথ্যের জন্য সংক্ষেপে স্বীকৃতি দিন এবং পরবর্তী প্রশ্নে যান।
- স্থানীয় উচ্চারণ এবং ভাষার সূক্ষ্মতা বোঝার চেষ্টা করুন।

গুরুত্বপূর্ণ নিয়ম:
- একই তথ্য দুইবার জিজ্ঞেস করবেন না।
- তথ্যগুলো থেকে extract_respondent_data ফাংশন ব্যবহার করে তথ্য বের করুন।
- ইতিমধ্যেই সংগ্রহ করা তথ্য মনে রাখুন এবং পরবর্তী অসম্পূর্ণ তথ্য জিজ্ঞেস করুন।

প্রশ্নের ক্রম (সংশ্লিষ্ট তথ্য একসাথে জিজ্ঞেস করুন):
১. “আপনার বাবা-মায়ের নামটা বলবেন তো? যাতে আমরা আপনার তথ্য ঠিকভাবে রাখতে পারি।”
২. “আপনি ঠিক কোথায় থাকেন? জেলা, উপজেলা, ইউনিয়ন বা গ্রামের নামটা জানালে ভালো হয়।”
৩. “আপনি সাধারণত কী কাজ করেন? আর সেই কাজের সঙ্গে বা আপনার জীবনে কী ধরনের ক্ষতি হয়েছে?”
৪. “ঘটনাটা কখন ঘটেছিল? কোন মাস বা বছর? আর আনুমানিক কত টাকার ক্ষতি হয়েছে সেটা যদি বলতে পারেন।”
৫. “আর কিছু বলতে চান কি? ঋণ বা অন্য কোনো সমস্যার কথা থাকলে সেটা শেয়ার করতে পারেন।”

শেষে:
সব তথ্য পেলে বলুন: "অনেক ধন্যবাদ আপনাকে। আপনার তথ্য সংরক্ষণ করা হয়েছে।"`;

// Function declaration for extracting respondent data
export const extractRespondentDataFunction: FunctionDeclaration = {
  name: "extract_respondent_data",
  description:
    "Extract and save respondent information from the conversation. Call this function whenever you receive new information from the respondent.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      name: {
        type: SchemaType.STRING,
        description: "নাম - The respondent's name",
      },
      fatherName: {
        type: SchemaType.STRING,
        description: "পিতার নাম - Father's name",
      },
      motherName: {
        type: SchemaType.STRING,
        description: "মাতার নাম - Mother's name",
      },
      district: {
        type: SchemaType.STRING,
        description: "জেলা - District name",
      },
      upazila: {
        type: SchemaType.STRING,
        description: "উপজেলা/থানা - Upazila or Thana name",
      },
      union: {
        type: SchemaType.STRING,
        description: "ইউনিয়ন - Union name",
      },
      village: {
        type: SchemaType.STRING,
        description: "গ্রাম - Village name",
      },
      profession: {
        type: SchemaType.STRING,
        description: "পেশা - Profession or occupation",
      },
      incidentType: {
        type: SchemaType.STRING,
        description:
          "ক্ষতির ধরন - Type of loss/damage (e.g., ফসল নষ্ট, বাড়িঘর ক্ষতি)",
      },
      incidentYear: {
        type: SchemaType.INTEGER,
        description: "বছর - Year when the incident occurred",
      },
      incidentMonth: {
        type: SchemaType.STRING,
        description: "মাস - Month when the incident occurred",
      },
      lossAmount: {
        type: SchemaType.NUMBER,
        description:
          "ক্ষতির পরিমাণ - Amount of loss in Taka (numeric value only)",
      },
      additionalInfo: {
        type: SchemaType.STRING,
        description:
          "অতিরিক্ত তথ্য - Additional information like loans, recovery status, etc.",
      },
    },
  },
};

export function getGeminiModel() {
  return genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: {
      parts: [{ text: systemPrompt }],
      role: "system",
    },
  });
}

export function getGeminiModelWithFunctions() {
  return genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: {
      parts: [{ text: systemPrompt }],
      role: "system",
    },
    tools: [
      {
        functionDeclarations: [extractRespondentDataFunction],
      },
    ],
    // Auto mode allows Gemini to decide when to call functions vs respond with text
    toolConfig: {
      functionCallingConfig: {
        mode: FunctionCallingMode.AUTO,
      },
    },
  });
}

// Separate model for audio extraction - forces function calling
export function getGeminiModelForAudioExtraction() {
  return genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    tools: [
      {
        functionDeclarations: [extractRespondentDataFunction],
      },
    ],
    // ANY mode forces function calling - required for audio extraction
    toolConfig: {
      functionCallingConfig: {
        mode: FunctionCallingMode.ANY,
      },
    },
  });
}

const audioExtractionPrompt = `এই অডিও ফাইলটি মনোযোগ দিয়ে শুনুন এবং এতে উল্লেখিত সকল তথ্য extract করুন।

অডিওতে নিম্নলিখিত তথ্যগুলো থাকতে পারে:
- নাম (name)
- পিতার নাম (fatherName) 
- মাতার নাম (motherName)
- জেলা (district)
- উপজেলা/থানা (upazila)
- ইউনিয়ন (union)
- গ্রাম (village)
- পেশা (profession)
- ক্ষতির ধরন (incidentType) - যেমন: বন্যা, ঝড়, ফসল নষ্ট
- বছর (incidentYear) - সংখ্যায়
- মাস (incidentMonth)
- ক্ষতির পরিমাণ টাকায় (lossAmount) - শুধু সংখ্যা
- অতিরিক্ত তথ্য (additionalInfo)

গুরুত্বপূর্ণ নির্দেশনা:
1. অডিওতে যা শুনবেন তার থেকে সরাসরি তথ্য নিন
2. অডিও বাংলা ভাষায় আঞ্চলিক উচ্চারণে হতে পারে (চাটগাঁইয়া, সিলেটি, নোয়াখালী ইত্যাদি)
3. আপনি অবশ্যই extract_respondent_data ফাংশন কল করতে হবে - এটি বাধ্যতামূলক
4. যদি কোনো তথ্য না পাওয়া যায়, তাহলেও ফাংশন কল করুন কিন্তু সেই ক্ষেত্রগুলো খালি রাখুন
5. কখনোই সাধারণ টেক্সট রেসপন্স দিবেন না - শুধুমাত্র ফাংশন কল করুন
6. অডিওতে যা শুনবেন, তা থেকে যতটুকু তথ্য পাবেন, সেটা extract_respondent_data ফাংশনে পাঠান`;

export async function extractDataFromAudio(
  audioBuffer: Buffer,
  mimeType: string
): Promise<Partial<import("@/types").RespondentData> | undefined> {
  try {
    // Convert buffer to base64
    const base64Audio = audioBuffer.toString("base64");

    // Determine the correct MIME type
    let audioMimeType = mimeType;
    if (!audioMimeType || audioMimeType === "application/octet-stream") {
      // Try to infer from common patterns
      // ADIF AAC header: starts with "ADIF"
      if (
        audioBuffer.length > 4 &&
        audioBuffer[0] === 0x41 &&
        audioBuffer[1] === 0x44 &&
        audioBuffer[2] === 0x49 &&
        audioBuffer[3] === 0x46
      ) {
        audioMimeType = "audio/aac";
      }
      // M4A/MP4 files start with ftyp at offset 4
      else if (
        audioBuffer.length > 8 &&
        audioBuffer[4] === 0x66 &&
        audioBuffer[5] === 0x74 &&
        audioBuffer[6] === 0x79 &&
        audioBuffer[7] === 0x70
      ) {
        // Check for M4A/M4V/MP4 signature (can contain AAC)
        audioMimeType = "audio/m4a";
      }
      // ADTS AAC header: 0xFF 0xF1 or 0xFF 0xF9 (distinct from MP3)
      else if (
        audioBuffer[0] === 0xff &&
        (audioBuffer[1] === 0xf1 || audioBuffer[1] === 0xf9)
      ) {
        audioMimeType = "audio/aac";
      }
      // WebM
      else if (audioBuffer[0] === 0x1a && audioBuffer[1] === 0x45) {
        audioMimeType = "audio/webm";
      }
      // MP3: 0xFF 0xFB or 0xFF 0xFA (but check it's not AAC ADTS)
      else if (
        audioBuffer[0] === 0xff &&
        (audioBuffer[1] === 0xfb || audioBuffer[1] === 0xfa)
      ) {
        // Distinguish MP3 from AAC ADTS by checking the sync word pattern
        // MP3 has specific bit patterns in the second byte
        if ((audioBuffer[1] & 0xe0) === 0xe0) {
          audioMimeType = "audio/mpeg";
        } else {
          audioMimeType = "audio/aac";
        }
      }
      // WAV
      else if (
        audioBuffer[0] === 0x52 &&
        audioBuffer[1] === 0x49 &&
        audioBuffer[2] === 0x46 &&
        audioBuffer[3] === 0x46
      ) {
        audioMimeType = "audio/wav";
      } else {
        audioMimeType = "audio/webm"; // Default fallback
      }
    }

    // Normalize MIME types
    if (audioMimeType === "audio/x-m4a" || audioMimeType === "audio/mp4") {
      audioMimeType = "audio/m4a";
    }
    if (audioMimeType === "audio/aacp" || audioMimeType === "audio/x-aac") {
      audioMimeType = "audio/aac";
    }

    console.log(
      `[Audio Extraction] Processing audio - Size: ${audioBuffer.length} bytes, MIME: ${audioMimeType}`
    );
    console.log(
      `[Speech-to-Text] Sending to Gemini - Base64 length: ${
        base64Audio.length
      } chars, First 100 chars: ${base64Audio.substring(0, 100)}...`
    );
    console.log(`[Speech-to-Text] Prompt: ${audioExtractionPrompt}`);

    // Get model with forced function calling for audio extraction
    const model = getGeminiModelForAudioExtraction();

    // Send audio with prompt
    console.log(`[Speech-to-Text] Calling Gemini API with audio data...`);
    const result = await model.generateContent([
      {
        text: audioExtractionPrompt,
      },
      {
        inlineData: {
          data: base64Audio,
          mimeType: audioMimeType,
        },
      },
    ]);

    const response = result.response;
    console.log(`[Speech-to-Text] Gemini API response received`);

    // Log response structure for debugging
    try {
      const candidates = response.candidates;
      if (candidates && candidates.length > 0) {
        console.log(
          `[Speech-to-Text] Response candidates count:`,
          candidates.length
        );
        candidates.forEach((candidate, idx) => {
          const parts = candidate.content?.parts || [];
          const hasFunctionCalls = parts.some(
            (p) => "functionCalls" in p && p.functionCalls
          );
          console.log(
            `[Speech-to-Text] Candidate ${idx} structure:`,
            JSON.stringify(
              {
                finishReason: candidate.finishReason,
                index: candidate.index,
                hasContent: !!candidate.content,
                hasFunctionCalls: hasFunctionCalls,
              },
              null,
              2
            )
          );
        });
      }
    } catch (err) {
      console.log(`[Speech-to-Text] Could not get candidates:`, err);
    }

    // Check for function calls first
    let extractedData: Partial<import("@/types").RespondentData> | undefined;
    let functionCalls: ReturnType<typeof response.functionCalls> | null = null;

    try {
      functionCalls = response.functionCalls();
      console.log(
        `[Speech-to-Text] Function calls received: ${
          functionCalls?.length || 0
        }`
      );
      console.log(
        `[Audio Extraction] Function calls received: ${
          functionCalls?.length || 0
        }`
      );
    } catch {
      console.log("[Speech-to-Text] No function calls in response");
      console.log("[Audio Extraction] No function calls in response");
      functionCalls = null;

      // If no function calls, try to get text response
      try {
        const responseText = response.text();
        console.log(`[Speech-to-Text] Full response text:`, responseText);
      } catch (textErr) {
        console.log(`[Speech-to-Text] Could not get text response:`, textErr);
      }
    }

    if (functionCalls && functionCalls.length > 0) {
      console.log(
        `[Speech-to-Text] Gemini returned ${functionCalls.length} function call(s)`
      );
      for (const functionCall of functionCalls) {
        console.log(
          `[Speech-to-Text] Function call: ${functionCall.name}`,
          JSON.stringify(functionCall, null, 2)
        );
        if (functionCall.name === "extract_respondent_data") {
          const args = functionCall.args as Record<string, unknown>;
          console.log(
            "[Speech-to-Text] Extracted data from function call:",
            JSON.stringify(args, null, 2)
          );
          console.log(
            "[Audio Extraction] Function call args:",
            JSON.stringify(args, null, 2)
          );

          // Build extracted data from function arguments
          extractedData = {};

          if (args.name) extractedData.name = String(args.name);
          if (args.fatherName)
            extractedData.fatherName = String(args.fatherName);
          if (args.motherName)
            extractedData.motherName = String(args.motherName);
          if (args.district) extractedData.district = String(args.district);
          if (args.upazila) extractedData.upazila = String(args.upazila);
          if (args.union) extractedData.union = String(args.union);
          if (args.village) extractedData.village = String(args.village);
          if (args.profession)
            extractedData.profession = String(args.profession);
          if (args.incidentType)
            extractedData.incidentType = String(args.incidentType);
          if (args.incidentYear)
            extractedData.incidentYear = Number(args.incidentYear);
          if (args.incidentMonth)
            extractedData.incidentMonth = String(args.incidentMonth);
          if (args.lossAmount)
            extractedData.lossAmount = Number(args.lossAmount);
          if (args.additionalInfo)
            extractedData.additionalInfo = String(args.additionalInfo);
        }
      }
    } else {
      // No function call - try to get text response and parse it
      let textResponse = "";
      try {
        textResponse = response.text();
        console.log("[Speech-to-Text] Gemini transcribed text:", textResponse);
        console.log(
          "[Audio Extraction] Text response (no function call):",
          textResponse
        );
      } catch (textError) {
        console.error(
          "[Audio Extraction] Error getting text response:",
          textError
        );
        // Try to get candidates to see what Gemini returned
        try {
          const candidates = response.candidates;
          console.log(
            "[Speech-to-Text] Response candidates:",
            JSON.stringify(candidates, null, 2)
          );
        } catch (candidateError) {
          console.error(
            "[Speech-to-Text] Error getting candidates:",
            candidateError
          );
        }
      }

      // Try to parse JSON from text response if it looks like JSON
      if (textResponse) {
        extractedData = parseTextResponse(textResponse);
        if (extractedData) {
          console.log(
            "[Audio Extraction] Parsed from text:",
            JSON.stringify(extractedData, null, 2)
          );
        }
      }
    }

    // Apply location matching for district, upazila, and union
    if (
      extractedData &&
      (extractedData.district || extractedData.upazila || extractedData.union)
    ) {
      const matchedLocation = matchLocation(
        extractedData.district,
        extractedData.upazila,
        extractedData.union
      );
      if (matchedLocation.district) {
        extractedData.district = matchedLocation.district;
      }
      if (matchedLocation.upazila) {
        extractedData.upazila = matchedLocation.upazila;
      }
      if (matchedLocation.union) {
        extractedData.union = matchedLocation.union;
      }
    }

    const hasData = extractedData && Object.keys(extractedData).length > 0;
    console.log(
      `[Audio Extraction] Final result: ${
        hasData ? "Data extracted" : "No data extracted"
      }`,
      hasData ? extractedData : ""
    );

    return hasData ? extractedData : undefined;
  } catch (error) {
    console.error("[Audio Extraction] Error:", error);
    throw error;
  }
}

/**
 * Parse text response to extract data when function calling fails
 */
function parseTextResponse(
  text: string
): Partial<import("@/types").RespondentData> | undefined {
  const data: Partial<import("@/types").RespondentData> = {};

  // Try to parse as JSON first
  try {
    // Look for JSON object in the text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.name) data.name = String(parsed.name);
      if (parsed.fatherName) data.fatherName = String(parsed.fatherName);
      if (parsed.motherName) data.motherName = String(parsed.motherName);
      if (parsed.district) data.district = String(parsed.district);
      if (parsed.upazila) data.upazila = String(parsed.upazila);
      if (parsed.union) data.union = String(parsed.union);
      if (parsed.village) data.village = String(parsed.village);
      if (parsed.profession) data.profession = String(parsed.profession);
      if (parsed.incidentType) data.incidentType = String(parsed.incidentType);
      if (parsed.incidentYear) data.incidentYear = Number(parsed.incidentYear);
      if (parsed.incidentMonth)
        data.incidentMonth = String(parsed.incidentMonth);
      if (parsed.lossAmount) data.lossAmount = Number(parsed.lossAmount);
      if (parsed.additionalInfo)
        data.additionalInfo = String(parsed.additionalInfo);

      if (Object.keys(data).length > 0) {
        return data;
      }
    }
  } catch {
    // JSON parsing failed, try regex patterns
  }

  // Regex patterns for Bengali text extraction
  const patterns: {
    key: keyof import("@/types").RespondentData;
    patterns: RegExp[];
  }[] = [
    {
      key: "name",
      patterns: [/নাম[:\s]+([^\n,।]+)/i, /name[:\s]+([^\n,।]+)/i],
    },
    {
      key: "fatherName",
      patterns: [
        /পিতার নাম[:\s]+([^\n,।]+)/i,
        /বাবার নাম[:\s]+([^\n,।]+)/i,
        /father['']?s? name[:\s]+([^\n,।]+)/i,
      ],
    },
    {
      key: "motherName",
      patterns: [
        /মাতার নাম[:\s]+([^\n,।]+)/i,
        /মায়ের নাম[:\s]+([^\n,।]+)/i,
        /mother['']?s? name[:\s]+([^\n,।]+)/i,
      ],
    },
    {
      key: "district",
      patterns: [/জেলা[:\s]+([^\n,।]+)/i, /district[:\s]+([^\n,।]+)/i],
    },
    {
      key: "upazila",
      patterns: [
        /উপজেলা[:\s]+([^\n,।]+)/i,
        /থানা[:\s]+([^\n,।]+)/i,
        /upazila[:\s]+([^\n,।]+)/i,
      ],
    },
    {
      key: "union",
      patterns: [/ইউনিয়ন[:\s]+([^\n,।]+)/i, /union[:\s]+([^\n,।]+)/i],
    },
    {
      key: "village",
      patterns: [/গ্রাম[:\s]+([^\n,।]+)/i, /village[:\s]+([^\n,।]+)/i],
    },
    {
      key: "profession",
      patterns: [/পেশা[:\s]+([^\n,।]+)/i, /profession[:\s]+([^\n,।]+)/i],
    },
    {
      key: "incidentType",
      patterns: [
        /ক্ষতির ধরন[:\s]+([^\n,।]+)/i,
        /ক্ষতির ধরণ[:\s]+([^\n,।]+)/i,
        /incident type[:\s]+([^\n,।]+)/i,
      ],
    },
    {
      key: "incidentMonth",
      patterns: [/মাস[:\s]+([^\n,।]+)/i, /month[:\s]+([^\n,।]+)/i],
    },
    {
      key: "additionalInfo",
      patterns: [
        /অতিরিক্ত তথ্য[:\s]+([^\n।]+)/i,
        /additional info[:\s]+([^\n।]+)/i,
      ],
    },
  ];

  // Numeric patterns
  const yearPatterns = [
    /বছর[:\s]+(\d{4})/i,
    /year[:\s]+(\d{4})/i,
    /(\d{4})\s*সাল/i,
  ];
  const amountPatterns = [
    /ক্ষতির পরিমাণ[:\s]+([\d,]+)/i,
    /loss amount[:\s]+([\d,]+)/i,
    /([\d,]+)\s*টাকা/i,
  ];

  for (const { key, patterns: regexPatterns } of patterns) {
    for (const pattern of regexPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        (data as Record<string, string>)[key] = match[1].trim();
        break;
      }
    }
  }

  // Extract year
  for (const pattern of yearPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      data.incidentYear = parseInt(match[1], 10);
      break;
    }
  }

  // Extract amount
  for (const pattern of amountPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      data.lossAmount = parseFloat(match[1].replace(/,/g, ""));
      break;
    }
  }

  return Object.keys(data).length > 0 ? data : undefined;
}

export { systemPrompt };
