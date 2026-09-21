import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { generateWithFallback } from "@/lib/gemini-client";

export async function POST(req: NextRequest) {
  try {
    const { subject, difficulty, numQuestions = 3, apiKey } = await req.json();

    const prompt = `Generate a short multiple-choice quiz about ${subject} at a ${difficulty} difficulty level. Create exactly ${numQuestions} questions. Make them engaging.`;

    const userAi = new GoogleGenAI({
      apiKey: apiKey || process.env.GEMINI_API_KEY,
    });

    const config = {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: {
              type: Type.STRING,
              description: "The quiz question.",
            },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "4 possible answer options.",
            },
            correctAnswer: {
              type: Type.STRING,
              description: "The exact string of the correct option.",
            },
            explanation: {
              type: Type.STRING,
              description: "A brief, encouraging explanation of why the answer is correct.",
            },
          },
          required: ["question", "options", "correctAnswer", "explanation"],
        },
      },
    };

    const response = await generateWithFallback(userAi, {
      contents: prompt,
      config,
      preferredModel: "gemini-flash-latest"
    });

    const quizData = JSON.parse(response.text || "[]");
    return NextResponse.json({ quiz: quizData });
  } catch (error: any) {
    console.error("Quiz API Error:", error);
    const errorMessage = error?.status === 400 || error?.status === 403 || error?.message?.includes('API_KEY_INVALID')
      ? "Invalid Gemini API Key. Please check your key or leave blank."
      : (error?.message || "Failed to generate quiz. Please try again.");
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
