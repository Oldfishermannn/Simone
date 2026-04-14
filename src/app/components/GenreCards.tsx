'use client';

interface Props {
  onSelect: (genre: string, prompt: string) => void;
}

const GENRES = [
  { id: 'chill', label: 'Chill', emoji: '🎵', prompt: '来点轻松的 Chill 音乐' },
  { id: 'jazz', label: 'Jazz', emoji: '🎹', prompt: '来段爵士乐' },
  { id: 'rock', label: 'Rock', emoji: '🎸', prompt: '来点摇滚' },
  { id: 'electronic', label: 'Electronic', emoji: '🎧', prompt: '来段电子音乐' },
  { id: 'lofi', label: 'Lo-Fi', emoji: '🌧️', prompt: '来点 Lo-Fi' },
  { id: 'funk', label: 'Funk', emoji: '🥁', prompt: '来段 Funk' },
  { id: 'rnb', label: 'R&B', emoji: '💜', prompt: '来点 R&B' },
];

export default function GenreCards({ onSelect }: Props) {
  return (
    <div className="flex flex-wrap justify-center gap-3 px-4">
      {GENRES.map((g) => (
        <button
          key={g.id}
          onClick={() => onSelect(g.id, g.prompt)}
          className="px-5 py-3 rounded-2xl text-sm font-medium backdrop-blur-md
                     bg-white/10 hover:bg-white/20 active:scale-95
                     transition-all duration-200 text-white"
        >
          <span className="mr-1.5">{g.emoji}</span>
          {g.label}
        </button>
      ))}
    </div>
  );
}
