'use client';

import { useState } from 'react';

interface Props {
  temperature: number;
  guidance_weight: number;
  onUpdate: (config: Record<string, unknown>) => void;
  onShuffle: () => void;
  visible: boolean;
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[10px] text-white/40 tracking-widest uppercase"
              style={{ fontFamily: 'var(--font-body)' }}>
          {label}
        </span>
        <span className="text-[11px] text-white/60 tabular-nums"
              style={{ fontFamily: 'var(--font-body)' }}>
          {value.toFixed(1)}{unit || ''}
        </span>
      </div>
      <div className="relative h-6 flex items-center">
        <div className="absolute inset-x-0 h-[3px] rounded-full bg-white/8" />
        <div
          className="absolute left-0 h-[3px] rounded-full"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, var(--simone-accent), var(--simone-accent-warm))',
          }}
        />
        <div
          className="absolute w-3 h-3 rounded-full -translate-x-1/2 pointer-events-none"
          style={{
            left: `${pct}%`,
            background: 'linear-gradient(135deg, var(--simone-accent), var(--simone-accent-warm))',
            boxShadow: '0 0 10px rgba(201,160,220,0.4)',
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
}

export default function TunePanel({ temperature, guidance_weight, onUpdate, onShuffle, visible }: Props) {
  const [localTemp, setLocalTemp] = useState(temperature);
  const [localGuide, setLocalGuide] = useState(guidance_weight);

  const [lastParent, setLastParent] = useState({ temperature, guidance_weight });
  if (temperature !== lastParent.temperature || guidance_weight !== lastParent.guidance_weight) {
    setLastParent({ temperature, guidance_weight });
    setLocalTemp(temperature);
    setLocalGuide(guidance_weight);
  }

  const handleChange = (key: string, value: number) => {
    switch (key) {
      case 'temperature': setLocalTemp(value); break;
      case 'guidance_weight': setLocalGuide(value); break;
    }
    onUpdate({ [key]: value });
  };

  if (!visible) return null;

  return (
    <div className="mx-4 mb-2 glass rounded-2xl px-5 py-4 space-y-3 animate-fade-up">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-white/35 tracking-[0.12em] uppercase"
              style={{ fontFamily: 'var(--font-body)' }}>
          微调
        </span>
        <button
          onClick={onShuffle}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass
                     text-[11px] text-white/50 hover:text-white/80
                     transition-all duration-300 active:scale-95 hover:bg-white/10"
          title="保持当前风格，换一首"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 2v6h-6" />
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
            <path d="M3 22v-6h6" />
            <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
          </svg>
          换一首
        </button>
      </div>

      <Slider label="随机感" value={localTemp} min={0.3} max={3.0} step={0.1}
              onChange={(v) => handleChange('temperature', v)} />
      <Slider label="风格强度" value={localGuide} min={1.0} max={8.0} step={0.5}
              onChange={(v) => handleChange('guidance_weight', v)} />
    </div>
  );
}
