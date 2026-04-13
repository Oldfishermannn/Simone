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

    const models = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash-lite'];
    let lastError = '';

    for (const model of models) {
      try {
        const response = await genai.models.generateContent({
          model,
          contents,
          config: { systemInstruction: systemPrompt },
        });
        const text = response.text ?? '';
        return NextResponse.json({ text, model });
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        console.error(`[chat/route] ${model} failed:`, lastError);
        if (lastError.includes('503') || lastError.includes('UNAVAILABLE') || lastError.includes('overloaded') || lastError.includes('404') || lastError.includes('no longer available')) {
          continue;
        }
        return NextResponse.json({ error: lastError }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'All models unavailable: ' + lastError }, { status: 503 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[chat/route] error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
