export interface PoolElement {
  id: string;
  label: string;
  category: 'mood' | 'style' | 'scene' | 'texture';
  prompt: string;
  weight: number;
  genre?: string; // for background color inference
}

export const CATEGORIES = [
  { id: 'mood', label: '情绪' },
  { id: 'style', label: '风格' },
  { id: 'scene', label: '场景' },
  { id: 'texture', label: '质感' },
] as const;

export const POOL_ELEMENTS: PoolElement[] = [
  // ─── 情绪 ───
  { id: 'chill', label: 'Chill', category: 'mood', weight: 0.6,
    prompt: 'Chill lo-fi with warm Rhodes piano and soft boom-bap drums' },
  { id: 'sad', label: '悲伤', category: 'mood', weight: 0.6,
    prompt: 'Melancholic piano ballad with soft cello and gentle strings' },
  { id: 'happy', label: '开心', category: 'mood', weight: 0.6,
    prompt: 'Upbeat feel-good groove with bright acoustic guitar and hand claps' },
  { id: 'energetic', label: '热血', category: 'mood', weight: 0.6,
    prompt: 'High-energy driving rhythm with distorted electric guitar and pounding drums' },
  { id: 'dreamy', label: '梦幻', category: 'mood', weight: 0.6,
    prompt: 'Dreamy ethereal soundscape with shimmering synth pads and soft vibraphone' },
  { id: 'focus', label: '专注', category: 'mood', weight: 0.6,
    prompt: 'Minimal ambient focus music with soft piano and gentle white noise texture' },

  // ─── 风格 ───
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

  // ─── 场景 ───
  { id: 'rain', label: '下雨', category: 'scene', weight: 0.6,
    prompt: 'Ambient rain atmosphere with gentle piano and muted vibraphone' },
  { id: 'night', label: '深夜', category: 'scene', weight: 0.6,
    prompt: 'Late night mood with dark analog pads and sparse piano notes' },
  { id: 'cafe', label: '咖啡馆', category: 'scene', weight: 0.6,
    prompt: 'Coffee shop ambience with warm acoustic guitar and soft upright bass' },
  { id: 'driving', label: '开车', category: 'scene', weight: 0.6,
    prompt: 'Driving music with steady bass guitar and rhythmic hi-hats' },
  { id: 'sunset', label: '日落', category: 'scene', weight: 0.6,
    prompt: 'Golden hour sunset vibe with warm slide guitar and steel drums' },
  { id: 'study', label: '学习', category: 'scene', weight: 0.6,
    prompt: 'Study music with minimal piano and soft ambient synth pads' },

  // ─── 质感 ───
  { id: 'warm', label: '温暖', category: 'texture', weight: 0.4,
    prompt: 'Warm saturated tape texture with analog organ and soft strings' },
  { id: 'bright', label: '明亮', category: 'texture', weight: 0.4,
    prompt: 'Bright sparkling texture with clean electric guitar and marimba' },
  { id: 'dark', label: '暗沉', category: 'texture', weight: 0.4,
    prompt: 'Dark brooding atmosphere with deep cello and rumbling sub bass' },
  { id: 'spacious', label: '空灵', category: 'texture', weight: 0.4,
    prompt: 'Spacious reverberant texture with ethereal flute and shimmering harpsichord' },
];

export function getElementById(id: string): PoolElement | undefined {
  return POOL_ELEMENTS.find(e => e.id === id);
}

export function buildPromptsFromPool(activeIds: string[]): Array<{ text: string; weight: number }> {
  return activeIds
    .map(id => getElementById(id))
    .filter((e): e is PoolElement => !!e)
    .map(e => ({ text: e.prompt, weight: e.weight }));
}

export function inferGenreFromPool(activeIds: string[]): string | null {
  // Find the first style-category element with a genre
  for (const id of activeIds) {
    const el = getElementById(id);
    if (el?.genre) return el.genre;
  }
  return null;
}
