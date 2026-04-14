'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import pako from 'pako';
import { SIMONE_SYSTEM_PROMPT } from './simone-prompt';
import AmbientBackground from './components/AmbientBackground';
// GenreCards removed — replaced by ElementPool as primary UI
import MiniPlayer from './components/MiniPlayer';
import ChatBubbles from './components/ChatBubbles';
import ElementPool from './components/ElementPool';
import { buildPromptsFromPool, inferGenreFromPool, getElementById } from './pool-elements';

// ─── Types ───
interface Message {
  id: string;
  role: 'user' | 'ai' | 'system';
  text: string;
  params?: LyriaUpdate | null;
  time: number;
}

interface LyriaUpdate {
  prompts?: Array<{ text: string; weight: number }>;
  config?: Record<string, unknown>;
  action?: 'play' | 'update' | 'pause' | 'stop' | 'reset_context';
  genre?: string;
}

// ─── Constants ───
function getWsUrl(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('simone_ws_url');
    if (saved) return saved;
  }
  return process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8765/ws';
}
const SAMPLE_RATE = 48000;
const CHANNELS = 2;

let msgId = 0;
function uid() { return `msg-${++msgId}-${Date.now()}`; }

export default function SimonePage() {
  // ─── Chat State ───
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const historyRef = useRef<Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>>([]);

  // ─── WebSocket / Audio State ───
  const [wsUrl, setWsUrl] = useState(() => getWsUrl());

  const [wsConnected, setWsConnected] = useState(false);
  const [status, setStatus] = useState('未连接');
  const [chunkCount, setChunkCount] = useState(0);
  const [currentPrompts, setCurrentPrompts] = useState<Array<{ text: string; weight: number }>>([]);
  const [currentConfig, setCurrentConfig] = useState<Record<string, unknown>>({});

  // ─── Genre & Tag State ───
  const [genre, setGenre] = useState('default');
  const [poolElements, setPoolElements] = useState<string[]>([]);
  const poolDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const nextPlayTimeRef = useRef(0);
  const chunkCountRef = useRef(0);
  const animFrameRef = useRef(0);
  const lyriaReadyRef = useRef(false);
  const lyriaReadyResolveRef = useRef<(() => void) | null>(null);
  const lastUpdateRef = useRef<LyriaUpdate | null>(null);
  const lastSentConfigRef = useRef<string>(''); // JSON string of last sent config for diffing
  const autoReconnectRef = useRef(false); // true = should auto-reconnect on close
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRotatingRef = useRef(false); // true during session rotation, pre-buffer before playing

  // ─── Adaptive Jitter Buffer Audio Playback ───
  // 核心思路：像 VoIP/WebRTC 一样，根据 chunk 到达间隔的抖动动态调整缓冲深度
  // Lyria chunk 到达间隔极不稳定（1-8s），固定 BUFFER_MIN 无法应对
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const scheduledSourcesRef = useRef<AudioBufferSourceNode[]>([]); // track scheduled sources
  const isPlayingRef = useRef(false);
  const chunkArrivalTimesRef = useRef<number[]>([]); // 记录最近 N 个 chunk 到达时间
  const bufferDepthRef = useRef(2); // 初始缓冲深度（chunk 数），会动态调整
  const INITIAL_BUFFER = 2; // 初始预缓冲（Magenta RT chunk=2s，2个=4s缓冲）
  const MIN_BUFFER = 1; // 最小缓冲深度
  const MAX_BUFFER = 4; // 最大缓冲深度
  const JITTER_WINDOW = 10; // 用最近 N 个间隔计算抖动
  const hasStartedRef = useRef(false); // true after first playback — never re-buffer after that

  const int16ToAudioBuffer = useCallback((int16: Int16Array): AudioBuffer | null => {
    const ctx = audioCtxRef.current;
    if (!ctx) return null;
    const numSamples = int16.length / CHANNELS;
    if (numSamples === 0) return null;
    const buffer = ctx.createBuffer(CHANNELS, numSamples, SAMPLE_RATE);
    for (let ch = 0; ch < CHANNELS; ch++) {
      const channelData = buffer.getChannelData(ch);
      for (let i = 0; i < numSamples; i++) {
        channelData[i] = int16[i * CHANNELS + ch] / 32768;
      }
    }
    return buffer;
  }, []);

  // Delta+Gzip compressed decode
  const decodeDgzToPCM = useCallback((b64Data: string): AudioBuffer | null => {
    const compressed = Uint8Array.from(atob(b64Data), c => c.charCodeAt(0));
    const decompressed = pako.inflate(compressed);
    const deltas = new Int16Array(decompressed.buffer);
    // Undo delta encoding (cumulative sum with int16 wrapping)
    for (let i = 1; i < deltas.length; i++) {
      deltas[i] = (deltas[i] + deltas[i - 1]) & 0xFFFF;
      if (deltas[i] > 32767) deltas[i] -= 65536;
    }
    return int16ToAudioBuffer(deltas);
  }, [int16ToAudioBuffer]);

  const decodeBinaryToPCM = useCallback((data: ArrayBuffer): AudioBuffer | null => {
    return int16ToAudioBuffer(new Int16Array(data));
  }, [int16ToAudioBuffer]);

  // Legacy base64 fallback
  const decodeB64ToPCM = useCallback((b64Data: string): AudioBuffer | null => {
    const ctx = audioCtxRef.current;
    if (!ctx) return null;
    const raw = atob(b64Data);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    return decodeBinaryToPCM(bytes.buffer);
  }, [decodeBinaryToPCM]);

  // 计算自适应缓冲深度：基于 chunk 到达间隔的标准差
  const updateBufferDepth = useCallback(() => {
    const times = chunkArrivalTimesRef.current;
    if (times.length < 3) return; // 数据不够，保持默认

    // 计算最近的到达间隔
    const intervals: number[] = [];
    for (let i = 1; i < times.length; i++) {
      intervals.push(times[i] - times[i - 1]);
    }

    // 标准差
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((a, b) => a + (b - mean) ** 2, 0) / intervals.length;
    const stddev = Math.sqrt(variance);

    // 抖动越大 → 缓冲越深。每秒抖动 ≈ 需要多少个 chunk 的缓冲
    // 每个 chunk 大约 1.6s 的音频，所以 stddev/1.6 ≈ 需要的额外缓冲
    const needed = Math.ceil(MIN_BUFFER + stddev / 1.5);
    bufferDepthRef.current = Math.min(MAX_BUFFER, Math.max(MIN_BUFFER, needed));
  }, []);

  const scheduleBuffers = useCallback(() => {
    const ctx = audioCtxRef.current;
    const destination = gainNodeRef.current || analyserRef.current;
    if (!ctx || !destination || audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      return;
    }
    isPlayingRef.current = true;

    // If resuming after rotation, fade in over 0.3s
    if (isRotatingRef.current && gainNodeRef.current) {
      const gain = gainNodeRef.current;
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(1.0, ctx.currentTime + 0.3);
      isRotatingRef.current = false;
    }

    const now = ctx.currentTime;
    // If we've fallen behind (buffer underrun), jump to now
    // But don't set it to now+tiny — let the chunk's own duration create the buffer
    if (nextPlayTimeRef.current < now) {
      nextPlayTimeRef.current = now;
    }

    const MAX_AHEAD = 2; // max seconds of audio scheduled ahead
    while (audioQueueRef.current.length > 0) {
      // Don't schedule too far ahead — keeps style changes responsive
      if (nextPlayTimeRef.current - now > MAX_AHEAD) break;
      const buffer = audioQueueRef.current.shift()!;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(destination);
      source.start(nextPlayTimeRef.current);
      // Overlap by 5ms — matched with server-side 5ms sin² fade for gapless crossfade
      nextPlayTimeRef.current += buffer.duration - 0.005;
      scheduledSourcesRef.current.push(source);
      source.onended = () => {
        scheduledSourcesRef.current = scheduledSourcesRef.current.filter(s => s !== source);
        scheduleBuffers();
      };
    }
  }, []);

  const playAudioChunk = useCallback((data: string | ArrayBuffer | AudioBuffer) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    let buffer: AudioBuffer | null;
    if (data instanceof AudioBuffer) {
      buffer = data;
    } else if (data instanceof ArrayBuffer) {
      buffer = decodeBinaryToPCM(data);
    } else {
      buffer = decodeB64ToPCM(data);
    }
    if (!buffer) return;

    // 记录到达时间用于 jitter 计算
    const now = performance.now() / 1000;
    const arrivals = chunkArrivalTimesRef.current;
    arrivals.push(now);
    if (arrivals.length > JITTER_WINDOW + 1) arrivals.shift();
    updateBufferDepth();

    audioQueueRef.current.push(buffer);

    // 播放决策：
    // - 首次启动 / 轮转后：预缓冲 N 个 chunk 再开始
    // - 已经播放过：来一个立即 schedule，靠已有的 scheduled-ahead 音频扛抖动
    if (!hasStartedRef.current) {
      // 首次：预缓冲
      const target = isRotatingRef.current ? INITIAL_BUFFER : bufferDepthRef.current;
      if (audioQueueRef.current.length < target) return;
      hasStartedRef.current = true;
    }
    scheduleBuffers();
  }, [decodeB64ToPCM, updateBufferDepth, scheduleBuffers]);

  // ─── WebSocket connect (returns Promise that resolves when Lyria session is ready) ───
  const connectWs = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        if (lyriaReadyRef.current) { resolve(); return; }
        wsRef.current.close();
      }
      lyriaReadyRef.current = false;
      lyriaReadyResolveRef.current = resolve;

      const ws = new WebSocket(wsUrl);
      ws.onopen = () => {
        setWsConnected(true);
        setStatus('正在连接 Lyria...');
        // Close old AudioContext to stop any lingering scheduled buffers
        if (audioCtxRef.current) {
          audioCtxRef.current.close().catch(() => {});
        }
        audioQueueRef.current = [];
        chunkArrivalTimesRef.current = [];
        bufferDepthRef.current = INITIAL_BUFFER;
        isPlayingRef.current = false;
        hasStartedRef.current = false;
        isRotatingRef.current = false;
        const ctx = new AudioContext({ sampleRate: SAMPLE_RATE });
        const gain = ctx.createGain();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        // Chain: source -> gain -> analyser -> destination
        gain.connect(analyser);
        analyser.connect(ctx.destination);
        audioCtxRef.current = ctx;
        gainNodeRef.current = gain;
        analyserRef.current = analyser;
        nextPlayTimeRef.current = 0;
        chunkCountRef.current = 0;
        setChunkCount(0);
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      };
      ws.binaryType = 'arraybuffer';
      ws.onmessage = (evt) => {
        // Binary frame = raw PCM int16 audio (no JSON, no base64)
        if (evt.data instanceof ArrayBuffer) {
          chunkCountRef.current++;
          setChunkCount(chunkCountRef.current);
          playAudioChunk(evt.data);
          return;
        }
        const data = JSON.parse(evt.data);
        if (data.type === 'audio') {
          chunkCountRef.current++;
          setChunkCount(chunkCountRef.current);
          if (data.enc === 'opus') {
            // Opus/OGG compressed audio — decode via Web Audio API
            const binary = Uint8Array.from(atob(data.data), c => c.charCodeAt(0));
            const ctx = audioCtxRef.current;
            if (ctx) {
              ctx.decodeAudioData(binary.buffer.slice(0)).then(buf => {
                playAudioChunk(buf);
              }).catch(err => console.error('Opus decode error:', err));
            }
          } else if (data.enc === 'dgz') {
            // Delta+Gzip compressed audio
            const buf = decodeDgzToPCM(data.data);
            if (buf) playAudioChunk(buf);
          } else {
            playAudioChunk(data.data);
          }
        } else if (data.type === 'status') {
          if (data.message === 'reconnecting') {
            // Server is rotating Lyria session — fade out, pre-buffer, then fade in
            setStatus('会话轮转中...');
            // Fade out current audio over 0.2s
            if (gainNodeRef.current && audioCtxRef.current) {
              const gain = gainNodeRef.current;
              const now = audioCtxRef.current.currentTime;
              gain.gain.setValueAtTime(gain.gain.value, now);
              gain.gain.linearRampToValueAtTime(0, now + 0.2);
            }
            // Clear queue but keep hasStartedRef=true — no re-buffering on rotation
            // Rotation chunks should play immediately to minimize silence gap
            audioQueueRef.current = [];
            chunkArrivalTimesRef.current = [];
            isPlayingRef.current = false;
            isRotatingRef.current = true; // will fade in on next chunk
            if (audioCtxRef.current) {
              nextPlayTimeRef.current = audioCtxRef.current.currentTime + 0.3;
            }
          } else if (data.message === 'connected') {
            setStatus('已连接');
            if (!lyriaReadyRef.current) {
              lyriaReadyRef.current = true;
              lyriaReadyResolveRef.current?.();
              lyriaReadyResolveRef.current = null;
            }
          } else {
            setStatus(data.message);
          }
        } else if (data.type === 'error') {
          setStatus('错误: ' + data.message);
        }
      };
      ws.onerror = () => { setStatus('连接错误'); reject(new Error('WebSocket error')); };
      ws.onclose = () => {
        setWsConnected(false);
        wsRef.current = null;
        lyriaReadyRef.current = false;
        // Auto-reconnect handled by effect
        if (autoReconnectRef.current && lastUpdateRef.current) {
          setStatus('重连中...');
        } else {
          setStatus('已断开');
        }
      };
      wsRef.current = ws;

      // Timeout after 15s
      setTimeout(() => {
        if (!lyriaReadyRef.current) {
          lyriaReadyResolveRef.current?.();
          lyriaReadyResolveRef.current = null;
        }
      }, 15000);
    });
  }, [playAudioChunk, wsUrl]);

  // ─── Send Lyria commands via WebSocket ───
  const sendWs = useCallback((data: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  // ─── Apply Lyria params from chat ───
  const applyLyriaUpdate = useCallback((update: LyriaUpdate) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    // Extract genre if present
    if ((update as Record<string, unknown>).genre) {
      setGenre((update as Record<string, unknown>).genre as string);
    }

    // Save for auto-reconnect
    lastUpdateRef.current = { ...lastUpdateRef.current, ...update };
    autoReconnectRef.current = true;

    if (update.prompts && update.prompts.length > 0) {
      sendWs({ command: 'set_prompts', prompts: update.prompts });
      setCurrentPrompts(update.prompts);
      // Clear unscheduled queue so new style chunks play sooner
      // Already-scheduled sources keep playing (no stutter)
      audioQueueRef.current = [];
    }

    if (update.config && Object.keys(update.config).length > 0) {
      // Only send supported Magenta RT params
      const c = update.config as Record<string, number>;
      const magentaConfig: Record<string, number> = {};
      if (c.temperature != null) magentaConfig.temperature = c.temperature;
      if (c.guidance_weight != null) magentaConfig.guidance_weight = c.guidance_weight;
      if (Object.keys(magentaConfig).length > 0) {
        const configJson = JSON.stringify(magentaConfig);
        if (configJson !== lastSentConfigRef.current) {
          sendWs({ command: 'set_config', config: magentaConfig });
          lastSentConfigRef.current = configJson;
        }
      }
      setCurrentConfig(prev => ({ ...prev, ...magentaConfig }));
    }

    if (update.action) {
      if (update.action === 'play') {
        sendWs({ command: 'play' });
        setStatus('播放中');
      } else if (update.action === 'update') {
        // Already playing — just set_prompts/set_config is enough, Lyria transitions smoothly
        setStatus('参数已更新');
      } else if (update.action === 'pause') {
        sendWs({ command: 'pause' });
        setStatus('已暂停');
      } else if (update.action === 'stop') {
        autoReconnectRef.current = false;
        sendWs({ command: 'stop' });
        setStatus('已停止');
      } else if (update.action === 'reset_context') {
        // BPM changed: reset context then resume playback
        sendWs({ command: 'reset_context' });
        sendWs({ command: 'play' });
        setStatus('BPM 变更，重置中...');
      }
    }
  }, [sendWs]);

  // ─── Parse AI response: extract text + JSON ───
  const parseResponse = (raw: string): { text: string; params: LyriaUpdate | null } => {
    const jsonMatch = raw.match(/```json\s*([\s\S]*?)```/);
    let params: LyriaUpdate | null = null;
    let text = raw;

    if (jsonMatch) {
      text = raw.replace(/```json\s*[\s\S]*?```/, '').trim();
      try {
        params = JSON.parse(jsonMatch[1]) as LyriaUpdate;
      } catch {
        // JSON parse failed, ignore
      }
    } else {
      const rawJson = raw.match(/\{[\s\S]*"prompts"[\s\S]*\}/);
      if (rawJson) {
        text = raw.replace(rawJson[0], '').trim();
        try {
          params = JSON.parse(rawJson[0]) as LyriaUpdate;
        } catch {}
      }
    }

    return { text, params };
  };

  // ─── Send chat message ───
  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    setIsLoading(true);

    const userMsg: Message = { id: uid(), role: 'user', text, time: Date.now() };
    setMessages(prev => [...prev, userMsg]);

    try {
      const history = historyRef.current;
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: SIMONE_SYSTEM_PROMPT,
          history,
          userMessage: text,
        }),
      });

      if (!res.ok) {
        if (res.status === 503) throw new Error('Gemini 服务暂时过载，稍后再试');
        throw new Error(`API error ${res.status}`);
      }
      const data = await res.json();
      const rawText: string = data.text ?? '';

      const { text: aiText, params } = parseResponse(rawText);

      const aiMsg: Message = {
        id: uid(), role: 'ai', text: aiText, params, time: Date.now(),
      };
      setMessages(prev => [...prev, aiMsg]);

      historyRef.current = [
        ...history,
        { role: 'user' as const, parts: [{ text }] },
        { role: 'model' as const, parts: [{ text: rawText }] },
      ].slice(-20);

      // If we got music params, auto-connect Lyria if needed, then apply
      if (params) {
        if ((params as Record<string, unknown>).genre) {
          setGenre((params as Record<string, unknown>).genre as string);
        }
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !lyriaReadyRef.current) {
          connectWs().then(() => applyLyriaUpdate(params)).catch(() => {});
        } else {
          applyLyriaUpdate(params);
        }
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        id: uid(), role: 'system',
        text: '连接出错: ' + (err instanceof Error ? err.message : String(err)),
        time: Date.now(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Toggle play/pause ───
  const handleTogglePlay = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const isPaused = status === '已暂停' || status === '已停止';
      if (isPaused) {
        sendWs({ command: 'play' });
        setStatus('播放中');
      } else {
        sendWs({ command: 'pause' });
        setStatus('已暂停');
      }
    }
  }, [sendWs, status]);

  // ─── Element Pool: toggle element and send blended prompts ───
  const handlePoolToggle = useCallback((id: string) => {
    setPoolElements(prev => {
      const el = getElementById(id);
      let next: string[];
      if (prev.includes(id)) {
        // Remove
        next = prev.filter(x => x !== id);
      } else {
        // Add — but remove any other element in the same category (同类互斥)
        const cat = el?.category;
        next = cat
          ? [...prev.filter(x => getElementById(x)?.category !== cat), id]
          : [...prev, id];
      }
      // Debounce: send after 500ms of no changes
      if (poolDebounceRef.current) clearTimeout(poolDebounceRef.current);
      poolDebounceRef.current = setTimeout(() => {
        if (next.length === 0) return;
        const prompts = buildPromptsFromPool(next);
        if (prompts.length === 0) return;
        // Infer genre for background
        const poolGenre = inferGenreFromPool(next);
        if (poolGenre) setGenre(poolGenre);
        // Send prompts — connect first if needed
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          sendWs({ command: 'set_prompts', prompts });
          setCurrentPrompts(prompts);
          audioQueueRef.current = [];
          // Auto-play if not already playing
          if (status !== '播放中') {
            sendWs({ command: 'play' });
            setStatus('播放中');
          }
        } else {
          connectWs().then(() => {
            sendWs({ command: 'set_prompts', prompts });
            setCurrentPrompts(prompts);
            sendWs({ command: 'play' });
            setStatus('播放中');
          }).catch(() => {});
        }
        lastUpdateRef.current = { prompts, action: 'update' };
        autoReconnectRef.current = true;
      }, 300);
      return next;
    });
  }, [sendWs, connectWs, status]);

  // ─── Shuffle: same genre, new variation ───
  // ─── Auto-reconnect when Lyria session times out ───
  useEffect(() => {
    if (!wsConnected && autoReconnectRef.current && lastUpdateRef.current) {
      reconnectTimerRef.current = setTimeout(() => {
        // Read latest state at reconnect time (not stale closure value)
        const latest = lastUpdateRef.current;
        if (!latest) return;
        // Force action to "play" — we need to restart after reconnect
        const reconnectParams = { ...latest, action: 'play' as const };
        lastSentConfigRef.current = ''; // reset config diff so config gets sent
        connectWs().then(() => {
          applyLyriaUpdate(reconnectParams);
        }).catch(() => {
          setStatus('重连失败');
          autoReconnectRef.current = false;
        });
      }, 100);
      return () => {
        if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      };
    }
  }, [wsConnected, connectWs, applyLyriaUpdate]);

  // ─── Background playback: silent <audio> keep-alive + WS recovery ───
  useEffect(() => {
    // MediaSession: lock screen controls
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'Simone', artist: 'Lyria RealTime', album: 'AI Music',
      });
      navigator.mediaSession.setActionHandler('play', () => {
        audioCtxRef.current?.resume();
        sendWs({ command: 'play' });
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        sendWs({ command: 'pause' });
      });
    }

    // Silent WAV data URI — 1 second of silence, 8kHz mono 8-bit
    // This is the #1 trick for preventing Chrome/Safari from freezing the page
    let silentAudio: HTMLAudioElement | null = null;
    const startSilentAudio = () => {
      if (silentAudio) return;
      // Minimal WAV: RIFF header + fmt chunk + data chunk, 8000 bytes of silence
      const sampleRate = 8000;
      const numSamples = sampleRate; // 1 second
      const headerSize = 44;
      const buf = new ArrayBuffer(headerSize + numSamples);
      const view = new DataView(buf);
      // RIFF header
      const writeStr = (off: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); };
      writeStr(0, 'RIFF');
      view.setUint32(4, 36 + numSamples, true);
      writeStr(8, 'WAVE');
      writeStr(12, 'fmt ');
      view.setUint32(16, 16, true); // chunk size
      view.setUint16(20, 1, true);  // PCM
      view.setUint16(22, 1, true);  // mono
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate, true); // byte rate
      view.setUint16(32, 1, true);  // block align
      view.setUint16(34, 8, true);  // bits per sample
      writeStr(36, 'data');
      view.setUint32(40, numSamples, true);
      // data bytes are 0 = silence for 8-bit PCM (128 = center, but 0 works for keep-alive)
      for (let i = 0; i < numSamples; i++) view.setUint8(headerSize + i, 128);
      const blob = new Blob([buf], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      silentAudio = new Audio(url);
      silentAudio.loop = true;
      silentAudio.volume = 0.01; // near-silent but > 0 so Chrome doesn't skip
      silentAudio.play().catch(() => {}); // may need user gesture first
    };

    // When returning to foreground: resume AudioContext + check WS
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        // Resume AudioContext
        const ctx = audioCtxRef.current;
        if (ctx?.state === 'suspended') ctx.resume();
        // If WS died in background, auto-reconnect
        if (wsRef.current?.readyState !== WebSocket.OPEN && autoReconnectRef.current && lastUpdateRef.current) {
          console.log('[Background] WS断了，自动重连...');
          setStatus('重连中...');
          connectWs().then(() => {
            if (lastUpdateRef.current) applyLyriaUpdate({ ...lastUpdateRef.current, action: 'play' as const });
          }).catch(() => {});
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Start silent audio when we have an audio context (needs to piggyback on user gesture)
    const interval = setInterval(() => {
      if (audioCtxRef.current && !silentAudio) {
        startSilentAudio();
        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
      }
    }, 1000);

    return () => {
      autoReconnectRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (silentAudio) { silentAudio.pause(); silentAudio.src = ''; silentAudio = null; }
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
      wsRef.current?.close();
    };
  }, [sendWs, connectWs, applyLyriaUpdate]);

  // suppress unused var warnings
  void chunkCount;
  void currentPrompts;
  void currentConfig;

  return (
    <>
      <AmbientBackground genre={genre} />
      <div className="flex flex-col h-[100dvh]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {/* Chat area or initial greeting */}
        {/* Genre cards — always visible at top */}
        <div className="shrink-0 pt-6 pb-2">
          {messages.length === 0 && (
            <div className="text-center mb-6 animate-fade-up">
              <h1 className="text-4xl font-light text-white/90 mb-3 tracking-wide"
                  style={{ fontFamily: 'var(--font-display)' }}>
                Simone
              </h1>
              <p className="text-white/40 text-[14px] animate-fade-up"
                 style={{ animationDelay: '0.2s', fontFamily: 'var(--font-body)' }}>
                嗨，想听点什么？
              </p>
            </div>
          )}
          {/* Element Pool — primary UI */}
          <ElementPool
            activeIds={poolElements}
            onToggle={handlePoolToggle}
            visible={true}
          />
        </div>

        {/* Chat area */}
        {messages.length > 0 && (
          <ChatBubbles messages={messages} isLoading={isLoading} />
        )}

        {/* Mini player + tune toggle */}
        <div className="shrink-0">
          <MiniPlayer
            isPlaying={wsConnected && status === '播放中'}
            genre={genre}
            analyser={analyserRef.current}
            onTogglePlay={handleTogglePlay}
          />
        </div>

        {/* Input bar */}
        <div className="px-4 pb-4 pt-2">
          <div className="flex gap-2.5">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="跟 Simone 说点什么..."
              className="flex-1 px-5 py-3.5 rounded-2xl glass text-[13.5px]
                         text-white/90 placeholder-white/30 outline-none
                         input-glow transition-all duration-300"
              style={{ fontFamily: 'var(--font-body)' }}
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="px-5 py-3.5 rounded-2xl text-[13px] tracking-wide
                         text-[#0d0d1a] font-medium disabled:opacity-30
                         active:scale-[0.96] transition-all duration-300
                         hover:shadow-lg hover:shadow-[var(--simone-accent)]/20"
              style={{
                background: 'linear-gradient(135deg, var(--simone-accent), var(--simone-accent-warm))',
                fontFamily: 'var(--font-body)',
              }}
            >
              发送
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
