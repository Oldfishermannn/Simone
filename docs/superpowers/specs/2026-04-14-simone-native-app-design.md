# Simone Native App — Design Spec

## Overview

Simone 是一个 AI 音乐陪伴桌宠，定位为**私人 DJ**——不是音乐播放器，不跟 Spotify 竞争，而是一个根据场景/风格实时生成纯器乐 BGM 的氛围生成器。

本 spec 覆盖从 Next.js Web App 移植为 macOS Menu Bar App + iOS App 的完整设计。

**最终目标**：上 Mac App Store + iOS App Store。

---

## 差异化定位

### 核心差异化：零选择疲劳 + 永不重复 + 有审美的氛围感

| | Spotify/YouTube Lo-fi | Brain.fm/Endel | **Simone** |
|---|---|---|---|
| 核心痛点 | 选歌疲劳、广告打断、推荐污染 | 听久了重复无聊 | **零选择、永不重复** |
| 音乐来源 | 固定曲库（被低质 AI 内容污染） | 算法生成（模式固定） | **AI 实时生成（真正无限）** |
| 风格感受 | 被动消费 playlist | 功能性白噪音，无审美 | **有审美的氛围音乐** |
| 场景适配 | 无（固定 playlist） | 基础三档（Focus/Sleep/Relax） | **场景+风格混搭 + 时间演变** |
| 情感定位 | 工具 | 工具 | **陪伴（桌宠）** |

### 市场洞察
- Spotify 用户抱怨"花45分钟选 playlist 而不是工作"
- Brain.fm/Endel 用户几个月后觉得"听起来都一样"
- YouTube lo-fi 被 AI 低质内容淹没，用户信任下降
- 竞品都走"科学专注"路线，没有一个在审美和氛围感上做差异化

---

## Target Users

1. **氛围党**（Free）：学习/工作/开车时想要背景音乐，不想选歌，不想被广告打断
2. **内容创作者**（Pro）：Vlogger/播客主，需要免版权器乐 BGM，可导出使用

---

## Monetization

- **Free**：实时 BGM 生成、基础场景和风格、播放/暂停、锁定模式
- **Pro**：导出 WAV/MP3（含商用授权）、全部场景/风格解锁、Auto-Evolve 模式、换换口味按钮

---

## Auto-Evolve 设计（用户可控三档）

1. **锁定模式**（Free）：音乐风格保持不变，适合"就要这个味道"
2. **自动演变**（Pro）：用户自选间隔（15/30/60分钟），Simone 在当前氛围基础上缓慢微调，渐变无感知
3. **换换口味**（Pro）：手动按钮，点一下在当前场景+风格内做一次变化，不需要重新选场景

---

## UI Design

### macOS: Menu Bar App
- 状态栏显示小音符图标 ♫
- 播放时图标有微妙的脉动动画
- 点击弹出 Popover（340px 宽）

### iOS: 全屏 App
- 同样的布局直接铺满屏幕
- 锁屏显示 NowPlaying 信息
- 后台持续播放

### Popover / 主界面 Layout（从上到下）

#### 1. Pills 选择区（两行混搭）
- 第一行 — 场景：`Study` `Drive` `Workout` `Cook` `Date` `Chill`
- 第二行 — 风格：`Jazz` `Lo-fi` `Ambient` `Funk` `Bossa` `Electronic`
- 可同时选一个场景 + 一个风格（混搭），也可以只选其中一个
- 同行互斥（只能选一个场景、一个风格）
- 玻璃拟态面板，莫兰迪色系

#### 2. 频谱可视化区（主视觉，可左右滑动切换）

5种可视化样式，用户左右滑动切换，弹簧阻尼物理感过渡：

| 样式 | 描述 | 视觉特点 |
|---|---|---|
| Fountain（喷泉） | 拱形建筑框架包裹 24 根频谱条 | 底部水池线 + 镜面倒影，像喷泉建筑 |
| **Aurora（极光）⭐默认** | 频谱条变为柔和曲线波形 | 多层半透明渐变叠加，极光流动感 |
| Vinyl（黑胶） | 圆形频谱围绕中心唱片 | 唱片缓慢旋转，频谱条向外辐射 |
| Silk Wave（丝绸波） | 贝塞尔曲线构成的丝绸波浪 | 多条半透明曲线叠加，丝滑流动 |
| Constellation（星座） | 频率数据映射为星点 | 星点间连线，呼吸般明灭，像星图 |

- 左右滑动切换，弹簧阻尼物理过渡（spring damping，非线性 easing）
- 底部圆点指示器显示当前样式
- 每种样式共享同一份 FFT 数据，只是渲染方式不同
- 莫兰迪调色：rose / mauve / sage / blue / sand 交替

#### 3. 可展开详情卡片
- 默认收起，点击 "details" 展开
- 展开后显示：
  - 音量滑条
  - Temperature / Guidance 参数
  - Auto-Evolve 设置（锁定 / 自动演变间隔 / 换换口味按钮）
- 展开/收起有弹簧阻尼动画

#### 4. 播控信息面板
- 玻璃拟态卡片
- 左侧：播放/暂停按钮（渐变圆形）+ 当前场景名 + 音乐描述
- 右侧：音符装饰

### Visual Style
- **玻璃拟态**（Glassmorphism）：半透明背景 + backdrop-blur + 细边框
- **莫兰迪色系**：rose `#c4a69d` / sage `#a3ab8f` / blue `#8e9aaf` / mauve `#b5a0b5` / sand `#c9bfaa`
- **噪点纹理**：SVG noise overlay，增加质感
- **自定义鼠标**（macOS only）：圆环 + 圆点跟随，hover 时圆环放大
- **弹簧阻尼物理**：所有交互动画使用 spring damping（SwiftUI `.spring(response:dampingFraction:)`）
- **频谱切换过渡**：滑动切换样式时，频谱渲染在两种样式间平滑插值

---

## Architecture

### Phase 1: MVP（TestFlight）

```
macOS/iOS App (SwiftUI, one codebase)
    ├── MenuBarExtra (macOS) / WindowGroup (iOS)
    │   ├── ScenePillsView (场景+风格选择)
    │   ├── SpectrumCarouselView (5种频谱可视化 + 滑动切换)
    │   ├── ExpandableCard (音量+参数+Auto-Evolve)
    │   └── PlayControlView (播控面板)
    ├── AudioEngine (AVAudioEngine)
    │   ├── PCM buffer playback
    │   ├── FFT for spectrum data (vDSP)
    │   └── Background audio session
    └── LyriaClient (URLSessionWebSocketTask)
        ├── Direct connection to Lyria RealTime API
        ├── API key embedded (TestFlight only)
        └── JSON command/response protocol
```

### Phase 2: App Store
- 加 Auth Proxy（Vercel Edge Function）管理 API Key
- App → Auth Proxy（获取 session token）→ Lyria（直连音频流）
- 加 StoreKit 2 订阅（Pro 功能）

### iOS 适配策略
- 共用 SwiftUI 代码：Views/ Audio/ Network/ Models/ 几乎 100% 复用
- `SimoneApp.swift` 用 `#if os(macOS)` / `#if os(iOS)` 区分入口
- iOS 需要 `AVAudioSession` 配置后台播放（`.playback` category + Background Modes）
- iOS 锁屏显示 NowPlaying 信息（MPNowPlayingInfoCenter）
- 一个 Xcode Project，两个 Target（macOS + iOS）

### Key Files

```
Simone/
├── SimoneApp.swift              — App entry (#if os 区分平台)
├── Views/
│   ├── PopoverView.swift        — Main layout
│   ├── ScenePillsView.swift     — Scene + Style pills (2 rows, mixable)
│   ├── SpectrumCarouselView.swift — 5种频谱可视化 + 滑动切换
│   ├── Visualizers/
│   │   ├── FountainView.swift   — 喷泉频谱
│   │   ├── AuroraView.swift     — 极光频谱（默认）
│   │   ├── VinylView.swift      — 黑胶频谱
│   │   ├── SilkWaveView.swift   — 丝绸波频谱
│   │   └── ConstellationView.swift — 星座频谱
│   ├── ExpandableCardView.swift — Volume + params + Auto-Evolve
│   └── PlayControlView.swift    — Play/pause + scene info
├── Audio/
│   ├── AudioEngine.swift        — AVAudioEngine PCM playback + FFT
│   └── AudioBufferQueue.swift   — Thread-safe buffer queue
├── Network/
│   ├── LyriaClient.swift        — WebSocket to Lyria RealTime API
│   └── PromptBuilder.swift      — Scene+Style → weighted prompts
├── Models/
│   ├── Scene.swift              — Scene definitions
│   ├── MusicStyle.swift         — Style definitions
│   ├── VisualizerStyle.swift    — 5种可视化样式枚举
│   └── AppState.swift           — Observable app state
└── Resources/
    └── Assets.xcassets           — Menu bar icon, Morandi colors
```

### What We Reuse from Web Version
- **WebSocket 协议**：完全相同的 JSON 命令格式
- **Prompt 模板**：`pool-elements.ts` 中的 prompt 文本直接搬到 Swift
- **音频格式**：PCM 16-bit, 48kHz, stereo — AVAudioEngine 原生支持
- **频谱逻辑**：AnalyserNode FFT → vDSP FFT，同样的 fftSize=256

### What Changes
- Web Audio API → AVAudioEngine
- React state → SwiftUI @Observable
- Canvas rendering → Metal 或 Core Animation
- WebSocket (browser) → URLSessionWebSocketTask
- CSS glassmorphism → SwiftUI .ultraThinMaterial + blur
