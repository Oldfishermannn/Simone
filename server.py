"""
Lyria RealTime Music Generation - 测试服务端
WebSocket 桥接：浏览器 <-> 本地服务器 <-> Google Lyria RealTime API
"""

import asyncio
import json
import os
import base64
import signal
from google import genai
from google.genai import types
from aiohttp import web

# ─── 自动从 .env.local 读取 ───
def _load_env_local():
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env.local")
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip())

_load_env_local()

# ─── 配置 ───
API_KEY = os.environ.get("GEMINI_API_KEY", "")
MODEL = "models/lyria-realtime-exp"
PORT = 8765


async def handle_websocket(request):
    """处理浏览器 WebSocket 连接，桥接到 Lyria RealTime"""
    ws = web.WebSocketResponse()
    await ws.prepare(request)
    print("[连接] 浏览器已连接")

    client = genai.Client(api_key=API_KEY, http_options={"api_version": "v1alpha"})
    session = None
    receive_task = None

    try:
        async with client.aio.live.music.connect(model=MODEL) as session:
            print("[Lyria] 已连接到 Lyria RealTime")
            await ws.send_json({"type": "status", "message": "connected"})

            # 后台任务：持续接收 Lyria 音频并转发给浏览器
            async def forward_audio():
                try:
                    async for message in session.receive():
                        if hasattr(message, "server_content") and message.server_content:
                            sc = message.server_content
                            if hasattr(sc, "audio_chunks") and sc.audio_chunks:
                                for chunk in sc.audio_chunks:
                                    audio_b64 = base64.b64encode(chunk.data).decode("utf-8")
                                    await ws.send_json({
                                        "type": "audio",
                                        "data": audio_b64
                                    })
                except asyncio.CancelledError:
                    pass
                except Exception as e:
                    print(f"[Lyria 接收错误] {e}")

            receive_task = asyncio.create_task(forward_audio())

            # 主循环：接收浏览器指令并发送给 Lyria
            async for msg in ws:
                if msg.type == web.WSMsgType.TEXT:
                    data = json.loads(msg.data)
                    cmd = data.get("command")
                    print(f"[指令] {cmd}")

                    if cmd == "set_prompts":
                        prompts = [
                            types.WeightedPrompt(text=p["text"], weight=p.get("weight", 1.0))
                            for p in data["prompts"]
                        ]
                        await session.set_weighted_prompts(prompts=prompts)
                        await ws.send_json({"type": "status", "message": "prompts_set"})

                    elif cmd == "set_config":
                        config_dict = data.get("config", {})
                        config = types.LiveMusicGenerationConfig(**config_dict)
                        await session.set_music_generation_config(config=config)
                        await ws.send_json({"type": "status", "message": "config_set"})

                    elif cmd == "play":
                        await session.play()
                        await ws.send_json({"type": "status", "message": "playing"})

                    elif cmd == "pause":
                        await session.pause()
                        await ws.send_json({"type": "status", "message": "paused"})

                    elif cmd == "stop":
                        await session.stop()
                        await ws.send_json({"type": "status", "message": "stopped"})

                    elif cmd == "reset_context":
                        await session.reset_context()
                        await ws.send_json({"type": "status", "message": "context_reset"})

                elif msg.type == web.WSMsgType.ERROR:
                    print(f"[WS 错误] {ws.exception()}")
                    break

    except Exception as e:
        print(f"[错误] {e}")
        try:
            await ws.send_json({"type": "error", "message": str(e)})
        except:
            pass
    finally:
        if receive_task:
            receive_task.cancel()
        print("[连接] 浏览器已断开")

    return ws


async def init_app():
    app = web.Application()
    app.router.add_get("/ws", handle_websocket)
    return app


def main():
    if not API_KEY:
        print("错误: 请设置 GEMINI_API_KEY 环境变量")
        print("  export GEMINI_API_KEY='your-api-key'")
        return

    print(f"Lyria RealTime 测试服务器启动在 http://localhost:{PORT}")
    app = asyncio.run(init_app())
    web.run_app(app, port=PORT)


if __name__ == "__main__":
    main()
