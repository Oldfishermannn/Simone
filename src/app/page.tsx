'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

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
}

// ─── Constants ───
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8765/ws';
const SAMPLE_RATE = 48000;
const CHANNELS = 2;

const SYSTEM_PROMPT = `你是 DJ Cyber，一个酷酷的实时音乐 AI 协作者。你通过 Google Lyria RealTime API 实时生成器乐音乐。

## 回复格式（严格遵循）

先用中文写对话（1-3句，简洁有力），然后换行输出 JSON：

\`\`\`json
{
  "prompts": [
    {"text": "主风格描述", "weight": 1.0},
    {"text": "叠加元素描述", "weight": 0.5}
  ],
  "config": {
    "bpm": 120,
    "temperature": 1.1,
    "guidance": 4.0,
    "density": 0.5,
    "brightness": 0.5
  },
  "action": "play"
}
\`\`\`

## Prompt 写法（关键！决定音乐质量）

prompts 是一个数组，支持多个 WeightedPrompt 混合叠加：
- text: 英文描述，**每个 prompt 都必须包含具体乐器名称**
- 结构：【流派 + 乐器（至少2个）+ 情绪/质感】
- weight: 控制该 prompt 的影响力（0.3-2.0）

好的 prompt 示例：
- "Chill lo-fi hip hop with warm Rhodes piano, vinyl crackle, and soft boom-bap drums"
- "Deep house with pulsing 808 bass, shimmering hi-hats, and ethereal synth pads"
- "Cinematic orchestral score with soaring strings, French horn, and timpani rolls"
- "Acid jazz fusion with walking upright bass, brushed drums, and muted trumpet"

差的 prompt（禁止）：
- "happy music"（太笼统，没有乐器）
- "Crunchy distortion with tight groove"（没有乐器名称！）
- "rock"（缺乏细节）

乐器参考：Rhodes Piano, Acoustic Guitar, Electric Guitar, 808 Bass, Upright Bass, Moog Synths, Analog Pads, Sitar, Kalimba, Cello, Violin, Strings, Slide Guitar, TR-909 Drums, Brushed Drums, Boom-Bap Drums, Hi-Hats, Harmonica, Steel Drum, Vibraphone, Koto, Djembe, Trumpet, Tenor Saxophone, Flute, French Horn, Harpsichord, Organ, Marimba
流派参考：Lo-Fi Hip Hop, Deep House, Bossa Nova, Drum & Bass, Afrobeat, Shoegaze, Electro Swing, Trip Hop, Psytrance, Indie Folk, Reggae, Synthpop, Celtic Folk, G-funk, Minimal Techno, Nu Jazz, Future Bass, Ambient, Post-Rock
质感参考：Dreamy, Ethereal, Warm, Saturated, Glitchy, Tight Groove, Swirling Phasers, Ominous, Spacious Reverb, Tape Saturation, Vinyl Crackle, Lo-Fi Texture

## 顺滑过渡（最重要的 DJ 技巧！）

切换风格时，**不要一次全换所有 prompt**，要像 DJ 混音一样渐进过渡：

1. **保留桥接元素**：切换时保留 1 个上一轮的乐器/节奏元素作为过渡桥梁
   - 例：Lo-Fi → Jazz，保留 "soft drums" 作为桥，加入 jazz 乐器
   - 例：Jazz → Electronic，保留 "Rhodes piano" 作为桥，加入 synth

2. **用 weight 做交叉淡入**：
   - 旧风格 prompt weight 降到 0.3-0.5（不要直接删除）
   - 新风格 prompt weight 设 0.8-1.0
   - 用户可能连续要求调整，你可以逐步把旧 prompt 权重降到 0 再移除

3. **guidance 控制过渡硬度**：
   - 正常播放：guidance 3.5-4.5（稳定）
   - 切换风格时：guidance 降到 2.5-3.0（让过渡更柔和自然）
   - 稳定后再逐步回到 3.5-4.0

4. **BPM 变化策略**：
   - BPM 变化 ≤15：用 action="update"，Lyria 会自然适应
   - BPM 变化 >15 或跨流派大变：用 action="reset_context"
   - 尽量保持 BPM 稳定，除非用户明确要求

## Config 参数（只用以下白名单字段）

- bpm: 60-200，节奏速度
- temperature: 0.0-3.0，创意随机度（默认 1.1）
- guidance: 0.0-6.0，prompt 遵循度（默认 4.0，过渡时降低）
- density: 0.0-1.0，音符密度
- brightness: 0.0-1.0，音调亮度
- top_k: 1-1000，采样多样性（默认 40）
- mute_bass / mute_drums / only_bass_and_drums: true/false
- music_generation_mode: "QUALITY"/"DIVERSITY"/"VOCALIZATION"，改变后需 reset_context

⚠️ 禁止输出 scale 和 seed 字段，会导致连接断开！

## Action 值

- "play": 首次播放
- "update": 调整参数（**优先用这个**，不中断播放，过渡最顺滑）
- "pause" / "stop": 暂停/停止
- "reset_context": 仅在 BPM 大幅变化(>15)或切换 music_generation_mode 时使用

## 规则

1. 中文聊天，prompts.text 英文
2. 首次 action="play"，**之后尽量都用 action="update"**
3. 每个 prompt.text 必须包含至少 2 个具体乐器名称
4. config 每次输出完整字段（API 会重置未指定的字段）
5. 渐进调整：一次只改 1-2 个维度，不要所有参数同时大改
6. 切换风格时，保留一个桥接元素 + 降低 guidance
7. 你只能生成器乐，不能生成带歌词的音乐
8. 保持个性：你是一个酷酷的 DJ，擅长流畅的混音过渡`;

let msgId = 0;
function uid() { return `msg-${++msgId}-${Date.now()}`; }

export default function JamPage() {
  // ─── Chat State ───
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>>([]);

  // ─── WebSocket / Audio State ───
  const [wsConnected, setWsConnected] = useState(false);
  const [status, setStatus] = useState('未连接');
  const [chunkCount, setChunkCount] = useState(0);
  const [currentPrompts, setCurrentPrompts] = useState<Array<{ text: string; weight: number }>>([]);
  const [currentConfig, setCurrentConfig] = useState<Record<string, unknown>>({});
  const [showPrompt, setShowPrompt] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const nextPlayTimeRef = useRef(0);
  const chunkCountRef = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef(0);
  const lyriaReadyRef = useRef(false);
  const lyriaReadyResolveRef = useRef<(() => void) | null>(null);
  const lastUpdateRef = useRef<LyriaUpdate | null>(null);
  const lastSentConfigRef = useRef<string>(''); // JSON string of last sent config for diffing
  const autoReconnectRef = useRef(false); // true = should auto-reconnect on close
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRotatingRef = useRef(false); // true during session rotation, pre-buffer before playing

  // ─── Auto-scroll chat ───
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── Visualizer ───
  const drawVisualizer = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, w, h);
    if (analyser) {
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      const barW = (w / data.length) * 2.5;
      let x = 0;
      for (let i = 0; i < data.length; i++) {
        const barH = (data[i] / 255) * h;
        const hue = (i / data.length) * 360;
        ctx.fillStyle = `hsl(${hue}, 80%, 55%)`;
        ctx.fillRect(x, h - barH, barW - 1, barH);
        x += barW;
        if (x > w) break;
      }
    }
    animFrameRef.current = requestAnimationFrame(drawVisualizer);
  }, []);

  // ─── Adaptive Jitter Buffer Audio Playback ───
  // 核心思路：像 VoIP/WebRTC 一样，根据 chunk 到达间隔的抖动动态调整缓冲深度
  // Lyria chunk 到达间隔极不稳定（1-8s），固定 BUFFER_MIN 无法应对
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingRef = useRef(false);
  const chunkArrivalTimesRef = useRef<number[]>([]); // 记录最近 N 个 chunk 到达时间
  const bufferDepthRef = useRef(5); // 初始缓冲深度（chunk 数），会动态调整
  const INITIAL_BUFFER = 5; // 初始预缓冲
  const MIN_BUFFER = 2; // 最小缓冲深度
  const MAX_BUFFER = 10; // 最大缓冲深度
  const JITTER_WINDOW = 10; // 用最近 N 个间隔计算抖动
  const hasStartedRef = useRef(false); // true after first playback — never re-buffer after that

  const decodeB64ToPCM = useCallback((b64Data: string): AudioBuffer | null => {
    const ctx = audioCtxRef.current;
    if (!ctx) return null;
    const raw = atob(b64Data);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    const int16 = new Int16Array(bytes.buffer);
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

    while (audioQueueRef.current.length > 0) {
      const buffer = audioQueueRef.current.shift()!;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(destination);
      source.start(nextPlayTimeRef.current);
      nextPlayTimeRef.current += buffer.duration;
    }
  }, []);

  const playAudioChunk = useCallback((b64Data: string) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    const buffer = decodeB64ToPCM(b64Data);
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

      const ws = new WebSocket(WS_URL);
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
        animFrameRef.current = requestAnimationFrame(drawVisualizer);
      };
      ws.onmessage = (evt) => {
        const data = JSON.parse(evt.data);
        if (data.type === 'audio') {
          chunkCountRef.current++;
          setChunkCount(chunkCountRef.current);
          playAudioChunk(data.data);
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
  }, [drawVisualizer, playAudioChunk]);

  // ─── Send Lyria commands via WebSocket ───
  const sendWs = useCallback((data: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  // ─── Apply Lyria params from chat ───
  const applyLyriaUpdate = useCallback((update: LyriaUpdate) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    // Save for auto-reconnect
    lastUpdateRef.current = { ...lastUpdateRef.current, ...update };
    autoReconnectRef.current = true;

    if (update.prompts && update.prompts.length > 0) {
      sendWs({ command: 'set_prompts', prompts: update.prompts });
      setCurrentPrompts(update.prompts);
    }

    if (update.config && Object.keys(update.config).length > 0) {
      // Remove scale field - Lyria API rejects string enum values from Gemini
      const { scale: _scale, ...safeConfig } = update.config;
      if (Object.keys(safeConfig).length > 0) {
        // Only send set_config if values actually changed — resending resets entire config and causes stutter
        const configJson = JSON.stringify(safeConfig);
        if (configJson !== lastSentConfigRef.current) {
          sendWs({ command: 'set_config', config: safeConfig });
          lastSentConfigRef.current = configJson;
        }
      }
      setCurrentConfig(prev => ({ ...prev, ...safeConfig }));
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
          systemPrompt: SYSTEM_PROMPT,
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

  // ─── Screen capture & analyze ───
  const [screenPreview, setScreenPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleScreenCapture = async () => {
    if (isAnalyzing) return;
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const track = stream.getVideoTracks()[0];
      const canvas = document.createElement('canvas');
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(video, 0, 0);
      track.stop();

      const dataUrl = canvas.toDataURL('image/png');
      const base64 = dataUrl.split(',')[1];
      setScreenPreview(dataUrl);
      setIsAnalyzing(true);

      // Add user message with screenshot
      setMessages(prev => [...prev, {
        id: uid(), role: 'user', text: '[截屏分析] 根据我的桌面推荐音乐', time: Date.now(),
      }]);

      const res = await fetch('/api/analyze-screen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      const rawText: string = data.text ?? '';
      const { text: aiText, params } = parseResponse(rawText);

      setMessages(prev => [...prev, {
        id: uid(), role: 'ai', text: aiText, params, time: Date.now(),
      }]);

      if (params) applyLyriaUpdate(params);
    } catch (err) {
      if ((err as Error).name !== 'NotAllowedError') {
        setMessages(prev => [...prev, {
          id: uid(), role: 'system',
          text: '截屏分析出错: ' + (err instanceof Error ? err.message : String(err)),
          time: Date.now(),
        }]);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const quickActions = [
    '来段 Lofi 放松一下',
    '给我来个摇滚',
    '换个爵士风格',
    '加快节奏！',
    '慢下来，柔和一点',
    '暂停',
  ];

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
        title: 'DJ Cyber', artist: 'Lyria RealTime', album: 'AI Music',
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

  const [showPanel, setShowPanel] = useState(false);

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] overflow-hidden" style={{ background: '#0a0a14', color: '#e0e0e0' }}>
      {/* ─── Mobile Top Bar ─── */}
      <div className="md:hidden shrink-0 flex items-center gap-2 px-3 py-2 border-b border-[#222]">
        <h1 className="text-base font-bold flex-1" style={{ color: '#00ffff', fontFamily: 'monospace' }}>
          DJ Cyber
        </h1>
        <div className="text-xs px-2 py-1 rounded" style={{
          background: '#16213e',
          borderLeft: `3px solid ${wsConnected ? (chunkCount > 0 ? '#e94560' : '#4caf50') : '#f44336'}`,
        }}>
          {status}
        </div>
        <button
          onClick={() => setShowPanel(!showPanel)}
          className="px-2 py-1 rounded text-xs cursor-pointer"
          style={{ background: showPanel ? '#e94560' : '#16213e', color: '#fff' }}
        >
          {showPanel ? '聊天' : '控制'}
        </button>
      </div>

      {/* ─── Left Panel (desktop: always visible, mobile: toggle) ─── */}
      <div className={`${showPanel ? 'flex' : 'hidden'} md:flex w-full md:w-[380px] shrink-0 flex-col border-r border-[#222] p-3 md:p-4 gap-3 md:gap-4 overflow-y-auto`}>
        <h1 className="hidden md:block text-xl font-bold" style={{ color: '#00ffff', fontFamily: 'monospace' }}>
          DJ Cyber
        </h1>

        {/* Status (desktop only, mobile has top bar) */}
        <div className="hidden md:block px-3 py-2 rounded-lg text-sm" style={{
          background: '#16213e',
          borderLeft: `4px solid ${wsConnected ? (chunkCount > 0 ? '#e94560' : '#4caf50') : '#f44336'}`,
        }}>
          {status} {chunkCount > 0 && `| ${chunkCount} chunks`}
        </div>

        {/* Visualizer */}
        <canvas ref={canvasRef} width={600} height={60}
          style={{ width: '100%', height: 60, background: '#0a0a1a', borderRadius: 8 }} />

        {/* Controls */}
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => {
              if (wsConnected) {
                autoReconnectRef.current = false;
                wsRef.current?.close();
              } else {
                connectWs();
              }
            }}
            className="px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer flex-1 min-w-[100px]"
            style={{ background: wsConnected ? '#f44336' : '#2196f3', color: '#fff' }}>
            {wsConnected ? '断开' : '连接 Lyria'}
          </button>
          <button onClick={() => sendWs({ command: 'pause' })} disabled={!wsConnected}
            className="px-3 py-2 rounded-lg text-sm cursor-pointer disabled:opacity-40"
            style={{ background: '#ff9800', color: '#fff' }}>
            暂停
          </button>
          <button onClick={() => { autoReconnectRef.current = false; sendWs({ command: 'stop' }); }} disabled={!wsConnected}
            className="px-3 py-2 rounded-lg text-sm cursor-pointer disabled:opacity-40"
            style={{ background: '#666', color: '#fff' }}>
            停止
          </button>
        </div>

        {/* Lyria Controls: mute/mode toggles */}
        {wsConnected && (
          <div className="rounded-lg p-3 text-xs space-y-2" style={{ background: '#16213e' }}>
            <div style={{ color: '#e94560', fontWeight: 600 }}>音轨控制</div>
            <div className="flex gap-2 flex-wrap">
              {[
                { key: 'mute_bass', label: '静音低音' },
                { key: 'mute_drums', label: '静音鼓' },
                { key: 'only_bass_and_drums', label: '仅低音+鼓' },
              ].map(({ key, label }) => (
                <button key={key}
                  onClick={() => {
                    const newVal = !currentConfig[key];
                    const fullConfig = { bpm: 120, temperature: 1.1, guidance: 4.0, density: 0.5, brightness: 0.5, ...currentConfig, [key]: newVal };
                    const { scale: _s, ...safe } = fullConfig as Record<string, unknown>;
                    setCurrentConfig(safe);
                    sendWs({ command: 'set_config', config: safe });
                    lastSentConfigRef.current = JSON.stringify(safe);
                  }}
                  className="px-2 py-1 rounded text-xs cursor-pointer transition-colors"
                  style={{
                    background: currentConfig[key] ? '#e94560' : '#1a1a2e',
                    color: currentConfig[key] ? '#fff' : '#888',
                    border: `1px solid ${currentConfig[key] ? '#e94560' : '#333'}`,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <div style={{ color: '#e94560', fontWeight: 600, marginTop: 4 }}>生成模式</div>
            <div className="flex gap-2">
              {(['QUALITY', 'DIVERSITY', 'VOCALIZATION'] as const).map(mode => {
                const current = (currentConfig.music_generation_mode as string) || 'QUALITY';
                const labels: Record<string, string> = { QUALITY: '高质量', DIVERSITY: '多样性', VOCALIZATION: '人声' };
                return (
                  <button key={mode}
                    onClick={() => {
                      const fullConfig = { bpm: 120, temperature: 1.1, guidance: 4.0, density: 0.5, brightness: 0.5, ...currentConfig, music_generation_mode: mode };
                      const { scale: _s, ...safe } = fullConfig as Record<string, unknown>;
                      setCurrentConfig(safe);
                      sendWs({ command: 'set_config', config: safe });
                      sendWs({ command: 'reset_context' });
                      sendWs({ command: 'play' });
                      lastSentConfigRef.current = JSON.stringify(safe);
                    }}
                    className="px-2 py-1 rounded text-xs cursor-pointer transition-colors flex-1 text-center"
                    style={{
                      background: current === mode ? '#e94560' : '#1a1a2e',
                      color: current === mode ? '#fff' : '#888',
                      border: `1px solid ${current === mode ? '#e94560' : '#333'}`,
                    }}
                  >
                    {labels[mode]}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Current params */}
        {currentPrompts.length > 0 && (
          <div className="rounded-lg p-3 text-xs space-y-2 overflow-y-auto" style={{ background: '#16213e', maxHeight: 200 }}>
            <div style={{ color: '#e94560', fontWeight: 600 }}>Prompts</div>
            {currentPrompts.map((p, i) => (
              <div key={i} className="flex gap-2 items-start">
                <span className="shrink-0 px-1 rounded" style={{ background: '#e94560', color: '#fff', fontSize: 10 }}>
                  {p.weight}
                </span>
                <span style={{ color: '#ccc', lineHeight: '1.3' }}>{p.text}</span>
              </div>
            ))}
            {Object.keys(currentConfig).length > 0 && (
              <>
                <div style={{ color: '#e94560', fontWeight: 600, marginTop: 4 }}>Config</div>
                <div className="flex gap-x-3 gap-y-1 flex-wrap" style={{ color: '#999' }}>
                  {Object.entries(currentConfig).map(([k, v]) => (
                    <span key={k}><span style={{ color: '#666' }}>{k}:</span> {String(v)}</span>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* System Prompt (desktop only) */}
        <div className="hidden md:block mt-auto rounded-lg overflow-hidden" style={{ background: '#16213e' }}>
          <button
            onClick={() => setShowPrompt(!showPrompt)}
            className="w-full px-3 py-2 text-left text-xs font-semibold cursor-pointer flex justify-between items-center"
            style={{ color: '#e94560' }}
          >
            <span>System Prompt</span>
            <span style={{ color: '#666' }}>{showPrompt ? '▼' : '▶'}</span>
          </button>
          {showPrompt && (
            <pre className="px-3 pb-3 text-xs leading-relaxed overflow-y-auto whitespace-pre-wrap" style={{
              color: '#aaa', maxHeight: 400, fontFamily: 'monospace', fontSize: 11,
            }}>
              {SYSTEM_PROMPT}
            </pre>
          )}
        </div>
      </div>

      {/* ─── Chat Area ─── */}
      <div className={`${showPanel ? 'hidden' : 'flex'} md:flex flex-1 flex-col min-w-0`}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 md:px-4 py-3 space-y-3 min-h-0">
          {messages.length === 0 && (
            <div className="text-center py-12 md:py-20" style={{ color: '#444' }}>
              <div className="text-lg mb-2">DJ Cyber 准备就绪</div>
              <div className="text-sm">告诉我你想听什么音乐</div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[85%] md:max-w-[80%]">
                {msg.role === 'user' ? (
                  <div className="rounded-lg px-3 py-2 text-sm" style={{ background: '#162447', color: '#88d8f8' }}>
                    {msg.text}
                  </div>
                ) : msg.role === 'system' ? (
                  <div className="rounded-lg px-3 py-2 text-xs" style={{ background: '#2a0a0a', color: '#ff6b6b' }}>
                    {msg.text}
                  </div>
                ) : (
                  <div>
                    <div className="rounded-lg px-3 py-2 text-sm" style={{ background: '#1a1a2e', borderLeft: '3px solid #e94560' }}>
                      <span className="font-bold text-xs mr-1" style={{ color: '#e94560' }}>DJ Cyber</span>
                      <span style={{ color: '#ccc' }}>{msg.text}</span>
                    </div>
                    {msg.params && (
                      <div className="mt-1 rounded px-2 py-1 text-xs flex gap-2 md:gap-3 flex-wrap" style={{ background: '#111', color: '#666' }}>
                        {msg.params.action && <span style={{ color: '#4caf50' }}>{msg.params.action}</span>}
                        {msg.params.config?.bpm != null && <span>{'BPM:' + String(msg.params.config.bpm)}</span>}
                        {msg.params.prompts?.[0] && <span className="truncate max-w-[160px] md:max-w-[200px]" title={msg.params.prompts[0].text}>{String(msg.params.prompts[0].text)}</span>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-lg px-3 py-2 text-sm animate-pulse" style={{ background: '#1a1a2e', color: '#888' }}>
                DJ Cyber 调音中...
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Screenshot preview */}
        {screenPreview && (
          <div className="shrink-0 px-3 md:px-4 py-2 border-t border-[#1a1a2e]">
            <div className="relative inline-block">
              <img src={screenPreview} alt="截屏" className="rounded-lg max-h-[80px] md:max-h-[120px] opacity-70" />
              <button onClick={() => setScreenPreview(null)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full text-xs cursor-pointer flex items-center justify-center"
                style={{ background: '#333', color: '#aaa' }}>x</button>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="shrink-0 px-3 md:px-4 py-2 flex gap-1.5 md:gap-2 flex-wrap border-t border-[#1a1a2e]">
          {quickActions.map((q) => (
            <button key={q} onClick={() => { setInput(q); }}
              className="px-2.5 md:px-3 py-1 rounded-full text-xs cursor-pointer transition-colors hover:border-[#e94560]"
              style={{ background: '#111', border: '1px solid #333', color: '#888' }}>
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="shrink-0 flex gap-2 px-3 md:px-4 py-2 md:py-3 border-t border-[#222]"
          style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="告诉 DJ Cyber 你想听什么..."
            disabled={isLoading}
            className="flex-1 bg-[#111] text-[#eee] text-sm rounded-lg px-3 py-2.5 border border-[#333] outline-none focus:border-[#e94560] placeholder-[#555] disabled:opacity-50" />
          <button type="submit" disabled={isLoading || !input.trim()}
            className="px-4 md:px-5 py-2.5 text-sm font-semibold rounded-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            style={{ background: '#e94560', color: '#fff' }}>
            发送
          </button>
        </form>
      </div>
    </div>
  );
}
