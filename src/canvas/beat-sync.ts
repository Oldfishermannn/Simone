'use client';

import { getAnalyser } from '@/audio/audio-context';
import type { EnergyLevels } from '@/types';

/**
 * Read AnalyserNode frequency data and split into energy bands:
 * - low  (0-15% bins): drums/bass
 * - mid  (15-50% bins): guitar/vocals
 * - high (50-100% bins): keys/cymbals
 */
export function getEnergyLevels(): EnergyLevels {
  const analyser = getAnalyser();
  const data = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(data);

  const len = data.length;
  const lowEnd = Math.floor(len * 0.15);
  const midEnd = Math.floor(len * 0.5);

  let lowSum = 0;
  let midSum = 0;
  let highSum = 0;

  for (let i = 0; i < lowEnd; i++) lowSum += data[i];
  for (let i = lowEnd; i < midEnd; i++) midSum += data[i];
  for (let i = midEnd; i < len; i++) highSum += data[i];

  const lowCount = lowEnd || 1;
  const midCount = midEnd - lowEnd || 1;
  const highCount = len - midEnd || 1;

  const low = lowSum / lowCount / 255;
  const mid = midSum / midCount / 255;
  const high = highSum / highCount / 255;
  const overall = (low + mid + high) / 3;

  return { low, mid, high, overall };
}
