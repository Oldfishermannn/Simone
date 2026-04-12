@AGENTS.md

# Cyber Band - 赛博乐队模拟器

## 项目概述

和赛博乐手聊天编曲，用 Google Lyria RealTime 生成音乐，导出真实可演奏的 lead sheet。

## 技术栈

- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- @google/genai: Gemini 2.0 Flash (对话 + 谱子) + Lyria RealTime (音乐)
- Canvas 2D: 舞台渲染 + 精灵图动画
- Web Audio API: PCM16 播放 + AnalyserNode 频谱分析

## 环境配置

```bash
cp .env.local.example .env.local
# 填入 NEXT_PUBLIC_GEMINI_API_KEY
npm install
npm run dev
```

## 架构

三层分离：
- **视觉层** (`src/canvas/`): Canvas 舞台、精灵图、灯光、节拍同步
- **对话层** (`src/ai/`): 角色 prompt、参数提取、谱子生成
- **音频层** (`src/audio/`): Lyria RealTime 引擎、共享 AudioContext

## 关键路径

- `src/app/page.tsx` — 主页面，状态管理中心
- `src/app/api/chat/route.ts` — Gemini 对话 API
- `src/app/api/generate-sheet/route.ts` — 谱子生成 API
- `src/audio/lyria-engine.ts` — Lyria RealTime 连接
- `src/canvas/stage-renderer.ts` — Canvas 渲染循环

## 命令

- `npm run dev` — 开发服务器
- `npm run build` — 生产构建
- `npm run start` — 生产运行
