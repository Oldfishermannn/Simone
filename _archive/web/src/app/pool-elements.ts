export interface PoolElement {
  id: string;
  label: string;
  category: 'style' | 'mood' | 'scene' | 'texture';
  prompt: string;
  weight: number;
  genre?: string; // for background color inference
}

// 风格在最前面，必须先选
export const CATEGORIES = [
  { id: 'style', label: '风格', required: true },
  { id: 'mood', label: '情绪', required: false },
  { id: 'scene', label: '场景', required: false },
  { id: 'texture', label: '质感', required: false },
] as const;

export const POOL_ELEMENTS: PoolElement[] = [
  // ─── 风格（主 prompt，必选一个）───
  { id: 'jazz', label: '爵士', category: 'style', weight: 1.0, genre: 'jazz',
    prompt: 'Smooth jazz with walking upright bass and brushed drums' },
  { id: 'lofi', label: 'Lo-Fi', category: 'style', weight: 1.0, genre: 'lofi',
    prompt: 'Lo-fi hip hop with dusty vinyl crackle and mellow Rhodes piano' },
  { id: 'electronic', label: '电子', category: 'style', weight: 1.0, genre: 'electronic',
    prompt: 'Electronic music with analog Moog synths and TR-909 drums' },
  { id: 'funk', label: '放克', category: 'style', weight: 1.0, genre: 'funk',
    prompt: 'Funky groove with slap bass guitar and tight clavinet riffs' },
  { id: 'rnb', label: 'R&B', category: 'style', weight: 1.0, genre: 'rnb',
    prompt: 'Smooth R&B with warm electric piano and deep 808 bass' },
  { id: 'rock', label: '摇滚', category: 'style', weight: 1.0, genre: 'rock',
    prompt: 'Rock with overdriven electric guitar and powerful drum kit' },
  { id: 'ambient', label: 'Ambient', category: 'style', weight: 1.0, genre: 'chill',
    prompt: 'Ambient music with ethereal synth pads and gentle arpeggiated piano' },
  { id: 'bossa', label: '波萨诺瓦', category: 'style', weight: 1.0, genre: 'jazz',
    prompt: 'Bossa nova with nylon acoustic guitar and soft brushed snare' },

  // ─── 情绪（子 prompt，修饰词，不带乐器）───
  { id: 'chill', label: 'Chill', category: 'mood', weight: 0.3,
    prompt: 'relaxed chill laid-back vibe' },
  { id: 'sad', label: '悲伤', category: 'mood', weight: 0.3,
    prompt: 'melancholic sad emotional feeling' },
  { id: 'happy', label: '开心', category: 'mood', weight: 0.3,
    prompt: 'upbeat happy feel-good cheerful' },
  { id: 'energetic', label: '热血', category: 'mood', weight: 0.3,
    prompt: 'high-energy intense driving powerful' },
  { id: 'dreamy', label: '梦幻', category: 'mood', weight: 0.3,
    prompt: 'dreamy ethereal floating weightless' },
  { id: 'focus', label: '专注', category: 'mood', weight: 0.3,
    prompt: 'minimal focused calm steady' },

  // ─── 场景（子 prompt，氛围描述）───
  { id: 'rain', label: '下雨', category: 'scene', weight: 0.3,
    prompt: 'rainy atmosphere gentle and muted' },
  { id: 'night', label: '深夜', category: 'scene', weight: 0.3,
    prompt: 'late night dark moody sparse' },
  { id: 'cafe', label: '咖啡馆', category: 'scene', weight: 0.3,
    prompt: 'cozy coffee shop warm intimate' },
  { id: 'driving', label: '开车', category: 'scene', weight: 0.3,
    prompt: 'driving steady rhythmic cruising' },
  { id: 'sunset', label: '日落', category: 'scene', weight: 0.3,
    prompt: 'golden hour warm sunset glow' },
  { id: 'study', label: '学习', category: 'scene', weight: 0.3,
    prompt: 'study background quiet unobtrusive' },

  // ─── 质感（子 prompt，音色修饰）───
  { id: 'warm', label: '温暖', category: 'texture', weight: 0.2,
    prompt: 'warm saturated analog tape' },
  { id: 'bright', label: '明亮', category: 'texture', weight: 0.2,
    prompt: 'bright sparkling crisp clean' },
  { id: 'dark', label: '暗沉', category: 'texture', weight: 0.2,
    prompt: 'dark deep brooding low-end' },
  { id: 'spacious', label: '空灵', category: 'texture', weight: 0.2,
    prompt: 'spacious reverberant airy open' },
];

export function getElementById(id: string): PoolElement | undefined {
  return POOL_ELEMENTS.find(e => e.id === id);
}

export function hasStyleSelected(activeIds: string[]): boolean {
  return activeIds.some(id => getElementById(id)?.category === 'style');
}

export function buildPromptsFromPool(activeIds: string[]): Array<{ text: string; weight: number }> {
  const elements = activeIds
    .map(id => getElementById(id))
    .filter((e): e is PoolElement => !!e);

  // 风格是主 prompt
  const style = elements.find(e => e.category === 'style');
  if (!style) return [];

  // 子 prompt 只是修饰词，拼接到风格后面
  const modifiers = elements
    .filter(e => e.category !== 'style')
    .map(e => e.prompt)
    .join(', ');

  const fullPrompt = modifiers
    ? `${style.prompt}, ${modifiers}`
    : style.prompt;

  return [{ text: fullPrompt, weight: 1.0 }];
}

export function inferGenreFromPool(activeIds: string[]): string | null {
  // Find the first style-category element with a genre
  for (const id of activeIds) {
    const el = getElementById(id);
    if (el?.genre) return el.genre;
  }
  return null;
}
