'use client';

import { GoogleGenAI, type LiveMusicServerMessage, Scale } from '@google/genai';
import { getAudioContext, getGainNode } from './audio-context';
import type { LyriaParams } from '@/types';

type LyriaSession = ReturnType<GoogleGenAI['live']['music']['connect']> extends Promise<infer T> ? T : never;

let client: GoogleGenAI | null = null;
let session: LyriaSession | null = null;
let nextPlayTime = 0;

const KEY_TO_SCALE: Record<string, Scale> = {
  'A':  Scale.A_MAJOR_G_FLAT_MINOR,
  'Am': Scale.C_MAJOR_A_MINOR,
  'Bb': Scale.B_FLAT_MAJOR_G_MINOR,
  'C':  Scale.C_MAJOR_A_MINOR,
  'Cm': Scale.C_MAJOR_A_MINOR,
  'D':  Scale.D_MAJOR_B_MINOR,
  'Dm': Scale.D_MAJOR_B_MINOR,
  'E':  Scale.E_MAJOR_D_FLAT_MINOR,
  'Em': Scale.E_MAJOR_D_FLAT_MINOR,
  'F':  Scale.F_MAJOR_D_MINOR,
  'G':  Scale.G_MAJOR_E_MINOR,
  'Gm': Scale.G_MAJOR_E_MINOR,
};

function ensureClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
    if (!apiKey) throw new Error('Missing NEXT_PUBLIC_GEMINI_API_KEY');
    client = new GoogleGenAI({ apiKey, apiVersion: 'v1alpha' });
  }
  return client;
}

/** Decode PCM16 stereo base64 → schedule playback through GainNode */
function playPcmChunk(base64Data: string) {
  const ctx = getAudioContext();
  const gain = getGainNode();

  const raw = atob(base64Data);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);

  const int16 = new Int16Array(bytes.buffer);
  const numSamples = int16.length / 2;

  const buffer = ctx.createBuffer(2, numSamples, 48000);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);
  for (let i = 0; i < numSamples; i++) {
    left[i] = int16[i * 2] / 32768;
    right[i] = int16[i * 2 + 1] / 32768;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(gain); // → GainNode → AnalyserNode → destination

  const now = ctx.currentTime;
  if (nextPlayTime < now) nextPlayTime = now;
  source.start(nextPlayTime);
  nextPlayTime += buffer.duration;
}

/** Start streaming music via Lyria RealTime */
export async function startMusic(params: LyriaParams): Promise<void> {
  const genai = ensureClient();

  // Ensure AudioContext is running (may be suspended due to autoplay policy)
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') await ctx.resume();

  nextPlayTime = 0;

  const scale = KEY_TO_SCALE[params.scale] ?? Scale.C_MAJOR_A_MINOR;

  session = await genai.live.music.connect({
    model: 'models/lyria-realtime-exp',
    callbacks: {
      onmessage: (message: LiveMusicServerMessage) => {
        if (message.serverContent?.audioChunks) {
          for (const chunk of message.serverContent.audioChunks) {
            if (chunk.data) playPcmChunk(chunk.data);
          }
        }
      },
      onerror: (error: unknown) => {
        console.error('[Lyria] Error:', error);
      },
    },
  });

  await session.setWeightedPrompts({
    weightedPrompts: [{ text: params.stylePrompt, weight: 1.0 }],
  });

  await session.setMusicGenerationConfig({
    musicGenerationConfig: {
      bpm: params.bpm,
      scale,
      temperature: params.temperature,
      density: params.density,
      brightness: params.brightness,
      guidance: params.guidance,
    },
  });

  await session.play();
}

/** Stop music and close session */
export async function stopMusic(): Promise<void> {
  if (session) {
    try {
      await session.close();
    } catch (e) {
      console.warn('[Lyria] close error:', e);
    }
    session = null;
  }
  nextPlayTime = 0;
}
