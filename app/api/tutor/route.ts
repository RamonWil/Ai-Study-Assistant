import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { generateWithFallback } from "@/lib/gemini-client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, tutorPersona, subject, studentName, studentLevel, isGamified, apiKey } = body;

    let systemInstruction = `You are an AI study assistant acting as the persona: ${tutorPersona}. 
Your goal is to help the student (Name: ${studentName || 'Student'}, Level/Grade: ${studentLevel || 'Not specified'}) learn the subject: ${subject}.
Keep your answers educational, encouraging, and interactive. 
Adapt your explanation depth and tone to their specified level.
Format your responses using clean markdown.`;

    if (isGamified) {
      systemInstruction += `

CRITICAL INSTRUCTIONS FOR GAMIFIED MODE:
You are in Gamified Challenge Mode. You must actively test the student's knowledge.
1. End your response by asking a specific, single-concept question about the subject.
2. When the student answers your previous question, you MUST evaluate their answer.
3. If their answer is correct, you MUST include the exact string "[RESULT: CORRECT]" anywhere in your response.
4. If their answer is incorrect or partially incorrect, you MUST include the exact string "[RESULT: INCORRECT]" anywhere in your response.
5. Provide a brief, encouraging explanation of why they were right or wrong.
6. Then, immediately ask the NEXT question to keep the game going.
7. Keep your responses short, punchy, and highly engaging. Use emojis!`;
    } else {
      systemInstruction += `
If they ask questions, provide clear, concise explanations and ask follow-up questions to check their understanding.
Do not just give the answers outright for homework; guide them to the solution.`;
    }

    const userAi = new GoogleGenAI({
      apiKey: apiKey || process.env.GEMINI_API_KEY,
    });

    const contents = messages.map((m: any) => ({
      role: m.role,
      parts: [{ text: m.content }]
    }));

    const config = {
      systemInstruction,
      temperature: 0.7,
    };

    const response = await generateWithFallback(userAi, {
      contents,
      config,
      preferredModel: "gemini-flash-latest"
    });

    return NextResponse.json({ text: response.text });
  } catch (error: any) {
    console.error("Tutor API Error:", error);
    const errorMessage = error?.status === 400 || error?.status === 403 || error?.message?.includes('API_KEY_INVALID')
      ? "Invalid Gemini API Key. Please verify your key or leave blank to use the default."
      : (error?.message || "The AI is currently under high demand. Please try asking again in a moment.");
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
