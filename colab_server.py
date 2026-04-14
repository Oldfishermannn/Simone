import os
os.environ['TF_FORCE_GPU_ALLOW_GROWTH'] = 'true'
import tensorflow as tf
gpus = tf.config.list_physical_devices('GPU')
for gpu in gpus:
    tf.config.experimental.set_memory_growth(gpu, True)
import subprocess, asyncio, json, base64, re, time, threading
import numpy as np
from concurrent.futures import ThreadPoolExecutor
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

# Single-thread executor: keeps TF/JAX on one thread but doesn't block event loop
_executor = ThreadPoolExecutor(max_workers=1)

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
def encode_opus(int16_bytes):
    proc = subprocess.run(
        ['ffmpeg', '-y', '-f', 's16le', '-ar', '48000', '-ac', '2', '-i', 'pipe:0',
         '-c:a', 'libopus', '-b:a', '128k', '-vbr', 'on', '-f', 'ogg', 'pipe:1'],
        input=int16_bytes, capture_output=True
    )
    if proc.returncode != 0:
        return None
    return proc.stdout
gen_config = {'temperature': 1.3, 'guidance_weight': 5.0, 'topk': 40}

def gen_one_chunk(gs, s):
    """Run in thread — blocking but doesn't hold event loop."""
    t0 = time.time()
    c, gs2 = mrt.generate_chunk(
        state=gs, style=s,
        temperature=gen_config['temperature'],
        guidance_weight=gen_config['guidance_weight'],
        topk=gen_config['topk'],
    )
    gen_time = time.time() - t0
    # 5ms sin² crossfade (240 samples) — matched with client-side 5ms overlap for gapless playback
    samples = c.samples  # shape (96000, 2)
    fade_len = 240  # 5ms at 48kHz — must match client OVERLAP_SECONDS = 0.005
    fade_in = np.sin(np.linspace(0, np.pi/2, fade_len)) ** 2
    fade_out = np.sin(np.linspace(np.pi/2, 0, fade_len)) ** 2
    samples[:fade_len] *= fade_in[:, np.newaxis]
    samples[-fade_len:] *= fade_out[:, np.newaxis]
    int16 = np.clip(samples.flatten() * 32767, -32768, 32767).astype(np.int16)
    raw_bytes = int16.tobytes()
    opus_data = encode_opus(raw_bytes)
    if opus_data is None:
        b64 = base64.b64encode(raw_bytes).decode('ascii')
        msg = json.dumps({'type': 'audio', 'data': b64})
    else:
        b64 = base64.b64encode(opus_data).decode('ascii')
        ratio = len(opus_data) / len(raw_bytes) * 100
        print(f'[opus] {len(raw_bytes)//1024}KB -> {len(opus_data)//1024}KB ({ratio:.0f}%)')
        msg = json.dumps({'type': 'audio', 'data': b64, 'enc': 'opus'})
    print(f'[gen] {gen_time:.2f}s')
    return msg, gs2
TRANSITION_CHUNKS = 2  # interpolate over 2 chunks (4 seconds)

async def handle(ws):
    playing = False
    style = None
    style_target = None  # target style for interpolation
    style_from = None    # starting style for interpolation
    style_current = None # last actually-output style (for accurate interrupt)
    transition_step = 0  # 0 = no transition, 1..TRANSITION_CHUNKS = interpolating
    gs = None
    gt = None
    style_ver = 0
    loop = asyncio.get_event_loop()
    async def gen_and_send():
        nonlocal gs, playing, style, style_ver, style_target, style_from, style_current, transition_step
        while playing:
            try:
                # Compute current style with interpolation
                if transition_step > 0 and style_from is not None and style_target is not None:
                    t = transition_step / TRANSITION_CHUNKS
                    s = style_from + t * (style_target - style_from)
                    print(f'[transition] step {transition_step}/{TRANSITION_CHUNKS} t={t:.2f}')
                    transition_step += 1
                    if transition_step > TRANSITION_CHUNKS:
                        style = style_target
                        style_from = None
                        style_target = None
                        transition_step = 0
                        print(f'[transition] complete')
                    s_current = s
                else:
                    s_current = style if style is not None else get_style('chill ambient music with soft piano')
                style_current = s_current  # track last output for accurate interrupt
                ver_before = style_ver
                msg, gs2 = await loop.run_in_executor(_executor, gen_one_chunk, gs, s_current)
                # Style changed during generation — don't discard, let interpolation handle it
                if style_ver != ver_before and transition_step == 0:
                    # New style arrived while generating, but we already have the chunk
                    # Just send it and let the next iteration pick up the interpolation
                    pass
                gs = gs2
                if not playing:
                    break
                await ws.send(msg)
                print(f'[sent] queue direct')
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f'[error] {e}')
                await ws.send(json.dumps({'type': 'error', 'message': str(e)}))
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
                    new_style = blend_styles(ps)
                    style_ver += 1
                    if style is not None:
                        # Start interpolation from last actually-output style
                        style_from = style_current.copy() if style_current is not None else style.copy()
                        style_target = new_style
                        transition_step = 1
                        print(f'[style] v{style_ver} transitioning to: {[p["text"][:30] for p in ps]}')
                    else:
                        # First style — set immediately
                        style = new_style
                        print(f'[style] v{style_ver} set to: {[p["text"][:30] for p in ps]}')
            elif cmd == 'play' and not playing:
                playing = True
                gs = None
                await ws.send(json.dumps({'type': 'status', 'message': '播放中'}))
                gt = asyncio.create_task(gen_and_send())
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
            elif cmd == 'set_config':
                cfg = m.get('config', {})
                if 'temperature' in cfg:
                    gen_config['temperature'] = max(0.0, min(4.0, float(cfg['temperature'])))
                if 'guidance_weight' in cfg:
                    gen_config['guidance_weight'] = max(0.0, min(10.0, float(cfg['guidance_weight'])))
                if 'topk' in cfg:
                    gen_config['topk'] = max(1, min(1024, int(cfg['topk'])))
                print(f'[config] temp={gen_config["temperature"]:.1f} guide={gen_config["guidance_weight"]:.1f} topk={gen_config["topk"]}')
                await ws.send(json.dumps({'type': 'status', 'message': '参数已更新'}))
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
