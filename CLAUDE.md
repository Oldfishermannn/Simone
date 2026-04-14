@AGENTS.md

# Simone - AI Music Companion

## 项目概述

Simone 是一个温柔知性的音乐陪伴 Agent。用户跟她聊天，她用 Google Lyria RealTime 实时生成适合当下氛围的器乐音乐。适用于学习、开车、派对、居家等场景。

## 技术栈

- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- Claude Sonnet (对话 AI)
- Google Lyria RealTime API (实时音乐生成，通过 Python WS 桥接，无需 GPU)
- Web Audio API: PCM16 播放 + AnalyserNode 频谱分析
- PWA: 可添加到主屏幕

## 环境配置

```bash
cp .env.local.example .env.local
# 填入 ANTHROPIC_API_KEY 和 NEXT_PUBLIC_WS_URL
npm install
npm run dev
```

## 架构

- **前端**: Next.js，全屏氛围背景 + 聊天界面 + 迷你播放器
- **对话 API**: `/api/chat` → Claude Sonnet
- **音乐**: 浏览器 WS → Python 桥接服务 → Lyria RealTime API
- **部署**: Vercel (前端) + Colab/任意服务器 (WS 桥接，无需 GPU)

## 关键路径

- `src/app/page.tsx` — 主页面，状态管理 + 音频引擎 + UI
- `src/app/simone-prompt.ts` — Simone 人设 system prompt
- `src/app/api/chat/route.ts` — Claude 对话 API
- `src/app/components/` — UI 组件（背景、聊天、播放器、风格卡片）
- `colab_server.py` — Python WS 桥接服务（Lyria RealTime API，无需 GPU）

## 命令

- `npm run dev` — 开发服务器
- `npm run build` — 生产构建
- `npm run start` — 生产运行
