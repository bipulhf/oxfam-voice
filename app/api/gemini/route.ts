import { NextResponse } from "next/server";
import { getGeminiModelWithFunctions } from "@/lib/gemini";
import { matchLocation } from "@/lib/name-matcher";
import type { RespondentData } from "@/types";

export async function POST(request: Request) {
  try {
    const { message, history, sessionId } = await request.json();

    const model = getGeminiModelWithFunctions();
    const chat = model.startChat({
      history: history || [],
    });

    const result = await chat.sendMessage(message);
    const response = result.response;

    // Check for function calls
    let extractedData: Partial<RespondentData> | undefined;
    let responseText = "";

    try {
      const functionCalls = response.functionCalls();

      if (functionCalls && functionCalls.length > 0) {
        for (const functionCall of functionCalls) {
          if (functionCall.name === "extract_respondent_data") {
            const args = functionCall.args as Record<string, unknown>;

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

            // Apply location matching for district, upazila, and union
            if (
              extractedData.district ||
              extractedData.upazila ||
              extractedData.union
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

            // Send function response back to get the text response
            try {
              const functionResponse = await chat.sendMessage([
                {
                  functionResponse: {
                    name: "extract_respondent_data",
                    response: { success: true, data: extractedData },
                  },
                },
              ]);

              // Try to get text from the function response
              try {
                responseText = functionResponse.response.text();
              } catch {
                // If no text in function response, explicitly ask for continuation
                const continuationResponse = await chat.sendMessage(
                  "তথ্য সংরক্ষণ হয়েছে। এখন পরবর্তী প্রশ্ন জিজ্ঞেস করুন।"
                );
                responseText = continuationResponse.response.text();
              }
            } catch (functionError) {
              console.error("Error sending function response:", functionError);
              // Fall back to getting text directly
              try {
                responseText = response.text();
              } catch {
                // If still no text, ask for continuation
                const continuationResponse = await chat.sendMessage(
                  "এখন পরবর্তী প্রশ্ন জিজ্ঞেস করুন।"
                );
                responseText = continuationResponse.response.text();
              }
            }
          }
        }
      } else {
        // No function call, just get the text
        responseText = response.text();
      }
    } catch (functionCallError) {
      console.error("Error processing function calls:", functionCallError);
      // Fall back to getting text directly
      try {
        responseText = response.text();
      } catch (textError) {
        console.error("Error getting response text:", textError);
        throw new Error("Failed to get response from Gemini");
      }
    }

    // If no response text yet, try to get it directly
    if (!responseText) {
      try {
        responseText = response.text();
      } catch {
        // Ignore - will try continuation below
      }
    }

    // If still no response text, ask Gemini to continue the conversation
    if (!responseText || responseText.trim() === "") {
      try {
        const continuationResponse = await chat.sendMessage(
          "পরবর্তী প্রশ্ন জিজ্ঞেস করুন।"
        );
        responseText = continuationResponse.response.text();
      } catch {
        // Last resort fallback - this should rarely happen
        responseText = "ধন্যবাদ। এখন আপনার জেলা, উপজেলা ও ইউনিয়নের নাম বলুন।";
      }
    }

    return NextResponse.json({
      text: responseText,
      history: await chat.getHistory(),
      extractedData:
        extractedData && Object.keys(extractedData).length > 0
          ? extractedData
          : undefined,
      sessionId,
    });
  } catch (error) {
    console.error("Error calling Gemini:", error);

    // Provide more detailed error information
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    const errorDetails =
      error instanceof Error && error.stack ? error.stack : String(error);

    console.error("Error details:", errorDetails);

    return NextResponse.json(
      {
        error: "Failed to get response from Gemini",
        message: errorMessage,
        details:
          process.env.NODE_ENV === "development" ? errorDetails : undefined,
      },
      { status: 500 }
    );
  }
}
