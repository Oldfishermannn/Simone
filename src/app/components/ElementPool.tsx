'use client';

import { POOL_ELEMENTS, CATEGORIES, hasStyleSelected } from '../pool-elements';

interface Props {
  activeIds: string[];       // pending — user clicked
  confirmedIds: string[];    // confirmed — music actually changed
  onToggle: (id: string) => void;
  visible: boolean;
}

const CATEGORY_COLORS: Record<string, { bg: string; border: string; activeBg: string }> = {
  mood:    { bg: 'rgba(201,160,220,0.08)', border: 'rgba(201,160,220,0.2)',  activeBg: 'rgba(201,160,220,0.35)' },
  style:   { bg: 'rgba(130,180,255,0.08)', border: 'rgba(130,180,255,0.2)',  activeBg: 'rgba(130,180,255,0.35)' },
  scene:   { bg: 'rgba(160,220,180,0.08)', border: 'rgba(160,220,180,0.2)',  activeBg: 'rgba(160,220,180,0.35)' },
  texture: { bg: 'rgba(232,180,184,0.08)', border: 'rgba(232,180,184,0.2)',  activeBg: 'rgba(232,180,184,0.35)' },
};

export default function ElementPool({ activeIds, confirmedIds, onToggle, visible }: Props) {
  if (!visible) return null;

  return (
    <div className="mx-4 mb-2 glass rounded-2xl px-4 py-4 space-y-3 animate-fade-up overflow-y-auto"
         style={{ maxHeight: '55vh' }}>
      {/* Active pool — show confirmed elements (what's actually playing) */}
      {confirmedIds.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] text-white/30 tracking-widest uppercase"
               style={{ fontFamily: 'var(--font-body)' }}>
            正在播放
          </div>
          <div className="flex flex-wrap gap-1.5">
            {confirmedIds.map(id => {
              const el = POOL_ELEMENTS.find(e => e.id === id);
              if (!el) return null;
              const colors = CATEGORY_COLORS[el.category];
              return (
                <button
                  key={id}
                  onClick={() => onToggle(id)}
                  className="px-3 py-1.5 rounded-full text-[12px] text-white/90
                             transition-all duration-200 active:scale-95 hover:brightness-125
                             flex items-center gap-1.5"
                  style={{
                    background: colors.activeBg,
                    border: `1px solid ${colors.border}`,
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  {el.label}
                  <span className="text-white/40 text-[10px]">×</span>
                </button>
              );
            })}
          </div>
          <div className="h-px bg-white/5" />
        </div>
      )}

      {/* Element categories — 风格在最上面，必选 */}
      {CATEGORIES.map(cat => {
        const elements = POOL_ELEMENTS.filter(e => e.category === cat.id);
        const styleSelected = hasStyleSelected(activeIds);
        const disabled = !cat.required && !styleSelected;
        return (
          <div key={cat.id} className="space-y-1.5">
            <div className="text-[10px] tracking-widest uppercase flex items-center gap-2"
                 style={{
                   fontFamily: 'var(--font-body)',
                   color: disabled ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.3)',
                 }}>
              {cat.label}
              {cat.required && !styleSelected && (
                <span className="text-[9px] text-white/20 normal-case tracking-normal">← 先选一个</span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {elements.map(el => {
                const isPending = activeIds.includes(el.id);
                const isConfirmed = confirmedIds.includes(el.id);
                const isActive = isPending || isConfirmed;
                const isWaiting = isPending && !isConfirmed; // clicked but music hasn't changed yet
                const colors = CATEGORY_COLORS[el.category];
                return (
                  <button
                    key={el.id}
                    onClick={() => !disabled && onToggle(el.id)}
                    className={`px-3 py-1.5 rounded-full text-[12px]
                               transition-all duration-200 active:scale-95
                               ${isWaiting ? 'animate-pulse' : ''}`}
                    style={{
                      background: isConfirmed ? colors.activeBg : isPending ? colors.bg : colors.bg,
                      border: `1px solid ${isConfirmed ? colors.border : isPending ? colors.border : 'rgba(255,255,255,0.06)'}`,
                      color: disabled ? 'rgba(255,255,255,0.15)' : isConfirmed ? 'rgba(255,255,255,0.9)' : isPending ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.45)',
                      backdropFilter: 'blur(10px)',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      opacity: disabled ? 0.5 : 1,
                    }}
                  >
                    {el.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
