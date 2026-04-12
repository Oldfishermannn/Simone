import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';
import type { BandMember, LyriaParams, ChatMessage, SheetPart } from '@/types';

interface GenerateSheetRequestBody {
  members: BandMember[];
  lyriaParams: LyriaParams;
  chatHistory: ChatMessage[];
}

const SKILL_LEVEL_GUIDE: Record<string, string> = {
  beginner: '初学者：使用简单的开放和弦（如 C, G, Am, F, D, E），避免复杂的转位和弦和延伸音',
  intermediate: '中级：可以使用七和弦（maj7, m7, dom7）、挂留和弦（sus2, sus4）和简单的转位',
  advanced: '高级：可以使用九和弦、十一和弦、转位和弦，以及爵士和声进行',
  professional: '专业：可以使用复杂的延伸音（9th, 11th, 13th）、变化和弦、复杂转位和多调性手法',
};

function buildSystemPrompt(members: BandMember[], params: LyriaParams): string {
  const memberList = members
    .map((m) => {
      const skillGuide = SKILL_LEVEL_GUIDE[m.skillLevel] || SKILL_LEVEL_GUIDE.intermediate;
      return `- ${m.name}（${m.instrument}，${m.skillLevel}）: ${skillGuide}`;
    })
    .join('\n');

  return `你是一位专业的编曲师，负责为赛博乐队生成演奏谱。

乐队成员：
${memberList}

音乐参数：
- 风格: ${params.stylePrompt}
- BPM: ${params.bpm}
- 调式/音阶: ${params.scale}
- 情绪密度: ${params.density}（0-1，影响和弦复杂度和节奏密度）
- 亮度: ${params.brightness}（0-1，影响大小调色彩）

要求：
1. 为每位乐队成员生成一份演奏部分（SheetPart）
2. 根据每位成员的技能等级调整和弦复杂度
3. 和弦进行要符合音乐理论，与风格/调式匹配
4. rhythmDescription 描述该乐器的节奏型和演奏方式
5. playingTips 提供针对该成员技能等级的具体演奏建议
6. barCount 设置为 8 或 16（根据音乐复杂度决定）
7. chords 数组长度必须等于 barCount

严格按照以下 JSON 格式输出，不要包含任何其他文字、markdown 代码块或注释：
[
  {
    "characterId": "成员id",
    "instrument": "乐器英文名",
    "chords": ["和弦1", "和弦2", ...],
    "barCount": 8,
    "rhythmDescription": "节奏描述",
    "playingTips": "演奏技巧",
    "key": "调名",
    "bpm": ${params.bpm},
    "timeSignature": "4/4"
  }
]`;
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing Gemini API key' }, { status: 500 });
    }

    const body: GenerateSheetRequestBody = await request.json();
    const { members, lyriaParams, chatHistory } = body;

    if (!members?.length) {
      return NextResponse.json({ error: 'members is required' }, { status: 400 });
    }

    const genai = new GoogleGenAI({ apiKey });

    const systemPrompt = buildSystemPrompt(members, lyriaParams);

    // Build context from chat history (last 10 non-system messages)
    const recentChat = chatHistory
      .filter((m) => m.characterId !== 'system')
      .slice(-10)
      .map((m) => {
        const role = m.characterId === 'user' ? '用户' : m.characterId;
        return `${role}: ${m.text}`;
      })
      .join('\n');

    const userMessage = recentChat
      ? `根据以下乐队对话，为每位成员生成演奏谱：\n\n${recentChat}\n\n请生成完整的 JSON 数组。`
      : '请为乐队每位成员生成演奏谱，输出 JSON 数组。';

    const response = await genai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      config: { systemInstruction: systemPrompt },
    });

    const rawText = response.text ?? '';

    // Strip markdown code fences if present
    const jsonText = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();

    let sheetParts: SheetPart[];
    try {
      sheetParts = JSON.parse(jsonText) as SheetPart[];
    } catch {
      console.error('[generate-sheet] JSON parse error. Raw:', rawText);
      return NextResponse.json(
        { error: 'Failed to parse sheet music JSON', raw: rawText },
        { status: 500 }
      );
    }

    return NextResponse.json({ sheetParts });
  } catch (err) {
    console.error('[generate-sheet/route] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
