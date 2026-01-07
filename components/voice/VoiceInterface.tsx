"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  IconPhone,
  IconPhoneOff,
  IconMicrophone,
  IconVolume,
  IconUser,
  IconRobot,
  IconUpload,
} from "@tabler/icons-react";
import { postApi, patchApi } from "@/lib/api";
import { Effect } from "effect";
import type { SessionResponse, RespondentData } from "@/types";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

type CallState = "idle" | "connecting" | "active" | "ended" | "uploading";
type SpeakingState = "idle" | "user" | "assistant" | "processing";

export function VoiceInterface() {
  const [session, setSession] = React.useState<SessionResponse | null>(null);
  const [callState, setCallState] = React.useState<CallState>("idle");
  const [speakingState, setSpeakingState] =
    React.useState<SpeakingState>("idle");
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [currentTranscript, setCurrentTranscript] = React.useState("");
  const [extractedData, setExtractedData] = React.useState<
    RespondentData | undefined
  >();
  const [callDuration, setCallDuration] = React.useState(0);
  const [uploadProgress, setUploadProgress] = React.useState<string>("");

  // Use refs for values that need to be accessed in callbacks without stale closures
  const callStateRef = React.useRef<CallState>("idle");
  const speakingStateRef = React.useRef<SpeakingState>("idle");
  const sessionRef = React.useRef<SessionResponse | null>(null);
  const extractedDataRef = React.useRef<RespondentData | undefined>(undefined);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const recognitionRef = React.useRef<SpeechRecognition | null>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const streamRef = React.useRef<MediaStream | null>(null);
  const geminiHistoryRef = React.useRef<unknown[]>([]);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const callStartRef = React.useRef<Date | null>(null);
  const durationIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const silenceTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const pendingTranscriptRef = React.useRef<string>("");

  // Keep refs in sync with state
  React.useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  React.useEffect(() => {
    speakingStateRef.current = speakingState;
  }, [speakingState]);

  React.useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  React.useEffect(() => {
    extractedDataRef.current = extractedData;
  }, [extractedData]);

  // Scroll to bottom of messages
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Call duration timer
  React.useEffect(() => {
    if (callState === "active") {
      callStartRef.current = new Date();
      durationIntervalRef.current = setInterval(() => {
        if (callStartRef.current) {
          setCallDuration(
            Math.floor((Date.now() - callStartRef.current.getTime()) / 1000)
          );
        }
      }, 1000);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    }
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [callState]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const speak = React.useCallback(async (text: string): Promise<void> => {
    // Guard against empty text
    if (!text || text.trim() === "") {
      console.warn("speak() called with empty text, skipping TTS");
      return;
    }

    try {
      setSpeakingState("assistant");
      speakingStateRef.current = "assistant";

      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Call Google Cloud TTS API
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("TTS API error - Status:", response.status);
        console.error("TTS API error - Details:", errorData);
        if (errorData.message) {
          console.error("TTS API error - Message:", errorData.message);
        }
        // Fall back to browser TTS
        console.log("Falling back to browser TTS...");
        return speakWithBrowser(text);
      }

      const data = await response.json();

      if (!data.audioContent) {
        console.error("No audio content received");
        return speakWithBrowser(text);
      }

      // Create audio from base64
      const audioSrc = `data:audio/mp3;base64,${data.audioContent}`;
      const audio = new Audio(audioSrc);
      audioRef.current = audio;

      return new Promise((resolve, reject) => {
        audio.onended = () => {
          setSpeakingState("idle");
          speakingStateRef.current = "idle";
          audioRef.current = null;
          resolve();
        };

        audio.onerror = (e) => {
          console.error("Audio playback error:", e);
          setSpeakingState("idle");
          speakingStateRef.current = "idle";
          audioRef.current = null;
          reject(e);
        };

        audio.play().catch((err) => {
          console.error("Failed to play audio:", err);
          // Fall back to browser TTS
          speakWithBrowser(text).then(resolve).catch(reject);
        });
      });
    } catch (error) {
      console.error("TTS error:", error);
      // Fall back to browser TTS
      return speakWithBrowser(text);
    }
  }, []);

  // Fallback to browser TTS
  const speakWithBrowser = React.useCallback((text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!("speechSynthesis" in window)) {
        setSpeakingState("idle");
        speakingStateRef.current = "idle";
        reject(new Error("Speech synthesis not supported"));
        return;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "bn-BD";
      utterance.rate = 1.2; // Faster rate
      utterance.pitch = 1;

      const voices = window.speechSynthesis.getVoices();
      const bengaliVoice = voices.find(
        (v) => v.lang.includes("bn") || v.lang.includes("hi")
      );
      if (bengaliVoice) {
        utterance.voice = bengaliVoice;
      }

      utterance.onend = () => {
        setSpeakingState("idle");
        speakingStateRef.current = "idle";
        resolve();
      };
      utterance.onerror = (e) => {
        setSpeakingState("idle");
        speakingStateRef.current = "idle";
        reject(e);
      };

      window.speechSynthesis.speak(utterance);
    });
  }, []);

  // Function to restart recognition using refs (avoids stale closures)
  const restartRecognition = React.useCallback(() => {
    if (
      callStateRef.current === "active" &&
      speakingStateRef.current !== "processing" &&
      speakingStateRef.current !== "assistant" &&
      recognitionRef.current
    ) {
      try {
        recognitionRef.current.start();
        setSpeakingState("user");
        speakingStateRef.current = "user";
      } catch {
        // Ignore if already started
      }
    }
  }, []);

  const sendToGemini = React.useCallback(
    async (message: string) => {
      const currentSession = sessionRef.current;
      if (!currentSession) return;

      try {
        setSpeakingState("processing");
        speakingStateRef.current = "processing";

        const result = await Effect.runPromise(
          postApi<{
            text: string;
            history: unknown[];
            extractedData?: RespondentData;
          }>("/api/gemini", {
            message,
            history: geminiHistoryRef.current,
            sessionId: currentSession.id,
          })
        );

        if ("error" in result) {
          const errorResult = result as {
            error: string;
            message?: string;
            details?: string;
          };
          const errorMsg =
            errorResult.message ||
            errorResult.error ||
            "Failed to get response";
          console.error("API returned error:", errorResult);
          throw new Error(errorMsg);
        }

        geminiHistoryRef.current = result.history;

        // Add assistant message
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: result.text, timestamp: new Date() },
        ]);

        // Update extracted data from function calling
        if (result.extractedData) {
          const newData = {
            ...extractedDataRef.current,
            ...result.extractedData,
          };
          setExtractedData(newData);
          extractedDataRef.current = newData;

          // Save to database
          await Effect.runPromise(
            patchApi<SessionResponse>(`/api/session/${currentSession.id}`, {
              respondent: newData,
            })
          );
        }

        // Speak the response
        await speak(result.text);

        // Resume listening after speaking
        restartRecognition();
      } catch (error) {
        console.error("Error sending to Gemini:", error);
        // Log more details about the error
        if (error instanceof Error) {
          console.error("Error message:", error.message);
          console.error("Error stack:", error.stack);
        } else if (typeof error === "object" && error !== null) {
          console.error("Error details:", JSON.stringify(error, null, 2));
        }

        setSpeakingState("idle");
        speakingStateRef.current = "idle";

        // Show user-friendly error message
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Gemini API তে সমস্যা হয়েছে। আবার চেষ্টা করুন।";

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `দুঃখিত, ${errorMessage}`,
            timestamp: new Date(),
          },
        ]);

        // Try to restart recognition even on error
        restartRecognition();
      }
    },
    [speak, restartRecognition]
  );

  // Handle silence timeout - send accumulated transcript
  const handleSilenceTimeout = React.useCallback(() => {
    if (pendingTranscriptRef.current.trim()) {
      const transcript = pendingTranscriptRef.current.trim();
      pendingTranscriptRef.current = "";
      setCurrentTranscript("");

      setMessages((prev) => [
        ...prev,
        { role: "user", content: transcript, timestamp: new Date() },
      ]);

      // Stop recognition while processing
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore
        }
      }

      sendToGemini(transcript);
    }
  }, [sendToGemini]);

  const initSpeechRecognition = React.useCallback(() => {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      alert(
        "আপনার ব্রাউজার স্পিচ রিকগনিশন সাপোর্ট করে না। Chrome ব্যবহার করুন।"
      );
      return null;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "bn-BD";

    recognition.onstart = () => {
      setSpeakingState("user");
      speakingStateRef.current = "user";
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Clear silence timeout
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }

      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        pendingTranscriptRef.current += finalTranscript;
        setCurrentTranscript(pendingTranscriptRef.current);

        // Set silence timeout - if no more speech for 1.5s, send the message
        silenceTimeoutRef.current = setTimeout(() => {
          handleSilenceTimeout();
        }, 1500);
      } else if (interimTranscript) {
        setCurrentTranscript(pendingTranscriptRef.current + interimTranscript);

        // Set silence timeout for interim results too
        silenceTimeoutRef.current = setTimeout(() => {
          handleSilenceTimeout();
        }, 2000);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      if (event.error !== "no-speech" && event.error !== "aborted") {
        setSpeakingState("idle");
        speakingStateRef.current = "idle";
      }
    };

    recognition.onend = () => {
      // Use refs to check current state (avoids stale closures)
      if (
        callStateRef.current === "active" &&
        speakingStateRef.current !== "processing" &&
        speakingStateRef.current !== "assistant"
      ) {
        // Small delay before restarting
        setTimeout(() => {
          if (
            callStateRef.current === "active" &&
            speakingStateRef.current !== "processing" &&
            speakingStateRef.current !== "assistant"
          ) {
            try {
              recognition.start();
            } catch {
              // Ignore
            }
          }
        }, 100);
      }
    };

    return recognition;
  }, [handleSilenceTimeout]);

  const startCall = React.useCallback(async () => {
    try {
      setCallState("connecting");
      callStateRef.current = "connecting";

      // Start session
      const result = await Effect.runPromise(
        postApi<SessionResponse>("/api/session/start", {})
      );

      if ("error" in result) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        throw new Error((result as any).message || "Failed to start session");
      }

      setSession(result);
      sessionRef.current = result;
      setMessages([]);
      setExtractedData(undefined);
      extractedDataRef.current = undefined;
      geminiHistoryRef.current = [];
      setCallDuration(0);
      pendingTranscriptRef.current = "";

      // Initialize speech recognition
      const recognition = initSpeechRecognition();
      if (!recognition) {
        setCallState("idle");
        callStateRef.current = "idle";
        return;
      }
      recognitionRef.current = recognition;

      // Initialize audio recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        streamRef.current = stream;

        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: "audio/webm;codecs=opus",
        });

        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start(1000); // Collect chunks every second
      } catch (error) {
        console.error("Error starting audio recording:", error);
        // Continue without recording - speech recognition can still work
      }

      // Load voices if needed
      if ("speechSynthesis" in window) {
        window.speechSynthesis.getVoices();
      }

      setCallState("active");
      callStateRef.current = "active";

      // Start with a greeting from the assistant
      const greeting =
        "আসসালামু আলাইকুম! আমি আপনার তথ্য সংগ্রহ করতে চাই। প্রথমে আপনার নাম বলুন।";
      setMessages([
        { role: "assistant", content: greeting, timestamp: new Date() },
      ]);

      await speak(greeting);

      // Start listening
      try {
        recognition.start();
      } catch {
        // Ignore
      }
    } catch (error) {
      console.error("Error starting call:", error);
      setCallState("idle");
      callStateRef.current = "idle";
      alert("কল শুরু করতে ব্যর্থ হয়েছে");
    }
  }, [initSpeechRecognition, speak]);

  const endCall = React.useCallback(async () => {
    // Clear any pending timeouts
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }

    // Stop recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    // Stop any playing TTS audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Stop browser speech synthesis (fallback)
    window.speechSynthesis?.cancel();

    // Stop media recorder and save audio
    const currentSession = sessionRef.current;
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();

      // Wait for final data
      await new Promise<void>((resolve) => {
        if (mediaRecorderRef.current) {
          mediaRecorderRef.current.onstop = async () => {
            // Upload audio
            if (currentSession && audioChunksRef.current.length > 0) {
              const audioBlob = new Blob(audioChunksRef.current, {
                type: "audio/webm",
              });
              const formData = new FormData();
              formData.append(
                "audio",
                audioBlob,
                `${currentSession.sessionCode}.webm`
              );
              formData.append("isComplete", "true");

              try {
                await fetch(`/api/session/${currentSession.id}/audio`, {
                  method: "POST",
                  body: formData,
                });
              } catch (error) {
                console.error("Error uploading audio:", error);
              }
            }
            resolve();
          };
        } else {
          resolve();
        }
      });
    }

    // Stop audio stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setCallState("ended");
    callStateRef.current = "ended";
    setSpeakingState("idle");
    speakingStateRef.current = "idle";

    // Complete session
    if (currentSession) {
      try {
        await Effect.runPromise(
          patchApi<SessionResponse>(`/api/session/${currentSession.id}`, {
            status: "COMPLETED",
            respondent: extractedDataRef.current,
          })
        );
      } catch (error) {
        console.error("Error completing session:", error);
      }
    }
  }, []);

  const resetCall = React.useCallback(() => {
    setCallState("idle");
    callStateRef.current = "idle";
    setSession(null);
    sessionRef.current = null;
    setMessages([]);
    setCurrentTranscript("");
    setExtractedData(undefined);
    extractedDataRef.current = undefined;
    setCallDuration(0);
    setUploadProgress("");
    audioChunksRef.current = [];
  }, []);

  const handleFileUpload = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

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
      const isValidType =
        allowedTypes.includes(file.type) ||
        file.name.match(/\.(webm|mp3|wav|ogg|m4a|aac)$/i);

      if (!isValidType) {
        alert(
          "অসমর্থিত অডিও ফরম্যাট। সমর্থিত ফরম্যাট: webm, mp3, wav, ogg, m4a, aac"
        );
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      try {
        setCallState("uploading");
        callStateRef.current = "uploading";
        setUploadProgress("অডিও ফাইল আপলোড হচ্ছে...");

        const formData = new FormData();
        formData.append("audio", file);

        const response = await fetch("/api/audio/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || errorData.error || "আপলোড ব্যর্থ হয়েছে"
          );
        }

        setUploadProgress("অডিও প্রক্রিয়াকরণ হচ্ছে...");

        const result = await response.json();

        if ("error" in result) {
          throw new Error(result.message || result.error);
        }

        setSession(result);
        sessionRef.current = result;
        setExtractedData(result.respondent);
        extractedDataRef.current = result.respondent;
        setCallState("ended");
        callStateRef.current = "ended";
        setUploadProgress("");
      } catch (error) {
        console.error("Error uploading audio:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "অডিও আপলোড করতে সমস্যা হয়েছে";
        alert(errorMessage);
        setCallState("idle");
        callStateRef.current = "idle";
        setUploadProgress("");
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    []
  );

  const triggerFileUpload = React.useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      // Stop TTS audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      window.speechSynthesis?.cancel();
    };
  }, []);

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center p-4 overflow-hidden selection:bg-primary/30 font-sans">
      {/* Tyupographic Background Overlay */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        {/* Abstract Shapes/Orbs for depth */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-secondary/5 blur-[100px] animate-[pulse_10s_ease-in-out_infinite] delay-1000" />

        {/* Floating Context Words */}
        <div className="absolute top-[5%] left-[2%] text-[10rem] md:text-[14rem] font-bold text-primary/50 -rotate-12 animate-[pulse_8s_ease-in-out_infinite] leading-none tracking-tighter mix-blend-overlay">
          তথ্য
        </div>
        <div className="absolute top-[20%] right-[-5%] text-[8rem] md:text-[12rem] font-bold text-secondary/50 rotate-6 animate-[pulse_9s_ease-in-out_infinite] delay-1000 leading-none tracking-tighter mix-blend-overlay">
          সেবা
        </div>
        <div className="absolute bottom-[10%] left-[-5%] text-[9rem] md:text-[13rem] font-bold text-primary/50 rotate-12 animate-[pulse_10s_ease-in-out_infinite] delay-500 leading-none tracking-tighter mix-blend-overlay">
          ভয়েস
        </div>
        <div className="absolute bottom-[25%] right-[5%] text-[10rem] md:text-[15rem] font-bold text-secondary/50 -rotate-6 animate-[pulse_11s_ease-in-out_infinite] delay-2000 leading-none tracking-tighter mix-blend-overlay">
          AI
        </div>

        {/* Smaller Scattered Words */}
        <div className="absolute top-[40%] left-[10%] text-4xl md:text-6xl font-bold text-slate-500/50 -rotate-3 blur-[1px]">
          বন্যা
        </div>
        <div className="absolute top-[55%] right-[15%] text-4xl md:text-6xl font-bold text-slate-500/50 rotate-3 blur-[1px]">
          ফসল
        </div>
        <div className="absolute bottom-[5%] left-[20%] text-3xl md:text-5xl font-bold text-slate-500/50 -rotate-6 blur-[1px]">
          প্রযুক্তি
        </div>
        <div className="absolute top-[10%] right-[20%] text-3xl md:text-5xl font-bold text-slate-500/50 rotate-12 blur-[1px]">
          ক্ষয়ক্ষতি
        </div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Phone Frame */}
        <div className="bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-2xl border border-white/10 rounded-[3.5rem] p-4 shadow-2xl shadow-black/80 ring-1 ring-white/5 transition-all duration-500 hover:shadow-primary/5 relative group">
          {/* Frame Glow - Reduced */}
          <div className="absolute -inset-0.5 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-[3.6rem] blur opacity-10 group-hover:opacity-20 transition duration-500 -z-10" />

          <div className="bg-black/20 rounded-[3rem] overflow-hidden relative h-[85vh] max-h-[800px] flex flex-col border border-white/5">
            {/* Notch Area */}
            <div className="w-full flex justify-center pt-4 pb-2 z-20 absolute top-0 inset-x-0 pointer-events-none">
              <div className="w-32 h-7 bg-black rounded-full border border-white/10 flex items-center justify-center gap-3 px-3 shadow-lg">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                <div className="w-16 h-1.5 rounded-full bg-slate-900 border border-slate-800" />
                <div className="w-1.5 h-1.5 rounded-full bg-blue-900/30" />
              </div>
            </div>

            {/* Screen Content */}
            <div className="flex-1 flex flex-col relative pt-16 px-6 pb-8 overflow-hidden">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/webm,audio/mp3,audio/wav,audio/ogg,audio/m4a,audio/mpeg,audio/aac,audio/aacp,audio/mp4,audio/x-aac"
                onChange={handleFileUpload}
                className="hidden"
              />

              {callState === "idle" && (
                <div className="flex-1 flex flex-col items-center justify-center space-y-12 animate-in fade-in zoom-in duration-500">
                  <div className="relative group/orb">
                    <div className="absolute inset-0 bg-primary/40 blur-[40px] group-hover/orb:blur-[60px] transition-all duration-500" />
                    <div className="w-40 h-40 rounded-full bg-gradient-to-br from-primary to-secondary p-1 relative shadow-2xl shadow-primary/30 group-hover/orb:scale-105 transition-transform duration-500">
                      <div className="w-full h-full rounded-full bg-slate-950/80 backdrop-blur-md flex items-center justify-center border border-white/10">
                        <IconRobot className="w-20 h-20 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                      </div>
                    </div>
                  </div>

                  <div className="text-center space-y-4">
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-primary-foreground to-white">
                      তথ্য সংগ্রহ সেবা
                    </h2>
                    <p className="text-slate-200 text-sm max-w-[200px] mx-auto leading-relaxed">
                      বুদ্ধিমান এআই সহকারীর সাথে কথা বলে আপনার তথ্য দিন
                    </p>
                  </div>

                  <div className="flex gap-6 w-full justify-center">
                    <Button
                      onClick={startCall}
                      size="lg"
                      className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 shadow-[0_0_40px_-10px_rgba(16,185,129,0.5)] transition-all hover:scale-110 border-4 border-emerald-900/20 group/btn"
                    >
                      <IconPhone className="w-8 h-8 text-white group-hover/btn:animate-[tada_1s_ease-in-out_infinite]" />
                    </Button>
                    <Button
                      onClick={triggerFileUpload}
                      size="lg"
                      className="w-20 h-20 rounded-full bg-slate-800/50 hover:bg-white/10 backdrop-blur-md border border-white/10 shadow-lg transition-all hover:scale-110 group/ul"
                    >
                      <IconUpload className="w-8 h-8 text-slate-300 group-hover/ul:text-white" />
                    </Button>
                  </div>
                </div>
              )}

              {callState === "uploading" && (
                <div className="flex-1 flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-300">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center backdrop-blur-xl border border-white/10">
                      <IconUpload className="w-12 h-12 text-blue-400 animate-bounce" />
                    </div>
                    <div className="absolute inset-0 rounded-full border-2 border-blue-500/30 animate-[spin_3s_linear_infinite]" />
                    <div className="absolute inset-2 rounded-full border-t-2 border-primary/50 animate-[spin_2s_linear_infinite_reverse]" />
                  </div>
                  <div className="text-center space-y-2">
                    <h2 className="text-xl font-medium text-white tracking-wide">
                      প্রক্রিয়াকরণ হচ্ছে...
                    </h2>
                    <p className="text-slate-400 text-sm animate-pulse">
                      {uploadProgress}
                    </p>
                  </div>
                </div>
              )}

              {callState === "connecting" && (
                <div className="flex-1 flex flex-col items-center justify-center space-y-10 animate-in fade-in duration-300">
                  <div className="relative">
                    <div className="absolute inset-0 bg-secondary/30 blur-[40px]" />
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center border border-white/10 relative z-10 shadow-xl">
                      <IconRobot className="w-14 h-14 text-secondary animate-pulse" />
                    </div>
                    {/* Ripple effects */}
                    <div className="absolute inset-0 rounded-full border border-secondary/30 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
                    <div className="absolute -inset-4 rounded-full border border-secondary/20 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite_0.5s]" />
                  </div>
                  <div className="text-center space-y-2">
                    <h2 className="text-xl font-medium text-white tracking-wide">
                      সংযোগ স্থাপন করা হচ্ছে
                    </h2>
                    <p className="text-slate-500 text-sm">
                      দয়া করে অপেক্ষা করুন...
                    </p>
                  </div>
                </div>
              )}

              {callState === "active" && (
                <div className="flex-1 flex flex-col h-full animate-in slide-in-from-bottom-10 fade-in duration-500">
                  {/* Active Call Header */}
                  <div className="text-center py-2 mb-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full shadow-[0_0_10px_currentColor]",
                          speakingState === "assistant"
                            ? "bg-emerald-400"
                            : speakingState === "user"
                            ? "bg-blue-400"
                            : "bg-slate-400"
                        )}
                      />
                      <span className="text-slate-200 text-xs font-medium tracking-wide">
                        {formatDuration(callDuration)}
                      </span>
                    </div>
                  </div>

                  {/* Avatar Visualization */}
                  <div className="flex justify-center py-6 relative">
                    {/* Halo Effect */}
                    <div
                      className={cn(
                        "absolute inset-0 blur-[60px] transition-colors duration-500",
                        speakingState === "assistant"
                          ? "bg-emerald-500/20"
                          : speakingState === "user"
                          ? "bg-blue-500/20"
                          : "bg-transparent"
                      )}
                    />

                    <div className="relative z-10">
                      <div
                        className={cn(
                          "w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 border-4",
                          speakingState === "assistant"
                            ? "border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.3)] scale-105"
                            : speakingState === "user"
                            ? "border-blue-500/50 shadow-[0_0_50px_rgba(59,130,246,0.3)] scale-105"
                            : "border-slate-700 bg-slate-800/50"
                        )}
                      >
                        <div className="w-full h-full rounded-full bg-slate-900/90 flex items-center justify-center overflow-hidden">
                          {speakingState === "user" ? (
                            <IconUser className="w-14 h-14 text-blue-400" />
                          ) : (
                            <IconRobot className="w-14 h-14 text-emerald-400" />
                          )}
                        </div>
                      </div>

                      {/* Animated Rings */}
                      {(speakingState === "assistant" ||
                        speakingState === "user") && (
                        <>
                          <div
                            className={cn(
                              "absolute inset-0 rounded-full border border-current animate-[ping_2s_linear_infinite] opacity-30",
                              speakingState === "assistant"
                                ? "text-emerald-500"
                                : "text-blue-500"
                            )}
                          />
                          <div
                            className={cn(
                              "absolute -inset-4 rounded-full border border-current animate-[ping_2s_linear_infinite_0.5s] opacity-20",
                              speakingState === "assistant"
                                ? "text-emerald-500"
                                : "text-blue-500"
                            )}
                          />
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status Text */}
                  <div className="text-center mb-6 min-h-[24px]">
                    <span
                      className={cn(
                        "text-sm font-medium tracking-wider uppercase transition-colors duration-300",
                        speakingState === "assistant"
                          ? "text-emerald-400"
                          : speakingState === "user"
                          ? "text-blue-400"
                          : "text-slate-500"
                      )}
                    >
                      {speakingState === "assistant"
                        ? "AI কথা বলছে..."
                        : speakingState === "user"
                        ? "আপনি কথা বলছেন..."
                        : speakingState === "processing"
                        ? "চিন্তা করছে..."
                        : "শুনছি..."}
                    </span>
                  </div>

                  {/* Messages Area - Glass Card */}
                  <div className="flex-1 bg-gradient-to-b from-white/5 to-transparent rounded-t-[2.5rem] border-t border-white/10 backdrop-blur-sm relative overflow-hidden">
                    <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-black/20 to-transparent z-10" />

                    <div className="h-full overflow-y-auto p-4 space-y-4 pb-20 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
                      {messages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "flex gap-3",
                            msg.role === "user"
                              ? "justify-end"
                              : "justify-start"
                          )}
                        >
                          {msg.role === "assistant" && (
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-1">
                              <IconRobot className="w-4 h-4 text-emerald-400" />
                            </div>
                          )}
                          <div
                            className={cn(
                              "max-w-[80%] px-4 py-3 text-sm shadow-md",
                              msg.role === "user"
                                ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl rounded-tr-sm border border-blue-500/30"
                                : "bg-slate-800/80 text-slate-200 rounded-2xl rounded-tl-sm border border-white/5"
                            )}
                          >
                            {msg.content}
                          </div>
                        </div>
                      ))}

                      {currentTranscript && (
                        <div className="flex gap-3 justify-end">
                          <div className="max-w-[80%] px-4 py-3 text-sm bg-blue-600/30 text-blue-100 rounded-2xl rounded-tr-sm border border-blue-500/20 backdrop-blur-sm">
                            {currentTranscript}
                            <span className="w-1.5 h-4 inline-block align-middle ml-1 bg-blue-400/80 animate-pulse" />
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>

                  {/* Controls Overlay */}
                  <div className="absolute bottom-6 left-0 right-0 flex justify-center z-20">
                    <Button
                      onClick={endCall}
                      size="lg"
                      className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 shadow-[0_5px_20px_-5px_rgba(239,68,68,0.5)] transition-all hover:scale-110 active:scale-95 border-4 border-slate-900"
                    >
                      <IconPhoneOff className="w-7 h-7 text-white" />
                    </Button>
                  </div>
                </div>
              )}

              {callState === "ended" && (
                <div className="flex-1 flex flex-col items-center justify-center overflow-y-auto py-4 animate-in fade-in zoom-in-95 duration-500 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
                  <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center border border-white/10 mb-6">
                    <IconPhoneOff className="w-10 h-10 text-slate-400" />
                  </div>

                  <h2 className="text-2xl font-bold text-white mb-2">
                    কল সম্পন্ন হয়েছে
                  </h2>
                  <div className="flex items-center gap-3 text-sm text-slate-400 mb-8 bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
                    <span>{formatDuration(callDuration)}</span>
                    {session && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-slate-600" />
                        <span>Code: {session.sessionCode}</span>
                      </>
                    )}
                  </div>

                  {/* Extracted Data Summary */}
                  {extractedData && Object.keys(extractedData).length > 0 && (
                    <Card className="w-full bg-black/20 border-white/10 overflow-hidden backdrop-blur-md mb-6">
                      <div className="h-1 bg-gradient-to-r from-emerald-500 to-blue-500 w-full" />
                      <CardContent className="p-5">
                        <h3 className="text-sm font-medium text-emerald-400 mb-4 flex items-center gap-2">
                          <IconUser className="w-4 h-4" />
                          সংগৃহীত তথ্যসমূহ
                        </h3>
                        <div className="grid grid-cols-1 gap-3 text-sm">
                          {[
                            { label: "নাম", value: extractedData.name },
                            {
                              label: "পিতার নাম",
                              value: extractedData.fatherName,
                            },
                            { label: "জেলা", value: extractedData.district },
                            { label: "উপজেলা", value: extractedData.upazila },
                            { label: "গ্রাম", value: extractedData.village },
                            {
                              label: "ক্ষতির ধরন",
                              value: extractedData.incidentType,
                            },
                            {
                              label: "ক্ষতি",
                              value: extractedData.lossAmount
                                ? `${extractedData.lossAmount.toLocaleString(
                                    "bn-BD"
                                  )} টাকা`
                                : null,
                            },
                          ].map(
                            (item, i) =>
                              item.value && (
                                <div
                                  key={i}
                                  className="flex justify-between items-center py-2 border-b border-white/5 last:border-0 hover:bg-white/5 px-2 rounded transition-colors"
                                >
                                  <span className="text-slate-500 text-xs">
                                    {item.label}
                                  </span>
                                  <span className="text-slate-200 font-medium text-right">
                                    {item.value}
                                  </span>
                                </div>
                              )
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Button
                    onClick={resetCall}
                    variant="outline"
                    className="border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white backdrop-blur-sm rounded-full px-8"
                  >
                    নতুন কল করুন
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add type declarations for Web Speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: ((this: SpeechRecognition, ev: Event) => unknown) | null;
  onresult:
    | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => unknown)
    | null;
  onerror:
    | ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => unknown)
    | null;
  onend: ((this: SpeechRecognition, ev: Event) => unknown) | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}
