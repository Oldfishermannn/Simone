"""
Simone — Lyria RealTime Local Server
Run locally on Mac, no Colab needed.
Usage: GEMINI_API_KEY=xxx python -u local_server.py
"""
import os, asyncio, json, base64
import nest_asyncio
nest_asyncio.apply()
import websockets
from google import genai
from google.genai import types

API_KEY = os.environ.get('GEMINI_API_KEY', '')
if not API_KEY:
    raise ValueError('Set GEMINI_API_KEY env var')

client = genai.Client(api_key=API_KEY, http_options={'api_version': 'v1alpha'})
MODEL = 'models/lyria-realtime-exp'

async def handle(ws):
    print('[ws] Browser connected')
    recv_task = None
    try:
        async with client.aio.live.music.connect(model=MODEL) as session:
            print('[lyria] Connected to Lyria RealTime')
            await ws.send(json.dumps({'type': 'status', 'message': 'connected'}))

            async def forward_audio():
                # Accumulate small Lyria chunks into ~0.5s buffers before sending
                # 48kHz * 2ch * 2bytes * 0.5s = 96000 bytes
                BUFFER_TARGET = 96000
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
                            # Send when we have enough (or at least every chunk if large)
                            if len(audio_buffer) >= BUFFER_TARGET:
                                # Ensure even byte length for Int16
                                send_len = len(audio_buffer) - (len(audio_buffer) % 2)
                                if send_len > 0:
                                    b64 = base64.b64encode(bytes(audio_buffer[:send_len])).decode('ascii')
                                    await ws.send(json.dumps({'type': 'audio', 'data': b64}))
                                    print(f'[audio] {send_len} bytes ({chunk_count} chunks)')
                                    chunk_count = 0
                                    # Keep remainder
                                    audio_buffer = bytearray(audio_buffer[send_len:])
                except asyncio.CancelledError:
                    pass
                except Exception as e:
                    print(f'[lyria recv] {e}')

            recv_task = asyncio.create_task(forward_audio())

            current_config = {'temperature': 1.1, 'guidance': 4.0, 'top_k': 40}

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
                    for key in ['temperature', 'guidance', 'density', 'brightness', 'bpm', 'top_k']:
                        if key in cfg:
                            current_config[key] = cfg[key]
                    config_kwargs = {}
                    for key, val in current_config.items():
                        if key in ('temperature', 'guidance', 'density', 'brightness'):
                            config_kwargs[key] = float(val)
                        elif key in ('bpm', 'top_k'):
                            config_kwargs[key] = int(val)
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

PORT = 8765
print(f'\n🎵 Simone Lyria Server on ws://localhost:{PORT}')
print(f'Set NEXT_PUBLIC_WS_URL=ws://localhost:{PORT} in .env.local\n')

async def run():
    async with websockets.serve(handle, '0.0.0.0', PORT, max_size=10*1024*1024):
        await asyncio.Future()

asyncio.get_event_loop().run_until_complete(run())
