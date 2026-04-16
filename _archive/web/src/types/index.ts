export interface LyriaParams {
  stylePrompt: string;
  bpm: number;
  temperature: number;
  density: number;
  brightness: number;
  guidance: number;
}

export type Genre = 'chill' | 'jazz' | 'rock' | 'electronic' | 'lofi' | 'funk' | 'rnb';
