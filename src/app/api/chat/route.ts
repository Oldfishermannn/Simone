import Anthropic from '@anthropic-ai/sdk';
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
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing ANTHROPIC_API_KEY' }, { status: 500 });
    }

    const body: ChatRequestBody = await request.json();
    const { systemPrompt, history, userMessage } = body;

    if (!userMessage?.trim()) {
      return NextResponse.json({ error: 'userMessage is required' }, { status: 400 });
    }

    const client = new Anthropic({ apiKey });

    // Convert Gemini history format to Claude format
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    for (const msg of history) {
      messages.push({
        role: msg.role === 'model' ? 'assistant' : 'user',
        content: msg.parts.map(p => p.text).join(''),
      });
    }
    messages.push({ role: 'user', content: userMessage });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    const text = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('');

    return NextResponse.json({ text, model: response.model });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[chat/route] error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
