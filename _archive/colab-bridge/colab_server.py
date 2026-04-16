"""
Simone — Lyria RealTime WS Bridge
Browser <-> WebSocket (Cloudflare Tunnel) <-> This server <-> Google Lyria RealTime API

No GPU needed. Just a GEMINI_API_KEY.
"""
import os, subprocess, asyncio, json, base64, re, time
import nest_asyncio
nest_asyncio.apply()
import websockets
from google import genai
from google.genai import types

# API key: env var or notebook global
API_KEY = os.environ.get('GEMINI_API_KEY', '')
if not API_KEY:
    API_KEY = globals().get('GEMINI_API_KEY', '') or ''
if not API_KEY:
    raise ValueError('GEMINI_API_KEY not set. Set as env var or in notebook.')

# Kill old processes
subprocess.run(['fuser', '-k', '8765/tcp'], capture_output=True)
subprocess.run(['pkill', '-f', 'cloudflared'], capture_output=True)
time.sleep(0.5)

# Install cloudflared
subprocess.run(['wget', '-q',
    'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64',
    '-O', '/usr/local/bin/cloudflared'], check=True)
subprocess.run(['chmod', '+x', '/usr/local/bin/cloudflared'], check=True)

client = genai.Client(api_key=API_KEY, http_options={'api_version': 'v1alpha'})
MODEL = 'models/lyria-realtime-exp'

async def handle(ws):
    print('[ws] Browser connected')
    recv_task = None
    try:
        async with client.aio.live.music.connect(model=MODEL) as session:
            print('[lyria] Connected to Lyria RealTime')
            await ws.send(json.dumps({'type': 'status', 'message': 'connected'}))

            # Background task: accumulate small Lyria chunks into ~0.5s buffers
            async def forward_audio():
                BUFFER_TARGET = 384000  # 48kHz * 2ch * 2bytes * 2s
                audio_buffer = bytearray()
                chunk_count = 0
                try:
                    async for message in session.receive():
                        if not hasattr(message, 'server_content') or not message.server_content:
                            continue
                        sc = message.server_content
                        if not hasattr(sc, 'audio_chunks') or not sc.audio_chunks:
                            continue
                        for chunk in sc.audio_chunks:
                            audio_buffer.extend(chunk.data)
                            chunk_count += 1
                            if len(audio_buffer) >= BUFFER_TARGET:
                                send_len = len(audio_buffer) - (len(audio_buffer) % 2)
                                if send_len > 0:
                                    b64 = base64.b64encode(bytes(audio_buffer[:send_len])).decode('ascii')
                                    await ws.send(json.dumps({'type': 'audio', 'data': b64}))
                                    print(f'[audio] {send_len} bytes ({chunk_count} chunks)')
                                    chunk_count = 0
                                    audio_buffer = bytearray(audio_buffer[send_len:])
                except asyncio.CancelledError:
                    pass
                except Exception as e:
                    print(f'[lyria recv] {e}')

            recv_task = asyncio.create_task(forward_audio())

            # Track current config so we always send full config (Lyria resets unset fields)
            current_config = {
                'temperature': 1.1,
                'guidance': 4.0,
                'top_k': 40,
            }

            # Main loop: browser commands → Lyria
            async for raw in ws:
                m = json.loads(raw)
                cmd = m.get('command')
                print(f'[cmd] {cmd}')

                if cmd == 'set_prompts':
                    ps = m.get('prompts', [])
                    if ps:
                        prompts = [
                            types.WeightedPrompt(text=p['text'], weight=p.get('weight', 1.0))
                            for p in ps
                        ]
                        await session.set_weighted_prompts(prompts=prompts)
                        print(f'[prompts] {[p["text"][:40] for p in ps]}')

                elif cmd == 'play':
                    await session.play()
                    await ws.send(json.dumps({'type': 'status', 'message': '播放中'}))

                elif cmd == 'pause':
                    await session.pause()
                    await ws.send(json.dumps({'type': 'status', 'message': '已暂停'}))

                elif cmd == 'stop':
                    await session.stop()
                    await ws.send(json.dumps({'type': 'status', 'message': '已停止'}))

                elif cmd == 'set_config':
                    cfg = m.get('config', {})
                    for key in ['temperature', 'guidance', 'density', 'brightness', 'bpm', 'top_k',
                                'mute_bass', 'mute_drums', 'only_bass_and_drums', 'music_generation_mode']:
                        if key in cfg:
                            current_config[key] = cfg[key]
                    config_kwargs = {}
                    for key, val in current_config.items():
                        if key in ('temperature', 'guidance', 'density', 'brightness'):
                            config_kwargs[key] = float(val)
                        elif key in ('bpm', 'top_k'):
                            config_kwargs[key] = int(val)
                        elif key in ('mute_bass', 'mute_drums', 'only_bass_and_drums'):
                            config_kwargs[key] = bool(val)
                        elif key == 'music_generation_mode':
                            mode_map = {
                                'QUALITY': types.MusicGenerationMode.QUALITY,
                                'DIVERSITY': types.MusicGenerationMode.DIVERSITY,
                                'VOCALIZATION': types.MusicGenerationMode.VOCALIZATION,
                            }
                            if val in mode_map:
                                config_kwargs[key] = mode_map[val]
                    config = types.LiveMusicGenerationConfig(**config_kwargs)
                    await session.set_music_generation_config(config=config)
                    print(f'[config] {config_kwargs}')
                    await ws.send(json.dumps({'type': 'status', 'message': '参数已更新'}))

                elif cmd == 'reset_context':
                    await session.reset_context()

    except websockets.exceptions.ConnectionClosed:
        pass
    except Exception as e:
        print(f'[error] {e}')
        try:
            await ws.send(json.dumps({'type': 'error', 'message': str(e)}))
        except:
            pass
    finally:
        if recv_task:
            recv_task.cancel()
        print('[ws] Browser disconnected')

# --- Cloudflare Tunnel + WS Server ---
PORT = 8765
p = subprocess.Popen(
    ['cloudflared', 'tunnel', '--url', f'http://localhost:{PORT}', '--no-autoupdate'],
    stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
)
url = None
for _ in range(30):
    line = p.stderr.readline()
    x = re.search(r'(https://[a-z0-9-]+\.trycloudflare\.com)', line)
    if x:
        url = x.group(1)
        break
    time.sleep(0.5)
ws_url = url.replace('https://', 'wss://') if url else 'FAILED'
print(f'\n🎵 WS URL: {ws_url}')
print(f'NEXT_PUBLIC_WS_URL={ws_url}')
print(f'\n把上面的地址粘贴到 Simone 页面的 ⚙️ 设置里')

from websockets.http11 import Response
def reject_non_ws(connection, request):
    upgrade = request.headers.get('Upgrade', '').lower()
    if upgrade != 'websocket':
        return Response(200, 'OK', websockets.Headers())
    return None

async def run():
    async with websockets.serve(handle, '0.0.0.0', PORT, max_size=10*1024*1024, process_request=reject_non_ws):
        await asyncio.Future()

asyncio.get_event_loop().run_until_complete(run())
