'use client';

interface Props {
  onSelect: (genre: string, prompt: string) => void;
  activeGenre?: string;
  activeTag?: string;
}

interface Tag {
  id: string;
  label: string;
  prompt: string;
}

const MOODS: Tag[] = [
  { id: 'chill', label: 'Chill', prompt: '我现在想放松一下，来点 Chill 的音乐' },
  { id: 'relaxed', label: '放松', prompt: '来点让人彻底放松的音乐' },
  { id: 'energetic', label: '元气', prompt: '我需要充满能量的音乐！' },
  { id: 'melancholy', label: '忧郁', prompt: '有点伤感，来点忧郁的音乐' },
  { id: 'happy', label: '开心', prompt: '心情很好，来点快乐的音乐' },
  { id: 'focused', label: '专注', prompt: '需要高度专注，来点帮助集中注意力的音乐' },
];

const GENRES: Tag[] = [
  { id: 'jazz', label: 'Jazz', prompt: '来段爵士乐' },
  { id: 'rock', label: 'Rock', prompt: '来点摇滚' },
  { id: 'electronic', label: 'Electronic', prompt: '来段电子音乐' },
  { id: 'lofi', label: 'Lo-Fi', prompt: '来点 Lo-Fi' },
  { id: 'funk', label: 'Funk', prompt: '来段 Funk' },
  { id: 'rnb', label: 'R&B', prompt: '来点 R&B' },
];

const SCENES: Tag[] = [
  { id: 'study', label: '学习', prompt: '我在学习，来点适合学习的背景音乐' },
  { id: 'work', label: '工作', prompt: '工作中，来点提升效率的音乐' },
  { id: 'commute', label: '通勤', prompt: '通勤路上，来点路上听的音乐' },
  { id: 'reading', label: '阅读', prompt: '在看书，来点适合阅读的安静音乐' },
  { id: 'party', label: '派对', prompt: '派对时间！来点嗨的' },
  { id: 'sleep', label: '助眠', prompt: '准备睡觉了，来点助眠音乐' },
];

const SECTIONS: { label: string; items: Tag[] }[] = [
  { label: '心情', items: MOODS },
  { label: '风格', items: GENRES },
  { label: '场景', items: SCENES },
];

export default function GenreCards({ onSelect, activeGenre, activeTag }: Props) {
  return (
    <div className="px-5 space-y-2.5">
      {SECTIONS.map((section) => (
        <div key={section.label}>
          <div className="text-[10px] text-white/25 tracking-[0.15em] uppercase mb-1.5 ml-1"
               style={{ fontFamily: 'var(--font-body)' }}>
            {section.label}
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {section.items.map((tag) => {
              const isActive = activeTag === tag.id || activeGenre === tag.id;
              return (
                <button
                  key={tag.id}
                  onClick={() => onSelect(tag.id, tag.prompt)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-[11px] tracking-wide
                             transition-all duration-300 active:scale-[0.96]
                             ${isActive
                               ? 'text-[#0d0d1a] font-medium shadow-lg shadow-[var(--simone-accent)]/20'
                               : 'glass text-white/45 hover:text-white/75 hover:bg-white/10'
                             }`}
                  style={isActive ? {
                    background: 'linear-gradient(135deg, var(--simone-accent), var(--simone-accent-warm))',
                  } : undefined}
                >
                  {tag.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
