'use client';

interface Props {
  onSelect: (genre: string, prompt: string) => void;
}

const GENRES = [
  { id: 'chill', label: 'Chill', prompt: '来点轻松的 Chill 音乐' },
  { id: 'jazz', label: 'Jazz', prompt: '来段爵士乐' },
  { id: 'rock', label: 'Rock', prompt: '来点摇滚' },
  { id: 'electronic', label: 'Electronic', prompt: '来段电子音乐' },
  { id: 'lofi', label: 'Lo-Fi', prompt: '来点 Lo-Fi' },
  { id: 'funk', label: 'Funk', prompt: '来段 Funk' },
  { id: 'rnb', label: 'R&B', prompt: '来点 R&B' },
];

export default function GenreCards({ onSelect }: Props) {
  return (
    <div className="flex flex-wrap justify-center gap-2.5 px-6 max-w-md mx-auto">
      {GENRES.map((g, i) => (
        <button
          key={g.id}
          onClick={() => onSelect(g.id, g.prompt)}
          className="glass px-5 py-2.5 rounded-full text-[13px] tracking-wide
                     text-white/70 hover:text-white hover:bg-white/10
                     active:scale-[0.96] transition-all duration-300
                     animate-fade-up"
          style={{ animationDelay: `${0.4 + i * 0.06}s` }}
        >
          {g.label}
        </button>
      ))}
    </div>
  );
}
