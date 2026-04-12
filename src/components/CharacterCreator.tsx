'use client';

import { useState } from 'react';
import type { BandMember, Instrument, SkillLevel } from '@/types';

interface CharacterCreatorProps {
  onAdd: (member: BandMember) => void;
  onClose: () => void;
}

const INSTRUMENT_OPTIONS: { value: Instrument; label: string; emoji: string }[] = [
  { value: 'drums', label: '鼓手', emoji: '🥁' },
  { value: 'bass', label: '贝斯', emoji: '🎵' },
  { value: 'vocals', label: '主唱', emoji: '🎤' },
  { value: 'guitar', label: '吉他', emoji: '🎸' },
  { value: 'keys', label: '键盘', emoji: '🎹' },
];

const SKILL_OPTIONS: { value: SkillLevel; label: string }[] = [
  { value: 'beginner', label: '初学者' },
  { value: 'intermediate', label: '中级' },
  { value: 'advanced', label: '高级' },
  { value: 'professional', label: '专业' },
];

const PERSONALITY_PRESETS = ['暴躁', '沉稳', '热情', '叛逆', '神秘', '温柔', '幽默'];
const STYLE_PRESETS = ['Rock', 'Blues', 'Jazz', 'Funk', 'Pop', 'Metal', 'Electronic', 'R&B'];

function hslToHex(h: number): string {
  const s = 0.85;
  const l = 0.55;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function CharacterCreator({ onAdd, onClose }: CharacterCreatorProps) {
  const [name, setName] = useState('');
  const [instrument, setInstrument] = useState<Instrument>('guitar');
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('intermediate');
  const [personalityChips, setPersonalityChips] = useState<string[]>([]);
  const [personalityInput, setPersonalityInput] = useState('');
  const [styleChips, setStyleChips] = useState<string[]>([]);
  const [styleInput, setStyleInput] = useState('');
  const [hue, setHue] = useState(180);

  const color = hslToHex(hue);

  const toggleChip = (
    chip: string,
    selected: string[],
    setSelected: (v: string[]) => void
  ) => {
    if (selected.includes(chip)) {
      setSelected(selected.filter((c) => c !== chip));
    } else {
      setSelected([...selected, chip]);
    }
  };

  const handleSubmit = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const personalityParts = [...personalityChips];
    if (personalityInput.trim()) personalityParts.push(personalityInput.trim());
    const styleParts = [...styleChips];
    if (styleInput.trim()) styleParts.push(styleInput.trim());

    const member: BandMember = {
      id: `custom_${uid()}`,
      name: trimmedName,
      instrument,
      color,
      personality: personalityParts.join('、') || '随性',
      musicPreference: styleParts.join(' / ') || '无限制',
      catchphrase: `我是${trimmedName}，让音乐说话！`,
      skillLevel,
      isCustom: true,
    };

    onAdd(member);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-lg mx-4 rounded-xl border overflow-y-auto"
        style={{
          background: '#0d0d1a',
          borderColor: '#333',
          boxShadow: '0 0 40px rgba(0,255,255,0.15)',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: '#222' }}
        >
          <h2 className="text-lg font-bold" style={{ color: '#00ffff' }}>
            自建乐手
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm mb-2" style={{ color: '#aaa' }}>
              乐手名字
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入名字..."
              maxLength={16}
              className="w-full px-3 py-2 rounded-lg outline-none text-sm"
              style={{
                background: '#111',
                border: '1px solid #333',
                color: '#eee',
              }}
            />
          </div>

          {/* Instrument */}
          <div>
            <label className="block text-sm mb-2" style={{ color: '#aaa' }}>
              乐器
            </label>
            <div className="flex gap-2 flex-wrap">
              {INSTRUMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setInstrument(opt.value)}
                  className="flex flex-col items-center px-3 py-2 rounded-lg text-xs transition-all"
                  style={{
                    background: instrument === opt.value ? 'rgba(0,255,255,0.15)' : '#111',
                    border: `1px solid ${instrument === opt.value ? '#00ffff' : '#333'}`,
                    color: instrument === opt.value ? '#00ffff' : '#aaa',
                    minWidth: '56px',
                  }}
                >
                  <span className="text-xl mb-1">{opt.emoji}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Skill Level */}
          <div>
            <label className="block text-sm mb-2" style={{ color: '#aaa' }}>
              技术水平
            </label>
            <div className="flex gap-2 flex-wrap">
              {SKILL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSkillLevel(opt.value)}
                  className="px-4 py-1.5 rounded-full text-sm transition-all"
                  style={{
                    background: skillLevel === opt.value ? 'rgba(255,0,255,0.2)' : '#111',
                    border: `1px solid ${skillLevel === opt.value ? '#ff00ff' : '#333'}`,
                    color: skillLevel === opt.value ? '#ff00ff' : '#aaa',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Personality */}
          <div>
            <label className="block text-sm mb-2" style={{ color: '#aaa' }}>
              性格标签
            </label>
            <div className="flex gap-2 flex-wrap mb-2">
              {PERSONALITY_PRESETS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => toggleChip(chip, personalityChips, setPersonalityChips)}
                  className="px-3 py-1 rounded-full text-xs transition-all"
                  style={{
                    background: personalityChips.includes(chip)
                      ? 'rgba(0,255,255,0.15)'
                      : '#111',
                    border: `1px solid ${personalityChips.includes(chip) ? '#00ffff' : '#333'}`,
                    color: personalityChips.includes(chip) ? '#00ffff' : '#888',
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={personalityInput}
              onChange={(e) => setPersonalityInput(e.target.value)}
              placeholder="自定义性格..."
              maxLength={20}
              className="w-full px-3 py-2 rounded-lg outline-none text-sm"
              style={{
                background: '#111',
                border: '1px solid #333',
                color: '#eee',
              }}
            />
          </div>

          {/* Style Preference */}
          <div>
            <label className="block text-sm mb-2" style={{ color: '#aaa' }}>
              风格偏好
            </label>
            <div className="flex gap-2 flex-wrap mb-2">
              {STYLE_PRESETS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => toggleChip(chip, styleChips, setStyleChips)}
                  className="px-3 py-1 rounded-full text-xs transition-all"
                  style={{
                    background: styleChips.includes(chip)
                      ? 'rgba(255,0,255,0.15)'
                      : '#111',
                    border: `1px solid ${styleChips.includes(chip) ? '#ff00ff' : '#333'}`,
                    color: styleChips.includes(chip) ? '#ff00ff' : '#888',
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={styleInput}
              onChange={(e) => setStyleInput(e.target.value)}
              placeholder="自定义风格..."
              maxLength={20}
              className="w-full px-3 py-2 rounded-lg outline-none text-sm"
              style={{
                background: '#111',
                border: '1px solid #333',
                color: '#eee',
              }}
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm mb-2" style={{ color: '#aaa' }}>
              专属色彩
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={0}
                max={359}
                value={hue}
                onChange={(e) => setHue(Number(e.target.value))}
                className="flex-1 h-2 rounded-full cursor-pointer"
                style={{
                  background: `linear-gradient(to right,
                    hsl(0,85%,55%), hsl(30,85%,55%), hsl(60,85%,55%),
                    hsl(90,85%,55%), hsl(120,85%,55%), hsl(150,85%,55%),
                    hsl(180,85%,55%), hsl(210,85%,55%), hsl(240,85%,55%),
                    hsl(270,85%,55%), hsl(300,85%,55%), hsl(330,85%,55%),
                    hsl(359,85%,55%))`,
                  appearance: 'none' as React.CSSProperties['appearance'],
                  WebkitAppearance: 'none',
                }}
              />
              {/* Live preview pixel block */}
              <div
                className="w-12 h-12 rounded-lg flex-shrink-0"
                style={{
                  background: color,
                  boxShadow: `0 0 12px ${color}88`,
                  border: '2px solid rgba(255,255,255,0.1)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div
          className="flex gap-3 px-6 py-4 border-t"
          style={{ borderColor: '#222' }}
        >
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={{
              background: '#111',
              border: '1px solid #333',
              color: '#888',
            }}
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all"
            style={{
              background: name.trim()
                ? 'linear-gradient(135deg, rgba(0,255,255,0.2), rgba(255,0,255,0.2))'
                : '#111',
              border: `1px solid ${name.trim() ? '#00ffff' : '#333'}`,
              color: name.trim() ? '#00ffff' : '#444',
              cursor: name.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            加入乐队
          </button>
        </div>
      </div>
    </div>
  );
}
