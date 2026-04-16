'use client';

/**
 * Singleton AudioContext with routing chain:
 * source → GainNode → AnalyserNode → destination
 */

let audioCtx: AudioContext | null = null;
let gainNode: GainNode | null = null;
let analyserNode: AnalyserNode | null = null;

function init(): AudioContext {
  if (audioCtx) return audioCtx;

  audioCtx = new AudioContext({ sampleRate: 48000 });

  gainNode = audioCtx.createGain();
  analyserNode = audioCtx.createAnalyser();
  analyserNode.fftSize = 256;

  // Chain: GainNode → AnalyserNode → destination
  gainNode.connect(analyserNode);
  analyserNode.connect(audioCtx.destination);

  return audioCtx;
}

export function getAudioContext(): AudioContext {
  return init();
}

export function getGainNode(): GainNode {
  init();
  return gainNode!;
}

export function getAnalyser(): AnalyserNode {
  init();
  return analyserNode!;
}
