import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

// Safe, lazy initialization of GoogleGenAI
let aiInstance: GoogleGenAI | null = null;

function getGemini(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required.");
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

export async function POST(req: NextRequest) {
  try {
    const { action, text, traits, tone } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY environment variable is missing on the server secrets panel." },
        { status: 500 }
      );
    }

    const ai = getGemini();

    if (action === "polish") {
      if (!text || typeof text !== "string") {
        return NextResponse.json({ error: "Draft wish content must be provided." }, { status: 400 });
      }

      const promptText = `Elevate the following rough message into a deeply heartfelt, premium, warm, vibrant, and highly polished celebration wish for an extraordinary person named Theresa who loves bright vibrant colors like purple, teal, orange, green, and burgundy, and has a lively spirit. Keep the core intent but make the vocabulary elegant and flowing. Keep it to 2 or 3 sentences max, and make it sound authentic and mature. Avoid cheesy greeting-card cliches. Here is the draft: "${text}"`;
      const systemInstruction = "You are an expert celebratory poet and professional letter writer. You craft gorgeous, deeply emotional sentiments for milestone celebrations.";

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptText,
        config: {
          systemInstruction,
          temperature: 0.85,
        },
      });

      const processed = (response.text || "").replace(/^["']|["']$/g, "").trim();
      return NextResponse.json({ text: processed });
    } 
    
    if (action === "poem") {
      if (!traits || typeof traits !== "string") {
        return NextResponse.json({ error: "Personalized traits must be provided to compose a poem." }, { status: 400 });
      }

      const promptText = `Compose a stunning, high-quality, personalized poem celebrating Theresa. 
      Incorporate these themes, details, or traits: ${traits}. 
      Make the overall tone and style of the poem: ${tone || "elegant & poetic"}. 
      The poem should consist of 3 distinct, elegantly crafted stanzas. Avoid basic rhyming structures; aim for beautiful free-verse or warm rhythmic lyricism. Do not output any conversational introduction, metadata, or markdown title headers, just start directly with the poem text. Use line breaks where appropriate.`;
      
      const systemInstruction = "You are a master poet specializing in elegant, high-literature tributed milestones. Your poetry is reminiscent of romantic and classic poetry with visual depth.";

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptText,
        config: {
          systemInstruction,
          temperature: 0.9,
        },
      });

      return NextResponse.json({ text: response.text || "" });
    }

    return NextResponse.json({ error: "Invalid action type provided." }, { status: 400 });

  } catch (error: any) {
    console.error("Gemini API server route error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal AI API service error." },
      { status: 500 }
    );
  }
}
