'use client';

import StageCanvas from '@/components/StageCanvas';
import { PRESET_CHARACTERS } from '@/data/characters';
import type { EnergyLevels } from '@/types';

const ZERO_ENERGY: EnergyLevels = { low: 0, mid: 0, high: 0, overall: 0 };

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--stage-bg)]">
      {/* Stage occupies top ~65% of the screen */}
      <div className="w-full" style={{ height: '65vh' }}>
        <StageCanvas
          members={PRESET_CHARACTERS}
          isPlaying={false}
          energy={ZERO_ENERGY}
          onCharacterClick={() => {}}
        />
      </div>
    </div>
  );
}
