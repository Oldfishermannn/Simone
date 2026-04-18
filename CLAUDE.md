@AGENTS.md

# Simone — AI Ambient Radio

## 项目概述

Simone 是一个 AI 实时音乐生成 iOS/Mac App。采用「氛围电台」定位：选台就完了，不是播放器而是电台。用 Google Lyria RealTime API 实时生成器乐音乐，用于学习、开车、派对、居家等场景。

## 当前状态

🎉 **2026-04-16 v1.0 成功上架 App Store**（全功能免费解锁版本）

### v1.0 已完成
- ✅ Phase 1-5 全部闭环（直连 Google API + UI 重设计 + App Store 上架）
- ✅ 28 个可视化器实装 + BYOK + 内置 Key

### v1.x 规划中（2026-04-18 老鱼拍板新顺序：先稳 → 再变 → 再美 → 再赚 → 再爽 → 再连）

| 版本 | 主题 | 核心抓手 |
|---|---|---|
| **v1.1.0** ✅ | 稳定性 | 30s Ring Buffer + 卡死 watchdog + NowPlaying artwork（不破坏沉浸感） |
| **v1.1.1** ✅ | 交互重塑 | 横滑换频道（主页/沉浸/详情统一）+ Evolve 修对 + Auto Tune 默认关（[spec](docs/superpowers/specs/2026-04-16-v1.1.1-interaction-redesign-design.md)，2026-04-18 确认已 ship 到 iOS main） |
| **v1.2** 📋 | Fog 视觉重设计 | Fog City Nocturne · OKLCH 冷色 + Unbounded/Fraunces/Archivo 字体系统 + 一屏化 Settings（[spec](docs/superpowers/specs/2026-04-18-simone-fog-redesign.md)） |
| **v1.3** 📋 | 商业化 | StoreKit 2 + Flow/Tune/Studio 分层 + 前 100 名 50% off |
| **v2.0** 📋 | 音乐表现力 | 频谱三层耦合驱动（高频跟音频/中频跟时间/低频跟 Evolve）+ Evolve 深度算法 + BPM UI + Smart Adapt + Slow Jam 推荐 |
| **v2.1** 📋 | 平台集成 | 频谱快照 artwork + 锁屏◁▷切风格 + 灵动岛 Live Activity（伪频谱 bar）+ 中号 Widget（◁▷ 交互）+ API Key 反调试 |

完整规划见 `SimonePlan.md`。v2.2+ 长尾延后：多风格混合、离线电台、导出、主题、Mac 版、iPad 适配、CloudKit 同步。

## 技术栈

- **iOS/Mac**: SwiftUI + AVFoundation + Keychain
- **实时音乐**: Google Gemini Live Music API（直连 WebSocket，零服务器）
- **端点**: `wss://generativelanguage.googleapis.com/ws/...BidiGenerateMusic?key=KEY`
- **模型**: `models/lyria-realtime-exp`
- **音频格式**: PCM 16-bit, 48kHz, stereo
- **API Key**: BYOK + 内置试用 Key（XOR 混淆 + 字节数组拆分）
- **付费**: StoreKit 2（v1.0 占位，未接）

## 架构

```
iPhone/Mac App
  ├── 首次打开：内置 Key（XOR 混淆）免费试用
  ├── 深度用户：设置里填自己的 Gemini API Key，无限使用
  ├── 直连 Google Gemini Live Music API (WebSocket)
  ├── Keychain 安全存储用户 API Key
  └── 零服务器，零运维（Apple Developer $99/年）
```

## 目录结构

```
simone/
├── simone ios/              # iOS v1.0 上架版（独立 git）
│   └── Simone.xcodeproj
├── simone mac/              # Mac 版源码
│   └── Simone.xcodeproj
├── SimonePlan.md            # 权威计划书（5 个 Phase + Phase 2.5/2.6）
├── appstore-screenshots/    # App Store 上架截图素材
├── docs/superpowers/        # 设计规划文档（plans + specs）
├── _archive/                # 历史归档
│   ├── colab-bridge/        # 老架构 Python 桥接服务器
│   ├── web/                 # Next.js Web 原型
│   ├── duplicate-project/   # SimoneApp 冗余副本
│   └── Simone_ios_old/      # colab bridge 时代的 iOS 旧版
└── CLAUDE.md
```

## 关键路径（iOS v1.0）

- `simone ios/Simone/Network/LyriaClient.swift` — 直连 Google WebSocket + 会话轮转
- `simone ios/Simone/Network/KeychainHelper.swift` — Keychain CRUD
- `simone ios/Simone/Network/APIKeyObfuscator.swift` — 内置 Key 混淆（防 strings 提取）
- `simone ios/Simone/Network/PromptBuilder.swift` — Lyria 参数构建
- `simone ios/Simone/Models/AppState.swift` — 状态中心 + 分类/演化/定时
- `simone ios/Simone/Models/MusicStyle.swift` — MoodStyle + 20 预设
- `simone ios/Simone/Models/StyleCategory.swift` — 10 分类枚举（Lo-fi/Jazz/Blues/R&B/Rock/Pop/Electronic/Classical/Ambient/Folk）
- `simone ios/Simone/Views/ContentView.swift` — 4 页结构（沉浸/主页/频道/设置）
- `simone ios/Simone/Views/SettingsView.swift` — 完整设置页
- `simone ios/Simone/Views/APIKeySettingsView.swift` — BYOK 入口
- `simone ios/Simone/Views/Visualizers/` — 18 可视化器

## 产品定位（Phase 2.6 终稿）

- **品牌**：Simone - AI Ambient Radio
- **人格**：都市夜晚 + 温柔陪伴，外壳克制带一点梦感
- **核心原则**：零引导，所有操作自解释
- **默认频道**：Lo-fi Chill
- **分层命名**：Flow（能听）/ Tune（能选）/ Studio（能造）
- **Evolve**：不换台，只做当前风格内部微调（加减乐器、密度变化、轻微能量变化）

## Bundle 信息

- **iOS Bundle ID**: `com.simone.ios`
- **Team ID**: `627M26D553`

## 核心开发原则

**所有操作必须可逆**（v1.1 起强制执行）：
- **Git 粒度**：每个独立抓手单独 commit，出问题能 `git revert` 回上一步不牵连其他功能
- **不做破坏性删除**：老逻辑不直接删，用新默认值或 feature flag 覆盖；v1.1 确认稳定再清理
- **用户体感可逆**：新交互默认保留"回到旧方式"的入口或偏好开关，用户不适应能退回
- **数据可逆**：改 UserDefaults / Keychain schema 时保留旧 key 一个版本，读迁移写新格式
- **发布可逆**：每个 v1.1.x ship 前保证能通过 TestFlight 回滚到前一版

> 因为信任所以简单——但信任的前提是每一步都能回退。

## 唤醒上下文

打开项目前先读 `SimonePlan.md` 拿到完整计划书。iOS 版在 `simone ios/` 里有独立 git 历史（`V1.0 App Store ready` commit），和主 repo 的 git 独立。老架构代码（Python 桥接、Next.js 原型）都在 `_archive/`，不再使用。
