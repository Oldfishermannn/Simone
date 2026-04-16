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

async function callClaude(
  apiKey: string,
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
): Promise<{ text: string; model: string }> {
  const client = new Anthropic({ apiKey });
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
  return { text, model: response.model };
}

async function callGemini(
  apiKey: string,
  systemPrompt: string,
  history: HistoryMessage[],
  userMessage: string,
): Promise<{ text: string; model: string }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const contents = [
    ...history.map(msg => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: msg.parts,
    })),
    { role: 'user', parts: [{ text: userMessage }] },
  ];
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents,
    }),
  });
  if (!res.ok) {
    throw new Error(`Gemini API error: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p: { text: string }) => p.text).join('') || '';
  return { text, model: 'gemini-2.0-flash' };
}

function isOverloaded(err: unknown): boolean {
  if (err instanceof Anthropic.APIError && err.status === 529) return true;
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes('overloaded') || msg.includes('529');
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function POST(request: Request) {
  try {
    const body: ChatRequestBody = await request.json();
    const { systemPrompt, history, userMessage } = body;

    if (!userMessage?.trim()) {
      return NextResponse.json({ error: 'userMessage is required' }, { status: 400 });
    }

    // Build Claude message format
    const claudeMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    for (const msg of history) {
      claudeMessages.push({
        role: msg.role === 'model' ? 'assistant' : 'user',
        content: msg.parts.map(p => p.text).join(''),
      });
    }
    claudeMessages.push({ role: 'user', content: userMessage });

    // Try Claude with retry
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (anthropicKey) {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const result = await callClaude(anthropicKey, systemPrompt, claudeMessages);
          return NextResponse.json(result);
        } catch (err) {
          if (isOverloaded(err) && attempt < 2) {
            console.log(`[chat] Claude overloaded, retry ${attempt + 1}/2...`);
            await sleep(1000 * (attempt + 1));
            continue;
          }
          if (!isOverloaded(err)) throw err;
          console.log('[chat] Claude overloaded after 3 attempts, falling back to Gemini');
          break;
        }
      }
    }

    // Fallback to Gemini
    const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (geminiKey) {
      const result = await callGemini(geminiKey, systemPrompt, history, userMessage);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'All AI providers unavailable' }, { status: 503 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[chat/route] error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
