import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

interface HistoryMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

interface ChatRequestBody {
  systemPrompt: string;
  history: HistoryMessage[];
  userMessage: string;
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing Gemini API key' }, { status: 500 });
    }

    const body: ChatRequestBody = await request.json();
    const { systemPrompt, history, userMessage } = body;

    if (!userMessage?.trim()) {
      return NextResponse.json({ error: 'userMessage is required' }, { status: 400 });
    }

    const genai = new GoogleGenAI({ apiKey });

    const contents = [
      ...history,
      { role: 'user' as const, parts: [{ text: userMessage }] },
    ];

    const response = await genai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents,
      config: { systemInstruction: systemPrompt },
    });

    const text = response.text ?? '';
    return NextResponse.json({ text });
  } catch (err) {
    console.error('[chat/route] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
