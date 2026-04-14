import os
os.environ['TF_FORCE_GPU_ALLOW_GROWTH'] = 'true'
import tensorflow as tf
gpus = tf.config.list_physical_devices('GPU')
for gpu in gpus:
    tf.config.experimental.set_memory_growth(gpu, True)
import subprocess, asyncio, json, base64, re, time
import numpy as np
subprocess.run(['fuser', '-k', '8765/tcp'], capture_output=True)
subprocess.run(['pkill', '-f', 'cloudflared'], capture_output=True)
time.sleep(0.5)
subprocess.run(['wget', '-q', 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64', '-O', '/usr/local/bin/cloudflared'], check=True)
subprocess.run(['chmod', '+x', '/usr/local/bin/cloudflared'], check=True)
import nest_asyncio
nest_asyncio.apply()
import websockets
from magenta_rt import system
if 'mrt' not in dir() or mrt is None:
    print('Loading model...')
    mrt = system.MagentaRT()
    print('Model loaded. Warmup...')
    style0 = mrt.embed_style('chill ambient music')
    c0, s0 = mrt.generate_chunk(style=style0)
    print(f'Warmup done. Chunk shape: {c0.samples.shape}')
else:
    print('Model already loaded, skipping warmup.')
style_cache = {}
def get_style(t):
    if t not in style_cache:
        style_cache[t] = mrt.embed_style(t)
    return style_cache[t]
def blend_styles(ps):
    if not ps:
        return get_style('chill ambient music with soft piano and warm pads')
    if len(ps) == 1:
        return get_style(ps[0]['text'])
    ss = [get_style(p['text']) for p in ps]
    w = np.array([p.get('weight', 1.0) for p in ps])
    w = w / w.sum()
    return (w[:, np.newaxis] * np.stack(ss)).mean(axis=0)
def chunk_to_msg(c):
    int16 = np.clip(c.samples.flatten() * 32767, -32768, 32767).astype(np.int16)
    raw_size = len(int16.tobytes())
    proc = subprocess.run(
        ['ffmpeg', '-y', '-f', 's16le', '-ar', '48000', '-ac', '2', '-i', 'pipe:0',
         '-c:a', 'libopus', '-b:a', '128k', '-vbr', 'on', '-f', 'ogg', 'pipe:1'],
        input=int16.tobytes(), capture_output=True
    )
    if proc.returncode != 0:
        print(f'[ffmpeg error] {proc.stderr.decode()[-200:]}')
        b64 = base64.b64encode(int16.tobytes()).decode('ascii')
        return json.dumps({'type': 'audio', 'data': b64})
    opus_data = proc.stdout
    b64 = base64.b64encode(opus_data).decode('ascii')
    ratio = len(opus_data) / raw_size * 100
    print(f'[opus] {raw_size // 1024}KB -> {len(opus_data) // 1024}KB ({ratio:.0f}%) -> {len(b64) // 1024}KB b64')
    return json.dumps({'type': 'audio', 'data': b64, 'enc': 'opus'})
async def handle(ws):
    playing = False
    style = None
    gs = None
    gt = None
    gen_queue = asyncio.Queue(maxsize=6)
    async def generator():
        nonlocal gs, playing, style
        while playing:
            try:
                s = style if style is not None else get_style('chill ambient music with soft piano')
                t0 = time.time()
                c, gs2 = mrt.generate_chunk(state=gs, style=s)
                gs = gs2
                gen_time = time.time() - t0
                if not playing:
                    break
                msg = chunk_to_msg(c)
                await gen_queue.put(msg)
                print(f'[gen] {gen_time:.2f}s -> queue={gen_queue.qsize()}')
            except asyncio.CancelledError:
                break
            except Exception as e:
                await gen_queue.put(e)
                break
    async def sender():
        while playing:
            try:
                item = await asyncio.wait_for(gen_queue.get(), timeout=10)
                if isinstance(item, Exception):
                    await ws.send(json.dumps({'type': 'error', 'message': str(item)}))
                    break
                if not playing:
                    break
                t0 = time.time()
                await ws.send(item)
                send_time = time.time() - t0
                print(f'[send] {send_time:.2f}s')
            except asyncio.TimeoutError:
                continue
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f'[send error] {e}')
                break
    await ws.send(json.dumps({'type': 'status', 'message': 'connected'}))
    try:
        async for raw in ws:
            m = json.loads(raw)
            cmd = m.get('command')
            print(f'[cmd] {cmd}')
            if cmd == 'set_prompts':
                ps = m.get('prompts', [])
                if ps:
                    style = blend_styles(ps)
                    print(f'[style] changed to: {[p["text"][:30] for p in ps]}')
                    cleared = 0
                    while not gen_queue.empty():
                        try:
                            gen_queue.get_nowait()
                            cleared += 1
                        except Exception:
                            break
                    if cleared:
                        print(f'[style] cleared {cleared} old chunks from queue')
            elif cmd == 'play' and not playing:
                playing = True
                gs = None
                while not gen_queue.empty():
                    try:
                        gen_queue.get_nowait()
                    except Exception:
                        break
                await ws.send(json.dumps({'type': 'status', 'message': '播放中'}))
                gt = asyncio.gather(asyncio.create_task(generator()), asyncio.create_task(sender()))
            elif cmd in ('pause', 'stop'):
                playing = False
                if gt:
                    gt.cancel()
                    try:
                        await gt
                    except Exception:
                        pass
                    gt = None
                if cmd == 'stop':
                    gs = None
                await ws.send(json.dumps({'type': 'status', 'message': '已暂停' if cmd == 'pause' else '已停止'}))
            elif cmd == 'reset_context':
                gs = None
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        playing = False
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
print(f'\nWS URL: {ws_url}')
print(f'NEXT_PUBLIC_WS_URL={ws_url}')
async def run():
    async with websockets.serve(handle, '0.0.0.0', PORT, max_size=10 * 1024 * 1024):
        await asyncio.Future()
asyncio.get_event_loop().run_until_complete(run())
