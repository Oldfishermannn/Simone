@AGENTS.md

# Simone — AI Mood Radio

## TL;DR

- **是什么**：iOS AI 氛围电台，Google Lyria RealTime 实时生成器乐
- **架构**：客户端直连 Google WebSocket，零服务器，BYOK + 内置 Key
- **当前**：v1.3.0 已上架（2026-04-25），主线 iPad 适配
- **角色**：CEO = 老鱼 · COO = 小克（单角色，必要时 spawn subagent）
- **铁律**：一切可逆 · 改完模拟器跑给老鱼看 · 改音频前 commit checkpoint
- **唤醒**：先读 `SimonePlan.md` + `docs/team-status.md`

## 路线图

**已 ship**：v1.0 / v1.1 / v1.2 Fog City Nocturne / v1.2.1 PromptBuilder / v1.3.0 LIVE on App Store。

**当前主线**：iPad 适配（branch `feature/v2.1-ipad-adapt`）。ship 完看反馈选下一件——候选池见 `SimonePlan.md`。

## 技术栈

SwiftUI + AVFoundation + Keychain · Google Gemini Live Music API (`models/lyria-realtime-exp`) PCM 48kHz stereo · 客户端直连 WebSocket · BYOK + 内置 Key（XOR 混淆）· StoreKit 2 骨架已写（paywall 未启用）

## 目录速查

- `simone ios/` 上架版（独立 git history）
- `simone ios/Simone/`：`Network/` LyriaClient + Keychain + 混淆 + PromptBuilder · `Models/` AppState + MusicStyle + StyleCategory · `Views/` ContentView + Settings + Visualizers + Signatures
- `docs/` SimonePlan / team-status / operating-principles / inbox / daily / roles
- `_archive/` 老架构不再使用（含归档的 6 张角色卡 + Mac 版）
- Bundle: `com.simone.ios` · Team `9YD5W53S9K`

## 产品定位

AI Mood Radio · 都市夜晚温柔陪伴 · 零引导自解释 · 默认 Lo-fi Chill · **Evolve 只做风格内微调不换台**

## 铁律

**一切可逆**：每抓手单独 commit · 新交互留回退入口 · schema 保留旧 key 一版 · 每版 TestFlight 可回滚。但**可逆 ≠ 不清理**——working tree 可瘦身，git tag 兜底恢复。

**UI/UX 任务动手前必须调 `plugin:impeccable:impeccable`**（visualizer / 字体 / 颜色 / 布局 / 交互 / 微调都算，纯功能不触发）。"再微调一下"也不豁免——凭感觉迭代会漂移回 AI slop（border-left 彩条 / cyan-on-dark / 景深 / 通用图表）。设计上下文 `.impeccable.md`。

## 改完必测

1. **打开模拟器给老鱼看**：`open "simone ios/Simone.xcodeproj"`，Cmd+R 跑 iPhone 15 Pro，老鱼亲眼看
2. **端到端听 30 秒音频**：HMR 对 AudioContext 不可靠，重启 app 从静默到出声整段听
3. **过 test list**（本次相关必测 + 无关抽样）：
   - [ ] 首屏 5 秒内出声（默认 Lo-fi Chill）
   - [ ] 横滑切频道 3 秒内出新声
   - [ ] Evolve 是风格内微调，不是硬切
   - [ ] 内置 Key 10 分钟不断流 · BYOK 无限用
   - [ ] Settings 开关杀 app 重启保留
   - [ ] 锁屏 artwork 正确 · 后台 5 分钟不被杀
   - [ ] 5 默认 visualizer（tape/oscilloscope/liquor/ember/matrix）切换正常

CI/快验：`./scripts/verify-build.sh`（报 DONE 前必跑）· 大改用 `./scripts/verify-build.sh --background` 边干边编

## Context 防爆

老鱼只跟 COO 一个窗口对话（不再 7 角色切窗口）。需要真并行的独立活（探索 / 全仓 grep / 长任务 / 高风险实验）走 **background subagent**——subagent 收尾覆盖更新 `docs/team-status.md` 自己那行，COO 扫一个文件即可。

探索类活（大文件 / 全仓 grep / debug）外包 `Explore` subagent，返回 ≤200 字总结。
