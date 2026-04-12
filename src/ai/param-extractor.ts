import type { BandMember, ChatMessage, LyriaParams } from '@/types';

const DEFAULT_PARAMS: LyriaParams = {
  stylePrompt: 'energetic rock band with drums, bass, guitar, keys, and vocals',
  bpm: 120,
  scale: 'C',
  temperature: 0.8,
  density: 0.7,
  brightness: 0.7,
  guidance: 3.5,
};

const SYSTEM_PROMPT = `You are a music parameter extractor. Given a chat conversation between a user and band members, extract music generation parameters.

Output ONLY valid JSON with these fields (no markdown, no explanation):
{
  "stylePrompt": "string describing the music style, mood, instruments, genre",
  "bpm": number (60-200),
  "scale": "string key like C, Am, D, G, Em, F, Bb",
  "temperature": number (0.1-1.0, higher = more creative),
  "density": number (0.1-1.0, higher = more notes/instruments),
  "brightness": number (0.1-1.0, higher = brighter tone),
  "guidance": number (1.0-5.0, higher = closer to prompt)
}

Infer the style from what the band members discussed. If they talked about rock, make it rock. If jazz, make it jazz. Capture the mood and energy level in bpm and density.`;

/**
 * Extract Lyria music params from chat history via Gemini
 */
export async function extractLyriaParams(
  messages: ChatMessage[],
  members: BandMember[],
): Promise<LyriaParams> {
  try {
    // Build a summary of recent chat
    const recent = messages.slice(-20);
    const memberMap = new Map(members.map((m) => [m.id, m]));

    const chatSummary = recent
      .filter((m) => m.characterId !== 'system')
      .map((m) => {
        if (m.characterId === 'user') return `User: ${m.text}`;
        const member = memberMap.get(m.characterId);
        const name = member?.name ?? m.characterId;
        return `${name} (${member?.instrument ?? '?'}): ${m.text}`;
      })
      .join('\n');

    const memberInfo = members
      .map((m) => `${m.name} - ${m.instrument} - ${m.musicPreference}`)
      .join('\n');

    const userMessage = `Band members:\n${memberInfo}\n\nRecent chat:\n${chatSummary}\n\nExtract the music parameters as JSON.`;

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemPrompt: SYSTEM_PROMPT,
        history: [],
        userMessage,
      }),
    });

    if (!res.ok) throw new Error(`API error ${res.status}`);

    const data = await res.json();
    const text: string = data.text ?? '';

    // Try to parse JSON from response (handle possible markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');

    const parsed = JSON.parse(jsonMatch[0]) as Partial<LyriaParams>;

    return {
      stylePrompt: parsed.stylePrompt || DEFAULT_PARAMS.stylePrompt,
      bpm: clamp(parsed.bpm ?? DEFAULT_PARAMS.bpm, 60, 200),
      scale: parsed.scale || DEFAULT_PARAMS.scale,
      temperature: clamp(parsed.temperature ?? DEFAULT_PARAMS.temperature, 0.1, 1.0),
      density: clamp(parsed.density ?? DEFAULT_PARAMS.density, 0.1, 1.0),
      brightness: clamp(parsed.brightness ?? DEFAULT_PARAMS.brightness, 0.1, 1.0),
      guidance: clamp(parsed.guidance ?? DEFAULT_PARAMS.guidance, 1.0, 5.0),
    };
  } catch (err) {
    console.error('[extractLyriaParams] Falling back to defaults:', err);
    return { ...DEFAULT_PARAMS };
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
