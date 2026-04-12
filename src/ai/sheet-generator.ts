import type { BandMember, LyriaParams, ChatMessage, SheetPart } from '@/types';

export async function generateSheetMusic(
  members: BandMember[],
  params: LyriaParams,
  messages: ChatMessage[]
): Promise<SheetPart[]> {
  const res = await fetch('/api/generate-sheet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      members,
      lyriaParams: params,
      chatHistory: messages,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error ?? `generate-sheet API error ${res.status}`);
  }

  const data = await res.json();
  return data.sheetParts as SheetPart[];
}
