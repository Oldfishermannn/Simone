import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

const VISION_PROMPT = `你是 DJ Cyber 的视觉分析模块。看这张桌面截图，分析场景和氛围，推荐实时背景音乐。

输出格式：
1. 中文写 1-2 句场景描述
2. 输出 JSON 参数块（prompts 支持多个混合叠加）：

\`\`\`json
{
  "prompts": [
    {"text": "主风格：流派+乐器+质感", "weight": 1.0},
    {"text": "氛围叠加", "weight": 0.5}
  ],
  "config": {
    "bpm": 90,
    "temperature": 1.1,
    "guidance": 4.0,
    "density": 0.4,
    "brightness": 0.5
  },
  "action": "play"
}
\`\`\`

场景→音乐映射：
- 代码/终端 → "Chill lo-fi hip hop with warm Rhodes piano and vinyl crackle" + "Ambient downtempo with soft synth pads"，BPM 70-85，低 density
- 游戏画面 → "Energetic EDM with pulsing synths and driving drums" 或 epic orchestral，BPM 128-160，高 density
- 视频/电影 → "Cinematic orchestral with soaring strings and French horn"，BPM 根据画面节奏
- 社交/聊天 → "Upbeat indie pop with bright acoustic guitar and claps"，BPM 100-120
- 设计工具 → "Minimal techno with sparse percussion and atmospheric synths"，BPM 90-110
- 空桌面/壁纸 → 根据色调：暖色→warm ambient，冷色→ethereal electronic，暗色→deep drone

规则：
- prompts.text 必须英文，包含【流派+乐器+质感】三层信息
- 画面暗→brightness 低(0.2-0.4)，亮→高(0.6-0.8)
- 内容简洁→density 低(0.2-0.4)，复杂→高(0.5-0.7)
- ⚠️ config 中禁止 scale、music_generation_mode、seed 字段`;

export async function POST(request: Request) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 500 });
    }

    const { imageBase64 } = await request.json();
    if (!imageBase64) {
      return NextResponse.json({ error: 'imageBase64 is required' }, { status: 400 });
    }

    const genai = new GoogleGenAI({ apiKey });

    const models = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];
    let lastError = '';

    for (const model of models) {
      try {
        const response = await genai.models.generateContent({
          model,
          contents: [{
            role: 'user',
            parts: [
              { text: VISION_PROMPT },
              { inlineData: { mimeType: 'image/png', data: imageBase64 } },
            ],
          }],
        });
        const text = response.text ?? '';
        return NextResponse.json({ text, model });
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        if (lastError.includes('503') || lastError.includes('UNAVAILABLE') || lastError.includes('404') || lastError.includes('no longer available')) {
          continue;
        }
        return NextResponse.json({ error: lastError }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'All models unavailable: ' + lastError }, { status: 503 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
