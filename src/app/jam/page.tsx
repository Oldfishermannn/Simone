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
const WS_URL = 'ws://localhost:8765/ws';
const SAMPLE_RATE = 48000;
const CHANNELS = 2;

const SYSTEM_PROMPT = `你是一个音乐 AI 协作者，帮助用户实时创作音乐。你的名字叫 DJ Cyber。

你的职责：
1. 自然地和用户聊音乐，理解他们想要什么风格、情绪、节奏
2. 每次回复都要在文字之后附带一个 JSON 参数块，用来控制实时音乐生成

回复格式（严格遵循）：
先写你的对话文字（1-3句，简洁有力），然后换行输出参数 JSON：

\`\`\`json
{
  "prompts": [{"text": "英文风格描述", "weight": 1.0}],
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

参数说明：
- prompts.text: 英文音乐风格描述（如 "chill lofi hip hop with soft piano and vinyl crackle"）
- prompts.weight: 权重，通常 1.0
- config.bpm: 节奏速度 60-200
- config.temperature: 创意程度 0.0-3.0（越高越随机）
- config.guidance: 提示词遵循程度 0.0-6.0（越高越严格跟随描述）
- config.density: 音符密度 0.0-1.0
- config.brightness: 音调亮度 0.0-1.0
- config.scale: 可选，音阶如 "C_MAJOR", "A_MINOR", "D_MAJOR" 等
- config.top_k: 采样多样性 1-1000，默认 40
- config.mute_bass: 静音低音 true/false
- config.mute_drums: 静音鼓 true/false
- config.only_bass_and_drums: 仅保留低音+鼓 true/false
- config.music_generation_mode: "QUALITY" / "DIVERSITY" / "VOCALIZATION"
- action: "play"=开始播放, "update"=更新参数, "pause"=暂停, "stop"=停止

规则：
1. 用中文聊天，prompts.text 用英文
2. 用户第一次说想听什么时，action 用 "play"
3. 之后的调整用 "update"
4. 用户说停/暂停时用对应 action
5. 根据聊天内容渐进调整参数，不要剧烈变化
6. 保持个性：你是一个酷酷的 DJ，懂很多音乐风格`;

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
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [currentBpm, setCurrentBpm] = useState(0);
  const [showPrompt, setShowPrompt] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const nextPlayTimeRef = useRef(0);
  const chunkCountRef = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef(0);
  const lyriaReadyRef = useRef(false);
  const lyriaReadyResolveRef = useRef<(() => void) | null>(null);
  const lastUpdateRef = useRef<LyriaUpdate | null>(null);
  const autoReconnectRef = useRef(false); // true = should auto-reconnect on close
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // ─── Audio playback with buffer queue ───
  const audioQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef(false);
  const BUFFER_MIN = 3; // accumulate N chunks before starting playback

  const drainQueue = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx || audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      return;
    }
    isPlayingRef.current = true;

    while (audioQueueRef.current.length > 0) {
      const b64Data = audioQueueRef.current.shift()!;
      const raw = atob(b64Data);
      const bytes = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
      const int16 = new Int16Array(bytes.buffer);
      const numSamples = int16.length / CHANNELS;
      if (numSamples === 0) continue;
      const buffer = ctx.createBuffer(CHANNELS, numSamples, SAMPLE_RATE);
      for (let ch = 0; ch < CHANNELS; ch++) {
        const channelData = buffer.getChannelData(ch);
        for (let i = 0; i < numSamples; i++) {
          channelData[i] = int16[i * CHANNELS + ch] / 32768;
        }
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(analyserRef.current!);
      const now = ctx.currentTime;
      // If we've fallen behind, jump ahead with a small gap
      if (nextPlayTimeRef.current < now) {
        nextPlayTimeRef.current = now + 0.005;
      }
      source.start(nextPlayTimeRef.current);
      nextPlayTimeRef.current += buffer.duration;
    }
  }, []);

  const playAudioChunk = useCallback((b64Data: string) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    audioQueueRef.current.push(b64Data);
    // Wait until we have enough chunks buffered before starting
    if (!isPlayingRef.current && audioQueueRef.current.length < BUFFER_MIN) return;
    drainQueue();
  }, [drainQueue]);

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
        const ctx = new AudioContext({ sampleRate: SAMPLE_RATE });
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.connect(ctx.destination);
        audioCtxRef.current = ctx;
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
          setStatus(data.message);
          // "connected" = Lyria session is ready
          if (data.message === 'connected' && !lyriaReadyRef.current) {
            lyriaReadyRef.current = true;
            lyriaReadyResolveRef.current?.();
            lyriaReadyResolveRef.current = null;
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
      setCurrentPrompt(update.prompts[0].text);
    }

    if (update.config && Object.keys(update.config).length > 0) {
      // Remove scale field - Lyria API rejects string enum values from Gemini
      const { scale: _scale, ...safeConfig } = update.config;
      if (Object.keys(safeConfig).length > 0) {
        sendWs({ command: 'set_config', config: safeConfig });
      }
      if (update.config.bpm) setCurrentBpm(update.config.bpm as number);
    }

    if (update.action) {
      if (update.action === 'play' || update.action === 'update') {
        sendWs({ command: 'play' });
        setStatus('播放中');
      } else if (update.action === 'pause') {
        sendWs({ command: 'pause' });
        setStatus('已暂停');
      } else if (update.action === 'stop') {
        autoReconnectRef.current = false;
        sendWs({ command: 'stop' });
        setStatus('已停止');
      } else if (update.action === 'reset_context') {
        sendWs({ command: 'reset_context' });
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

      if (!res.ok) throw new Error(`API error ${res.status}`);
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
      const saved = lastUpdateRef.current;
      reconnectTimerRef.current = setTimeout(() => {
        connectWs().then(() => {
          applyLyriaUpdate(saved);
        }).catch(() => {
          setStatus('重连失败');
          autoReconnectRef.current = false;
        });
      }, 1000);
      return () => {
        if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      };
    }
  }, [wsConnected, connectWs, applyLyriaUpdate]);

  useEffect(() => {
    return () => {
      autoReconnectRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      wsRef.current?.close();
    };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0a0a14', color: '#e0e0e0' }}>
      {/* Left: Music Player */}
      <div className="w-[380px] shrink-0 flex flex-col border-r border-[#222] p-4 gap-4">
        <h1 className="text-xl font-bold" style={{ color: '#00ffff', fontFamily: 'monospace' }}>
          Jam Session
        </h1>

        {/* Status */}
        <div className="px-3 py-2 rounded-lg text-sm" style={{
          background: '#16213e',
          borderLeft: `4px solid ${wsConnected ? (chunkCount > 0 ? '#e94560' : '#4caf50') : '#f44336'}`,
        }}>
          {status} {chunkCount > 0 && `| ${chunkCount} chunks`}
        </div>

        {/* Visualizer */}
        <canvas ref={canvasRef} width={600} height={80}
          style={{ width: '100%', height: 80, background: '#0a0a1a', borderRadius: 8 }} />

        {/* Current params */}
        {currentPrompt && (
          <div className="rounded-lg p-3 text-xs space-y-1" style={{ background: '#16213e' }}>
            <div style={{ color: '#e94560' }}>当前风格</div>
            <div style={{ color: '#ccc' }}>{currentPrompt}</div>
            {currentBpm > 0 && <div style={{ color: '#888' }}>BPM: {currentBpm}</div>}
          </div>
        )}

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
            className="px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer"
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

        {/* System Prompt */}
        <div className="mt-auto rounded-lg overflow-hidden" style={{ background: '#16213e' }}>
          <button
            onClick={() => setShowPrompt(!showPrompt)}
            className="w-full px-3 py-2 text-left text-xs font-semibold cursor-pointer flex justify-between items-center"
            style={{ color: '#e94560' }}
          >
            <span>Gemini System Prompt</span>
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

      {/* Right: Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
          {messages.length === 0 && (
            <div className="text-center py-20" style={{ color: '#444' }}>
              <div className="text-lg mb-2">DJ Cyber 准备就绪</div>
              <div className="text-sm">告诉我你想听什么音乐，我来实时生成</div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[80%]">
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
                      <div className="mt-1 rounded px-2 py-1 text-xs flex gap-3 flex-wrap" style={{ background: '#111', color: '#666' }}>
                        {msg.params.action && <span style={{ color: '#4caf50' }}>{msg.params.action}</span>}
                        {msg.params.config?.bpm != null && <span>{'BPM:' + String(msg.params.config.bpm)}</span>}
                        {msg.params.config?.density != null && <span>{'密度:' + String(msg.params.config.density)}</span>}
                        {msg.params.config?.brightness != null && <span>{'亮度:' + String(msg.params.config.brightness)}</span>}
                        {msg.params.prompts?.[0] && <span className="truncate max-w-[200px]" title={msg.params.prompts[0].text}>{String(msg.params.prompts[0].text)}</span>}
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
          <div className="shrink-0 px-4 py-2 border-t border-[#1a1a2e]">
            <div className="relative inline-block">
              <img src={screenPreview} alt="截屏" className="rounded-lg max-h-[120px] opacity-70" />
              <button onClick={() => setScreenPreview(null)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full text-xs cursor-pointer flex items-center justify-center"
                style={{ background: '#333', color: '#aaa' }}>x</button>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="shrink-0 px-4 py-2 flex gap-2 flex-wrap border-t border-[#1a1a2e]">
          <button onClick={handleScreenCapture} disabled={isAnalyzing}
            className="px-3 py-1 rounded-full text-xs cursor-pointer transition-colors disabled:opacity-40"
            style={{ background: '#1a1a2e', border: '1px solid #e94560', color: '#e94560' }}>
            {isAnalyzing ? '分析中...' : '截屏识别音乐'}
          </button>
          {quickActions.map((q) => (
            <button key={q} onClick={() => { setInput(q); }}
              className="px-3 py-1 rounded-full text-xs cursor-pointer transition-colors hover:border-[#e94560]"
              style={{ background: '#111', border: '1px solid #333', color: '#888' }}>
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="shrink-0 flex gap-2 px-4 py-3 border-t border-[#222]">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="告诉 DJ Cyber 你想听什么..."
            disabled={isLoading}
            className="flex-1 bg-[#111] text-[#eee] text-sm rounded-lg px-3 py-2.5 border border-[#333] outline-none focus:border-[#e94560] placeholder-[#555] disabled:opacity-50" />
          <button type="submit" disabled={isLoading || !input.trim()}
            className="px-5 py-2.5 text-sm font-semibold rounded-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            style={{ background: '#e94560', color: '#fff' }}>
            发送
          </button>
        </form>
      </div>
    </div>
  );
}
