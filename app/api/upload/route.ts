import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { generateWithFallback } from '@/lib/gemini-client';

const pdfParseLib = require('pdf-parse');

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const apiKey = formData.get('apiKey') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let extractedText = '';

    const fileNameLower = file.name.toLowerCase();
    const isPdf = file.type === 'application/pdf' || fileNameLower.endsWith('.pdf');

    if (isPdf) {
      try {
        if (pdfParseLib.PDFParse) {
          const parser = new pdfParseLib.PDFParse({ 
            data: new Uint8Array(buffer),
            disableFontFace: true,
            isEvalSupported: false,
          });
          const textResult = await parser.getText();
          extractedText = textResult?.text || '';
          if (parser.destroy) {
            await parser.destroy();
          }
        } else if (typeof pdfParseLib === 'function') {
          const data = await pdfParseLib(buffer);
          extractedText = data?.text || '';
        } else if (typeof pdfParseLib.default === 'function') {
          const data = await pdfParseLib.default(buffer);
          extractedText = data?.text || '';
        }
      } catch {
        extractedText = '';
      }

      // If class-based parser returned empty or couldn't run, extract from PDF text blocks & streams
      if (!extractedText || !extractedText.trim()) {
        const raw = buffer.toString('latin1');
        const textMatches: string[] = [];

        // 1. Text blocks: (text) Tj
        const tjRegex = /\(([^)]+)\)\s*T[jJ]/g;
        let match;
        while ((match = tjRegex.exec(raw)) !== null) {
          if (match[1] && match[1].trim().length > 0) {
            textMatches.push(match[1].replace(/\\([()\\])/g, '$1'));
          }
        }

        // 2. Bracketed text arrays: [(t1) 20 (t2)] TJ
        const bracketRegex = /\[(.*?)\]\s*TJ/g;
        while ((match = bracketRegex.exec(raw)) !== null) {
          const subMatches = match[1].match(/\(([^)]+)\)/g);
          if (subMatches) {
            const reconstructed = subMatches
              .map(s => s.slice(1, -1).replace(/\\([()\\])/g, '$1'))
              .join('');
            if (reconstructed.trim()) {
              textMatches.push(reconstructed);
            }
          }
        }

        if (textMatches.length >= 2) {
          extractedText = textMatches.join(' ');
        } else {
          // 3. Fallback: extract clean human-readable words (>= 4 chars, ASCII)
          const printable = raw.match(/[A-Za-z0-9,.:;?!'’"()\-\s]{4,}/g) || [];
          extractedText = printable
            .map(s => s.trim())
            .filter(s => s.length > 3 && !s.startsWith('/') && !s.includes('Obj') && !s.includes('endobj') && !s.includes('xref'))
            .join(' ');
        }
      }
    } else {
      // Text, Markdown, CSV, Notes
      extractedText = buffer.toString('utf-8');
    }

    if (!extractedText.trim()) {
      return NextResponse.json({ error: 'Could not extract text from file. Please ensure the file contains readable text.' }, { status: 400 });
    }

    const prompt = `Convert the following notes into 5 to 7 high-impact study flashcards. Keep definitions clear and punchy.
JSON format only:
[{"front": "concept or question", "back": "concise answer"}]

Notes:
${extractedText.substring(0, 10000)}`;

    let parsedCards = [];

    const userAi = new GoogleGenAI({
      apiKey: apiKey || process.env.GEMINI_API_KEY,
    });
    const config = {
      responseMimeType: "application/json",
      temperature: 0.2,
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            front: { type: Type.STRING },
            back: { type: Type.STRING },
          },
          required: ["front", "back"],
        },
      },
    };

    const response = await generateWithFallback(userAi, {
      contents: prompt,
      config,
      preferredModel: "gemini-3.1-flash-lite"
    });
    parsedCards = JSON.parse(response.text || "[]");

    const title = file.name.replace(/\.[^/.]+$/, "") + " Flashcards";

    return NextResponse.json({ 
      success: true,
      title,
      cards: parsedCards
    });

  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process file' }, { status: 500 });
  }
}
