# Simone iOS App 上架 App Store 方案

## Context

Simone 是 AI 实时音乐生成 App，用 Google Lyria RealTime API。采用 **BYOK + 内置试用 Key** 架构：App 直连 Google API，零服务器成本。内置 Key 提供免费试用，深度用户填自己的 Key 解锁无限使用。

## 架构

```
iPhone App
  ├── 首次打开：内置 Key，免费试用（每天30分钟）
  ├── 深度用户：设置里填自己的 Gemini API Key，无限使用
  ├── 直连 Google Gemini Live Music API (WebSocket)
  ├── Keychain 安全存储 API Key
  └── 零服务器，零运维
```

**你的成本**：Apple Developer $99/年 ≈ $8/月（Lyria API 目前免费）

## 当前状态

- App 功能完整：40+ Swift 文件，20+ 可视化器，播放/暂停/演化/睡眠定时器
- 编译通过（1 warning：orientation）
- Bundle ID: `com.simone.ios`, Team: `627M26D553`
- 开发者账号已付费，激活中

---

## Phase 1：改造 LyriaClient 为直连模式（核心改动）

**目标**：去掉 Python 桥接服务，App 直连 Google Gemini Live Music API

**需要改的文件**：
- `Simone/Network/LyriaClient.swift` — 重写连接逻辑，直连 Google WebSocket
- `Simone/Models/AppState.swift` — 添加 apiKey 管理 + 试用时长限制
- 新建 `Simone/Network/KeychainHelper.swift` — Keychain 存取 API Key
- 新建 `Simone/Views/OnboardingView.swift` — 首次启动引导 / API Key 设置

**实现步骤**：
- [x] 调研 Gemini Live Music API 的 WebSocket 协议格式 ✅
  - Endpoint: `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateMusic?key=API_KEY`
  - 首条消息: `{"setup": {"model": "models/lyria-realtime-exp"}}`
  - 等待: `{"setupComplete": {}}` 
  - Prompts: `{"clientContent": {"weightedPrompts": [{"text": "...", "weight": 1.0}]}}`
  - Config: `{"musicGenerationConfig": {"temperature": 1.0, ...}}`
  - 播控: `{"playbackControl": "PLAY" | "PAUSE" | "STOP" | "RESET_CONTEXT"}`
  - 音频: `{"serverContent": {"audioChunks": [{"data": "base64...", "mimeType": "audio/wav"}]}}`
  - 格式: PCM 16-bit, 48kHz, stereo (与现有 AudioEngine 完全兼容)
- [x] 重写 `LyriaClient.swift` ✅
  - 直连 Google WebSocket `wss://generativelanguage.googleapis.com/ws/...BidiGenerateMusic?key=KEY`
  - 移植 server.py 的会话轮转逻辑（~30s 超时自动 reconnectAndRestore）
  - snake_case → camelCase 自动转换（top_k→topK, mute_bass→muteBass 等）
  - 外部接口不变（sendPrompts/sendCommand/sendConfig），AppState 零改动
- [x] 新建 `KeychainHelper.swift` ✅ Keychain CRUD
- [x] API Key 管理逻辑 ✅
  - resolveAPIKey(): 优先用户 Key → 回退内置 Key
  - APIKeyConfig.builtInKey: 从 Bundle Info.plist 读取（xcconfig 注入）
  - 用户 Key 存 Keychain，安全持久化
- [x] 新建 `APIKeySettingsView.swift`（替代 OnboardingView，集成在 DetailsView 底部）✅
  - Key 输入框 + AIza 格式校验 + 保存到 Keychain
  - 已有 Key 时显示脱敏 + 眼睛切换 + 删除按钮
  - 引导文案：获取 Gemini API Key 的三步说明
  - 试用状态指示器
- [x] 精简 `PromptBuilder.swift` ✅ 去掉旧桥接服务器的 toJSON/commandJSON/configJSON

## Phase 2：修复编译警告 + App 配置

**文件**: `Simone/Info.plist`

- [x] 设置 `UIRequiresFullScreen = true` 修复 orientation 警告 ✅
- [x] 确认 App Icon 1024x1024 在 Assets.xcassets 中 ✅
- [x] 确认 LaunchScreen 深色背景 ✅

## Phase 3：App Store Connect（老鱼手动）

1. 等 Apple Developer 账号激活邮件
2. App Store Connect → 创建 App
   - 名称：`Simone - AI Music`
   - Bundle ID：`com.simone.ios`
   - 分类：Music / Entertainment
   - 内容分级：4+
3. 隐私政策：docs/privacy.html 部署到 GitHub Pages
4. 准备截图：6.9" + 6.7" 两个尺寸
5. App 描述：
   ```
   Simone - AI Music Companion

   Real-time AI-generated instrumental background music.
   No playlists, no ads, no repeats — just pick a mood.

   • Powered by Google Lyria AI
   • 20+ spectrum visualizers  
   • Auto-evolve: music transforms over time
   • Sleep timer & background playback
   • Free trial included, or bring your own Gemini API key
   ```

## Phase 4：Archive + TestFlight ✅

- [x] Xcode Signing & Capabilities 配置 ✅
- [x] Version 1.0.0, Build 1 ✅
- [x] Product → Archive → Distribute App → App Store Connect ✅
- [x] TestFlight 内测 ✅

## Phase 5：提交审核 ✅

- [x] 审核备注：提供测试用 API Key（内置 Key 审核员可以直接用）✅
- [x] 提交审核 ✅
- [x] **🎉 2026-04-16 成功上架 App Store！** 🎉

---

## 审核风险点

| 风险 | 对策 |
|------|------|
| 需要联网 | 内置试用 Key，审核员直接能用 |
| BYOK 门槛 | 有免费试用，不填 Key 也能体验 |
| Lyria 实验模型 | 描述注明 AI-generated，降低预期 |
| 隐私政策 | 已有 docs/privacy.html |

## 验证清单

1. 内置 Key：打开 App 直接能听音乐，不需要任何设置
2. 试用计时：30 分钟后提示填自己的 Key
3. BYOK：设置里填 Key 后无限使用
4. 会话轮转：~30s 超时后无缝续播
5. 锁屏播放控制正常
6. Keychain 持久化：重启 App 后 Key 还在
7. Archive + TestFlight 成功

## 分工

**小克**：Phase 1 + Phase 2 + Phase 2.5（UI 重设计）
**老鱼**：Phase 3（App Store Connect 配置） + Phase 4（Archive 上传） + Phase 5（提交审核）

---

## Phase 2.5：UI/UX 重设计 —「氛围电台」

### 设计理念

**产品定位**：氛围电台（Mood Radio）— 不是播放器，是电台。选台就完了。
**交互原则**：零引导 — 所有操作必须自解释，不需要任何教程或提示。
**UI 语言**：全英文（面向英文用户为主）。

### 4 页结构（上下滑动，不变）

| 页面 | 定位 | 改动 |
|------|------|------|
| **Page 0 沉浸页** | AI 创作体验 | **重写：LIVE + DNA + Evolve + 滑块** |
| **Page 1 主页** | 频谱 + 调台控制 | **重写控件** |
| **Page 2 频道页** | Tab 频道列表 + 收藏 | **完全重写** |
| **Page 3 设置页** | 所有设置项 | **扩展内容** |

### Page 1 主页 — 改动

**当前**：♡ | ◁ | ▶ | ▷ | ↻（收藏、上一首、播放、下一首、刷新）
**改为**：完整的 AI 电台主页

**主页 UI 不变，只改控件逻辑**：
- 频谱 carousel、风格名显示、播放器视觉 — **全部保持现有 UI 不动**
- 只改 PlayControlView 的按钮：去掉 ♡（收藏）和 ↻（刷新），保留 ◁ ▶ ▷
- ◁ ▷ 功能改为调台：
   - Free：随机跳到任意风格
   - Pro/Max：在当前分类内循环切换

**改动文件**：
- `Simone/Views/PlayControlView.swift` — 只删按钮，不改布局/样式
- `Simone/Models/AppState.swift` — 添加 currentCategory、categoryStyles、energy/mood 属性

### Page 2 频道页 — 完全重写

**当前**：MiniPlayer + 收藏 + 推荐 + 演化 + 定时
**改为**：MiniPlayer + Tab 频道列表

**Tab 栏**：`♡ Favorites | Chill | Jazz | Electronic | Ambient | Cinematic`

- **♡ Favorites Tab**（第一个）：显示所有已收藏的风格
- **分类 Tab**：该分类下的所有风格列表，每个风格右侧有 ♡ 按钮
- **列表底部**：「+ New Style」入口
  - Free：🔒 弹升级弹窗
  - Pro：标签拼接页面（Genre + Mood + Instrument 选择）
  - Max：标签拼接 + 顶部「Direct Input」自由文本框
- 点击风格 = 直接切台播放
- 点击 ♡ = 收藏/取消

**改动文件**：
- `Simone/Views/DetailsView.swift` — 完全重写为 Tab + 列表结构
- `Simone/Models/MusicStyle.swift` — MoodStyle 添加 `category: StyleCategory` 字段
- 新建 `Simone/Models/StyleCategory.swift` — 分类枚举 + 每个分类的颜色

**分类定义（传统流派，10 个，Tab 栏横向滚动）**：
```swift
enum StyleCategory: String, CaseIterable, Codable {
    case lofi, jazz, blues, rnb, rock, pop, electronic, classical, ambient, folk
    
    var displayName: String { ... }  // "Lo-fi", "Jazz", "Blues", "R&B", ...
    var color: Color { ... }  // MorandiPalette 颜色
}
```

**预设风格（每分类 3-4 个，上架前测试 Lyria 生成效果，不行的砍）**：
| 分类 | 风格 |
|------|------|
| Lo-fi | Lo-fi Chill, Lo-fi Jazz, Lo-fi Rain |
| Jazz | Night Jazz, Café Jazz, Smooth Jazz, Bossa Nova |
| Blues | Slow Blues, Delta Blues, Chicago Blues |
| R&B | Smooth R&B, Neo Soul, Slow Jam |
| Rock | Soft Rock, Indie Rock, Post Rock |
| Pop | Dream Pop, Synth Pop, Chill Pop |
| Electronic | Synthwave, Deep House, Downtempo |
| Classical | Solo Piano, String Quartet, Orchestral |
| Ambient | Space Drift, Rain, Forest, Ocean |
| Folk | Acoustic Folk, Fingerstyle, Campfire |

### Page 3 设置页 — 扩展

**当前**：API Key 管理 + 连接状态
**改为**：完整设置中心

设置项（从上到下）：
1. **Evolve** ⓘ — Lock / 10s / 1m / 5m + 主页动效开关
   - ⓘ 点击弹提示："Music subtly shifts over time, like a DJ slowly changing the vibe. 10s = fast changes, 5m = slow drift, Lock = stay the same."
2. **Sleep Timer** — Off / 30m / 1h / 2h
3. **Smart Adapt** — 环境感知开关
   - Time-aware：根据时间自动调整氛围（早上明亮、深夜低沉）
   - Weather-aware：根据天气加入音乐纹理（需定位权限，可选）
3. **Visualizers**
   - 内置 18 个可选，开关控制是否出现在主页/沉浸页
   - 拖拽排序
   - 「Generate Custom Visualizer」入口（付费功能 🔒）
4. **API Key** — 保持现有 APIKeySettingsView
5. **About** — 版本号、隐私政策链接

**改动文件**：
- `Simone/Views/APIKeySettingsView.swift` — 重命名为 `SettingsView.swift`，扩展为完整设置页
- `Simone/Models/AppState.swift` — 添加可视化器排序/启用状态持久化

### Page 0 沉浸页 — 重写为 AI 体验页

**当前**：全屏频谱，无 UI
**改为**：AI 创作沉浸体验

布局（从上到下）：
1. **LIVE · Generating** — 绿色脉冲标记，强调实时生成
2. **全屏频谱可视化** — 高密度渲染（density:2）
3. **音乐 DNA** — 淡色显示 `jazz · warm · piano · 92bpm`
4. **风格名**
5. **Evolve 呼吸环** — 可视化"音乐正在演变"状态
6. **Energy / Mood 实时滑块**
   - Free/Pro：显示但 🔒 锁定，拖动弹升级提示
   - Max：可拖动，实时改变音乐

**改动文件**：
- `Simone/Views/ImmersiveView.swift` — 重写，加入 LIVE/DNA/Evolve/滑块

### 数据模型改动汇总

**`MusicStyle.swift`**：
- MoodStyle 添加 `category: StyleCategory` 字段
- 20 个预设全部标注分类
- `generateNewStyles()` 生成的风格也需要分类

**`AppState.swift`**：
- 新增 `currentCategory: StyleCategory`（当前选中分类，默认 .chill）
- 新增 `stylesInCurrentCategory: [MoodStyle]` 计算属性
- 新增 `nextStyleInCategory()` / `prevStyleInCategory()` 方法
- 移除 `exploredStyles`（推荐功能去掉了）
- 演化 + 定时逻辑保持不变，只是 UI 入口移到设置页

### 付费分层（三档）

| | Free | Pro | Max |
|---|---|---|---|
| **播放** | 不限时长 | 不限时长 | 不限时长 |
| **调台** | 只能随机（◁ ▷ 随机跳） | 选分类 + 选具体风格 | 同 Pro |
| **频道页** | 能看，灰色 🔒 点不了 | 完全解锁 | 完全解锁 |
| **收藏** | 不能 | 可以 | 可以 |
| **生成新风格** | 无 | 拼标签（Genre+Mood+Instrument） | 自由打字输入 prompt |
| **可视化器** | 18 内置 | 18 内置 + 排序 | +生成自定义可视化器 |
| **控制** | 演化 + 定时 | 演化 + 定时 | +全参数（BPM、temperature 等） |
| **App 主题** | Default 固定 | Default 固定 | 6 套深度定制主题（按钮/频谱/背景/字体/动效全套） |
| **多风格混合** | 无 | 无 | 同时叠加两个风格播放 |
| **离线电台** | 无 | 无 | 录制风格保存本地，无网可听 |
| **导出** | 无 | 无 | 下载片段 |

**定价**：
| | 月付 | 买断 |
|---|---|---|
| Pro | $1.99/月 | $9.99 一次性 |
| Max | $4.99/月 | $19.99 一次性（含 Pro 全部功能） |
- 已有 Pro 买断 → 升 Max 补差价 $10
- 视觉引导买断（大按钮 + "最划算"标签），月付小字

**Free 转化逻辑**：随机电台不限时 → 想选风格？→ 频道页看得到但 🔒 → 升级 Pro
**升级弹窗**：点 🔒 弹出 → Pro/Max 买断大按钮 + 月付小字链接 + "稍后再说"
**首次体验**：打开 App → 主页频谱静止 + "Lo-fi Chill" + ▶ → 用户按 ▶ 开始播放
**API Key**：全部档位用内置 Key，设置页保留 BYOK 入口（不强推）
**Key 保护**：XOR 混淆 + 字节数组拆分，运行时组装。不明文存储，防 `strings` 提取和普通反编译。
**付费实现**：StoreKit 2，无需登录系统（Apple ID = 账号）
**本次实现**：Free 功能完整可用 + Pro/Max 入口占位（🔒 标记 + 升级弹窗 UI，不接 StoreKit）

### 实现顺序

1. `APIKeyObfuscator.swift` — 新建 Key 混淆工具（XOR + 字节数组），替换 LyriaClient 中的硬编码 Key
2. `StyleCategory.swift` — 新建分类枚举
2. `MusicStyle.swift` — 给 MoodStyle 加 category，20 个预设分类
3. `AppState.swift` — currentCategory + 分类内导航方法
4. `PlayControlView.swift` — 精简为 ◁ ▶ ▷ 三按钮
5. `DetailsView.swift` — 完全重写为 Tab + 频道列表
6. `APIKeySettingsView.swift` → `SettingsView.swift` — 扩展为完整设置页
7. `ContentView.swift` — Page 3 指向 SettingsView

### 验证清单

1. 主页 ◁ ▷ 在当前分类内循环切换，切换后立即播放
2. 频道页 Tab 切换显示对应分类的风格列表
3. 频道页 ♡ 收藏 Tab 显示所有已收藏风格
4. 点击频道页中的风格直接切台播放
5. 点 ♡ 收藏/取消收藏，收藏 Tab 实时更新
6. 设置页演化/定时功能正常工作
7. 设置页可视化器排序/开关正常
8. 付费入口显示但标记为 🔒（不实现功能）
9. 所有页面零引导 — 不需要文字解释

---

## Phase 2.6：产品框架终稿（ChatGPT 整理版）

### 品牌
**Simone — AI Mood Radio**

### 产品方向
像**电台**，不像工具。  
核心不是“生成”，而是**陪伴型氛围音乐体验**。

### 产品核心原则

#### 1. 默认体验
- 默认频道：`lofi chill`
- 视觉：氛围感 + 频谱居中
- 点播放后尽快出声

#### 2. 切台逻辑
- 在当前 **tab** 内切换
- 不做乱跳
- 目标是“相邻频道也常常对味”

#### 3. Evolve
- 不负责换台
- 只做当前风格内部微调
- 核心方式：**加减乐器、密度变化、轻微能量变化**
- 红线：**避免突然风格转变**
- 默认：`10s`
- 可选：`10s / 1m / 5m / lock`

#### 4. 产品人格
**都市夜晚 + 温柔陪伴**  
外壳克制，带一点梦感。

### 分层命名
- **Flow**
- **Tune**
- **Studio**

### 分层逻辑

#### Flow
**能听**
- 正常播放
- 可进入所有 tab
- 可在当前 tab 内切台
- 基础 evolve
- 基础 sleep timer

不给：
- 点具体风格
- 收藏
- 创建新风格
- 深度控制

一句话：
**进入 Simone，直接听。**

#### Tune
**能选**
- 自由进入所有 tab 并播放
- 可点具体风格
- 可收藏
- evolve 全档位
- 完整 sleep timer
- 基础新风格组合

不给：
- 自由文本输入
- 多风格混合
- 私人频道保存

一句话：
**开始真正调台。**

#### Studio
**能造**
- 自由文本输入
- Mood / Energy 深度控制
- 多风格混合
- 保存私人频道
- 更深 evolve 控制
- 高级个性化体验

一句话：
**把 Simone 变成属于你的电台。**

### 三层最核心卖点
- **Flow** — Press play
- **Tune** — Choose your stations
- **Studio** — Shape your own atmosphere

### 频道与风格原则

#### 频道
频道是用户选的大类，应该：
- 清楚
- 稳定
- 好懂

#### 风格
风格是频道里的具体变化，应该：
- 更有画面感
- 更有气质
- 用来承载切台与 evolve

一句话：
**频道给用户选，风格负责变化。**

### 最终体验目标
用户打开 Simone 时，应该感觉到的不是：

“我在操作一个 AI 音乐工具。”

而是：

**“我打开了一个懂氛围的 AI 电台。”**

---

# v1.1 更新计划（2026-04-16 起草）

## v1.1 Context

v1.0 上架版采取「全功能免费解锁、无试用限制」策略简化提交。v1.1 整合三条线索：
1. 老鱼实际使用反馈（18 个问题点，分 A/B/C/D/E 五组）
2. Phase 2.5 遗留未实施（付费分层、Smart Adapt、Max 档大功能）
3. Phase 2.6 产品语言（Flow/Tune/Studio）从文档写进 UI

**v1.0 代码基线（grep 验证）：**
- ✅ BPM 字段已存在（`AppState.swift:57`），UI 未暴露
- ✅ LyriaClient 有 reconnect 机制
- ✅ NowPlaying 已标 live stream，缺 title/artwork
- ✅ 28 个可视化器已实装
- ❌ 付费分层 UI、免费试用、预加载、Smart Adapt、多风格混合、离线电台、导出、自定义主题 全部 0 代码

## v1.x 总体策略

**串行执行，滚动发布**：每个 version ship 独立 tag，2 周一节奏。

**新顺序（2026-04-18 老鱼拍板）：先稳 → 再变（交互）→ 再美（UI）→ 再赚（商业化）→ 再爽（音乐表现力）→ 再连（平台集成）。**

> UI 不好的时候做付费转化等于砸自己 —— 所以 Fog UI 大修 + 商业化提前，音乐表现力 + 平台集成后置到 v2.x。

| 版本 | 主题 | 估时 | 累积 | 状态 |
|---|---|---|---|---|
| v1.1.0 | 稳定性 | 1.5 周 | 1.5 周 | ✅ 2026-04-16 完成 |
| v1.1.1 | 交互重塑 | 2 周 | 3.5 周 | ✅ 2026-04-18 确认已 ship 到 iOS main |
| v1.2 | Fog 视觉重设计 | 2 周 | 5.5 周 | ✅ 2026-04-19 全部闭环并 merge 到 iOS main（`842b589`） |
| v1.2.1 | Evolve 深度化（付费前置） | 1 周 | 6.5 周 | 🧪 2026-04-19 P0-P4 已落地：build 11 已提交 App Store 审核（WAITING_FOR_REVIEW），撤回了 v1.2 未审核提交 |
| v1.3 | 商业化 | 1 周 | 7.5 周 | 📋 v1.2.1 TF 验证达标后启动 |
| v2.0 | 音乐表现力（剩余） | 1.5 周 | 9 周 | 📋 brainstorm 已做，Evolve 深度化已前置 |
| v2.1 | 平台集成 | 2 周 | 11 周 | 📋 brainstorm 已做，待实施 |

---

## v1.1.0 —— 稳定性修复（Phase B）✅ 2026-04-16 完成

**目标**：消除用户流失点，把 v1.0 地基打牢。**所有稳定性改动走后台不可见方案，不主动打断用户。**

- [x] **30s Ring Buffer**：`AudioBufferQueue` 从 unbounded FIFO 改成容量 30s（5.76MB）环形缓冲，超容量丢最老。切后台/锁屏/网络抖动期间 player 吃老缓冲不断音
- [x] **重连平滑**：`LyriaClient.handleDisconnect` 本来就不动音频队列，配合 ring buffer 天然无感重连
- [x] **卡死 watchdog**：`AudioEngine` 每 3s 检查 `isPlaying && isUnderrun && 10s 无 chunk` → 触发 `onPlaybackStalled` → AppState 自动重连
- [x] **Trial 残留代码清理**：grep 全代码库无 trial/free/paid 相关悬挂逻辑，v1.0 本身就是全解锁干净版
- [x] **NowPlaying artwork**：`makeArtwork` 渲染 512×512 频道色渐变 + "Simone" logo + 风格名；title/artist 补齐

**撤回项（违反"不破坏沉浸感"原则）**：
- ~~25min 自动换台~~ → 用户正聆听时强制跳台违反 Phase 2.6"Evolve 不换台"原则；已撤回。长连接稳定性由 ring buffer + watchdog + reconnect 三层兜底，无需换台

**关键文件**：`AudioBufferQueue.swift` · `AudioEngine.swift` · `AppState.swift`

**单元测试**：`AudioBufferQueueTests` 13/13 通过（覆盖容量追踪、丢最老 FIFO、dequeue/drainAll/clear 重置）

**可逆性**：ring buffer 容量可配置 · watchdog 解绑 callback 即失效 · artwork 是纯新增不影响旧行为

**验收**：App Store 上架后 TestFlight 实测待老鱼反馈

---

## v1.1.1 —— 交互重塑 ✅ 2026-04-18 实测确认已 ship 到 iOS main

**目标**：App 内凡是横滑都是换频道。主页 + 沉浸页 + 详情页手势统一，**主页 UI 零视觉改动**。

**完整 spec**：`docs/superpowers/specs/2026-04-16-v1.1.1-interaction-redesign-design.md`

**落地状态（2026-04-18 核查 iOS repo `main` HEAD）**：

commit 范围 `1626c88..fb43a5f` [8/12..12/12] 加上后续 polish/fix 一系列至 `da09746`。

**6 个抓手全部落地**：
- [x] **Channel 数据模型** · `Simone/Models/Channel.swift` ✅（`.favorites` + 10 `.category` 枚举）
- [x] **横滑换频道** · SpectrumCarouselView Channel-bound ✅
- [x] **◁ ▷ 分类内循环** · commit `1626c88` v1.1.1 [8/12] ✅
- [x] **Evolve 修对** · `Simone/Network/EvolveVocabulary.swift` + PromptBuilder 接入（commit [9/12]）✅
- [x] **Auto Tune** · AppState `autoTuneEnabled: Bool = false` + 25min drift（commit [10/12]）✅
- [x] **详情页横滑 Page** · DetailsView 11-page TabView + dial（commit [11/12]）✅
- [x] **可视化器入口下移** · SettingsView 报告型（commit [12/12]，"report don't select"）✅

**后续 polish（也都在 main 上）**：main page slide/fade 收敛 · FAVORITES badge 修复 · details 横滑免与垂直冲突 · dial content-hugging · Evolve 默认 Lock · 最终主页合进 Details + Immersive（commit `fe4dc2c`）

**硬约束**：
- 主页 + 沉浸页视觉一个像素不改（零改动验证）
- 不破坏沉浸感：Auto Tune 默认关、Evolve 不跨流派、所有自动行为无 toast 无打断
- 数据可逆：`pinnedStyles` schema 不变；旧 `sessionRotationEnabled` key 启动时清理；新 key `autoTuneEnabled`

**延后到 v1.3**（随付费分层一起做）：
- Flow / Tune / Studio 命名 + 🔒 标记 + 升级弹窗
- 详情页频道 pill 拖拽排序
- "+ New Style" 入口（拼标签 / Direct Input）
- StoreKit 2 + 付费分层代码 gate

**关键文件**：`SpectrumCarouselView.swift` · `PlayControlView.swift`（不改）· `DetailsView.swift` · `AppState.swift` · `SettingsView.swift` · 新建 `Channel.swift` / `EvolveVocabulary.swift`

**验收**：主页 UI diff v1.0 = 0 · 横滑 11 频道一致手势 · Evolve 听感有变化但不跳台 · Auto Tune 默认关、开启后后台静默轮转

---

## v1.2 —— Fog City Nocturne 视觉重设计 ✅ 2026-04-19 合入 iOS main

**状态**：✅ 全部 Phase 闭环。`feature/v1.2-fog` 35 commit 通过 `--no-ff` merge 到 iOS main（merge commit `842b589`），锚点 tag `v1.1.1-pre-v1.2-merge` 已推。
**设计 spec**：`docs/superpowers/specs/2026-04-18-simone-fog-redesign.md`（Fog v5 最终锁定版，含完整色板/字体/页面架构/mockup）
**前置条件**：v1.1.1 已 ship 到 iOS main（2026-04-18），进入 v1.2 执行窗口 —— UI 烂的时候做付费转化等于砸自己，放在商业化之前做。

### 定位

**Fog City Nocturne · 雾都夜色**——晚 11 点地下酒吧的雾玻璃感。冷色、极简、克制。视觉 99% 让给音乐。对标 Teenage Engineering 说明书 / Aesop 产品页 / 黑胶封套内页。

### 为什么前置做 UI 大修

v1.0 上架的视觉是功能优先快速成型版本，老鱼在 v1.1 交互重塑闭环后明确提出"对现在的 uiux 用户交互不是很满意"。v1.2 做的是**换皮不改骨**：底层音频引擎、频谱逻辑、频道数据、BYOK 全不动，只换视觉语言 + 字体系统 + 一屏化 Settings。

### 核心原则

1. **只换皮、不改骨** — 音频引擎、频谱渲染、频道数据、BYOK 全部零改动
2. **保留 v1.1.1 三页架构** — VerticalPageView（Immersive / Home / Settings）不动
3. **保留 11 个 visualizer + 频道绑定** — Spectrum 枚举零改动
4. **Settings 一屏化** — 不滚动，彻底避开跟 VerticalPageView 的手势冲突（Fog v5 方案 A）

### 改动范围（只有 4 个点）

| 点 | 文件 | 幅度 |
|---|---|---|
| 1 | `ImmersiveView.swift` | 中 · 底部 Music DNA 标签 + 风格名字体换 Unbounded Light |
| 2 | `ChannelPageView.swift` | 中 · 列表去卡片化，虚线分隔，Unbounded+Fraunces 斜体副标 |
| 3 | `SettingsView.swift` | 大 · 重写为一屏化章节列表（Evolve/AutoTune/Sleep/Spectrum + Colophon） |
| 4 | 新增 `Models/FogTheme.swift` + 字体资源（Unbounded / Fraunces / Archivo 三族） | 新增 · 包体 ~+500KB |

### 实施阶段（6 个独立 commit 抓手）

- [x] **P0 · Checkpoint** · iOS 仓 main 打 tag `v1.1.1-pre-fog`（2026-04-18）
- [x] **P1-2 · FogTheme + SettingsView 一屏化** · commit `4055e67`（cherry-pick 自 `74f2685`）
- [x] **P3 · ImmersiveView 采用 FogTheme 字体 tokens** · commit `8ea1e95`（cherry-pick 自 `1b9c0ea`）
- [x] **P4 · 频道列表与 dial 采用 Fog typography** · commit `bfa6341`（cherry-pick 自 `3426d49`）
- [x] **P5a · Unbounded/Fraunces/Archivo OFL 字体 bundle** · commit `a53b146`（5 TTF + 3 OFL，+2.82 MB）
- [x] **P5b · FogTheme swap `.system()` → `Font.custom("Unbounded"|"Fraunces"|"Archivo")`** · commit `5711d74`（runtime log 验证 3 family 全部注册成功）
- [x] **P6 · 合回 main** · `--no-ff` merge commit `842b589` · 零冲突 · 35 commit 全保留 · 锚点 tag `v1.1.1-pre-v1.2-merge` 可单 commit revert
- 每个 P 阶段 TestFlight 跑几天，确认"不破坏沉浸感"原则没违背

### 采用策略（2026-04-18 更新）

**选 A：在现有 `feature/fog-redesign` 基础上做 Phase 5 + 合回 main**。理由：Phase 1-4 已落地 + 构建通过，重做纯浪费；选 B（全推倒）只剩心智负担，没收益。

**Phase 5 字体接入打算**：
1. 下载 Unbounded / Fraunces / Archivo（确认 SIL OFL license 允许 bundle 到 IPA）
2. 加 `*.ttf` 到 Xcode target + `Info.plist` `UIAppFonts`
3. 改 `FogTheme.swift` 的 `display/mono` 函数从 `.system(...)` 切到真字体
4. TestFlight 两天看是否"不破坏沉浸感"

**合回 main 路径**：
- 保留：三个 `feat(fog):` commit（`74f2685` / `1b9c0ea` / `3426d49`） + 待做的 P5 字体 commit
- 评估：三个 pipeline commit（`412f04d` drop xcodegen / `06b013d` App Store Connect API / `f6c46d8` team ID 修正）—— 与 Fog 视觉无关，是否单独 PR 合回由老鱼决定
- 方式：cherry-pick 三个 fog commit 到 main，避免把 pipeline 改动捎带上

**风险提示**：
- `feature/fog-redesign` 自 2026-04-16 起没同步过 main，main 上有 v1.1.1 全套改动（横滑换频道 / Evolve / AutoTune / visualizer 绑定）。cherry-pick 前需要先 rebase 或手动核对 `SettingsView.swift`（Fog 改的版本 ≠ v1.1.1 改的版本）有无冲突
- Fog 分支上的 SettingsView 是当时主线版改的，v1.1.1 在 SettingsView 加了 visualizer 绑定行；P2 的"一屏化"需要考虑 v1.1.1 新增行怎么塞

### 风险

- **字体包体积**：+500KB 到 IPA，可接受
- **Fraunces 斜体接受度**：跟 Unbounded 冷调搭配是秘密武器，若老鱼看久觉得太文艺，可降级 Archivo Italic
- **Mauve 强调色频率**：沿用 v1 的 MorandiPalette.mauve，但 Fog 里使用频率大幅降低（仅选中/ON/高亮值），更贵重
- **一屏 Settings 扩展性**：v1.2 起新设置项必走二级页，不往主 Settings 加行——这是原则

### 2026-04-18 立项备注

- 本立项前曾有一次实施尝试（`feature/fog-redesign` 分支），老鱼否掉："应该先写 plan 到 SimonePlan（例如 simone v2 这种），立项通过后再实施"
- **分支状态修正（2026-04-18 复查）**：分支未删除，Phase 1-4 代码仍在 iOS 仓 `feature/fog-redesign` 上活着（`74f2685` / `1b9c0ea` / `3426d49`），上层叠了三个 pipeline 补丁。早先立项文案写"已删除，零残留"不准确
- **采用策略已定**：老鱼选 A（复用现有 Phase 1-4，继续做 Phase 5 字体 + 合回 main），见上方「采用策略」小节
- 本次立项更新为纯 plan 改动，未动任何源码；iOS 仓 `feature/fog-redesign` 保持不动待审批后推进

### 验收

- Settings 一屏装下，VerticalPageView 手势零冲突
- Immersive 页底部 Music DNA 标签跟风格名同步滑动
- 频道列表去卡片化后视觉信息密度 ≥ v1.1.1
- 音频引擎 / 频谱 / BYOK 行为 0 变化
- 字体 license 合规，IPA 体积增量可交付

### 2026-04-19 补做抓手（大图叙事 + 横滑 bug 修复）

| commit | 抓手 | 状态 |
|---|---|---|
| `496db7d` | 横滑切台不再自动启动播放（未点播放键前横滑不副作用） | ✅ 采纳 |
| `df4cf1a` | R&B Liquor 大图加 decanter + coaster + 吧台线（吧台叙事） | ✅ 采纳 |
| `182b57e` | Rock Ember 大图加炭木堆 + 灰烬地板（壁炉场景） | ✅ 采纳 |
| `611038f` | Electronic Matrix 大图加街灯 + 霓虹圆标（夜街叙事） | ❌ 否掉 |
| `2999880` | Electronic Matrix Chrome Horizon（条纹日 + 透视地网格） | ❌ 否掉 |
| `324711f` | Electronic Matrix 回退到 4 栋楼天际线（保底 `87d6870`） | ✅ 最终状态 |

**Electronic 档教训**：两版"叙事减法"（夜街、synthwave 条纹日）都被否掉，老鱼明确要视觉密度。Electronic 频道大图的审美方向是**城市天际线群像 > 单物件叙事**，下次迭代不走减法路线。

---

## v1.2.1 —— Evolve 深度化（付费前置，2026-04-19 立项）

**状态**：✅ 2026-04-19 晚直提 App Store 审核（撤回了 v1.2 的 pending 提交）。锚点 tag `v1.2.1-pre-evolve-depth` + feature 分支 `feature/v1.2.1-evolve-depth` HEAD `75a187d` · build 11 (Delivery UUID `733c2d23-f6b9-46fe-b96c-6b54d583c43d`) 已 attach 到 v1.2.1 版本 `c1c8fa7d`，submission `b76bd517` state=WAITING_FOR_REVIEW。

### 为什么插这一层

2026-04-19 战略讨论中老鱼确认当前体感——**Lock 挡 5-10 分钟腻，开 Evolve 撑到 15 分钟**。这意味着 Simone 只覆盖"睡前"一个核心场景，通勤（20-30 分钟）/ 工作（30-90 分钟）/ 派对（60+ 分钟）全部撑不住。

直接进 v1.3 收费的风险：7 天试用期里用户工作时开 20 分钟觉得烦就关，试用到期大概率不续订——D7 Free→Paid ≥ 3% 目标直接崩，MRR ≥ $100 成功判定碎。

**战略立场（2026-04-19 确认）**：先收费，持续完善。但"达到付费最低门槛"是前置硬约束，不是锦上添花。v1.2.1 就是这个硬约束。

### 核心抓手（从 v2.0 原抓手 B 升级）

当前 Evolve 实现（v1.1.1 已落地 `EvolveVocabulary.swift`）：**词典轮转 + temperature 抖动**——结果是玄学波动，听感变化没有叙事。

v1.2.1 升级方向：**按三个音乐维度分别调制**，让 Evolve 听起来"有方向"而不是"有随机"：

- [ ] **instruments 维度**：每个频道定义 core / accent / optional 三层乐器池。Evolve 触发时从 accent / optional 层加减（如 Jazz 频道：core = piano/bass/drums；accent = saxophone/trumpet；optional = vibraphone/flute/strings）。加减动作受 Evolve 挡位约束：10s 挡每次 ±1 件 optional、1m 挡 ±1 件 accent、5m 挡可能整组换
- [ ] **density 维度**：新增 density 标量（0.3-1.0），映射到 prompt 里的"sparse/moderate/dense/full arrangement"描述词。Evolve 在 ±0.15 范围内随机走
- [ ] **energy 维度**：新增 energy 标量（0.3-1.0），映射到"laid-back/steady/driving/intense"。同样 ±0.15 随机走
- [ ] **三维度独立触发**：每次 Evolve tick 随机挑 1-2 个维度改（不全改），避免"突变"感，符合 Phase 2.6 "不做突然风格转变"红线
- [ ] **Lock 挡真锁死**：Lock 模式三个维度全部冻结当前值，不抖 temperature——真正的"稳住别变"

### 实施范围（单文件 + 一个新模型，风险极小）

**改动文件**：
- `Simone/Network/PromptBuilder.swift` — 新增 instruments / density / energy 注入
- `Simone/Network/EvolveVocabulary.swift` — 从词典库升级为三维度调制器
- `Simone/Models/Channel.swift` — 每个 channel 补 `instrumentPool: (core, accent, optional)` 字段
- `Simone/Models/AppState.swift` — 暴露 `currentDensity` / `currentEnergy`（仅内部状态，不上 UI）

**不碰**：AudioEngine、LyriaClient、Visualizer、Views 全系。纯 prompts 侧升级，**可逆性极强（revert `EvolveVocabulary.swift` 即回到 v1.2 行为）**。

### 实施阶段

- [x] **P0 · Checkpoint**：iOS main 打 tag `v1.2.1-pre-evolve-depth`（2026-04-19）
- [x] **P1 · Channel 乐器池定义**：`StyleCategory.instrumentPool` 5 频道 core/accent/optional 三层 + 5 legacy 映射；`InstrumentPool` struct 落在 `Simone/Models/PromptState.swift`
- [x] **P2 · EvolveVocabulary 升级为三维度调制器**：状态调制器实装在 `AppState.evolve()` + `evolveInstruments()` + `toggleOne()`；按挡位分流（Lock=nop / 30s=optional ±1 / 1m=70% accent + 30% optional / 5m=整组 reshuffle）；`ScalarWalk` 游走 density/energy。老 `EvolveVocabulary.swift` 词典保留做 `PromptBuilder.evolveVariant` 的降级兜底
- [x] **P3 · PromptBuilder 注入**：`build(style:activeAccents:activeOptionals:density:energy:)` 新签名走 dedupe 去重 + 四档 `PromptPhrase` 描述词注入，老签名 `build(style:)` 保留给 selectStyle/regenerate 路径
- [x] **P4 · 直提 App Store 审核**（2026-04-19 晚，CEO 拍板跳过 TF 灰度）：build 11 上传 ASC `733c2d23…` → 撤回 v1.2 pending 提交 → 重命名 v1.2 version record 为 v1.2.1（规避 409 create conflict）→ 推 ASC 元数据（subtitle/promotional/description/whatsNew，CEO 反馈"比 v1.2 精简易懂"）→ attach build 11 → 提交审核 · submission `b76bd517` state=WAITING_FOR_REVIEW

### 验收标准（硬性）

**老鱼自测体感**：
- Lock 挡：守 30 分钟音乐应该几乎不变（当前 5-10 分钟就腻 → 期望 ≥ 20 分钟稳住）
- 10s 挡：守 30 分钟应该能听出至少 5 次"有乐器加减"的瞬间，但不换台
- 1m 挡：守 60 分钟应该有明显"能量曲线"（加进来、稳住、减下去）
- **总体目标：从 15 分钟腻 → 撑 30+ 分钟不想切**

**验收不通过的预案**：
- 如果 P4 灰度后老鱼还是 15-20 分钟腻 → 补做抓手：把 v2.0 抓手 A（频谱视觉三层耦合驱动）的高频层 + 低频层一起提前。**视觉跟上听觉的变化，双管齐下治疲劳**
- 如果 P4 灰度后撑到 30+ 分钟 → 直接进 v1.3 商业化

### 红线（沿用 Phase 2.6）

- ❌ 不做"突然风格转变"——每次 Evolve 最多改 2 个维度
- ❌ 不做"跨频道漂移"——Jazz 不会 Evolve 成 Electronic
- ❌ 不做 UI 暴露——density / energy 是后台状态，不给 Studio 档之外的用户看（v2.0 再开放）

### 可逆性

- Revert `EvolveVocabulary.swift` 回到 v1.2 行为
- Channel.swift 新增字段是 additive，老逻辑不受影响
- `currentDensity` / `currentEnergy` 默认 0.6（中等），旧代码读不到也安全

---

## v1.3 —— 商业化（Phase E + StoreKit 2 + Phase 2.5 付费分层真接入）

**目标**：Flow/Tune/Studio 付费分层真生效，早期用户红利锁定。

- [ ] StoreKit 2 接入：月订阅 + 买断两条线
- [ ] 付费分层真生效（v1.0 全免费解锁分拆）：
  - **Flow** 免费：随机调台、基础 Evolve、Sleep Timer、18 可视化器
  - **Tune** $1.99/月 或 $9.99 买断：点具体风格、收藏、拼标签生成、可视化器排序
  - **Studio** $4.99/月 或 $19.99 买断（含 Tune）：Direct Input、BPM/temperature 高级参数
- [ ] 早期用户红利：前 100 名买断享 **50% off**（StoreKit Introductory Offer）
- [ ] 🔒 升级弹窗 UI：买断大按钮 + 月付小字 + "稍后再说"
- [ ] 升级文案对齐 Phase 2.6 品牌语言

**关键文件**：新建 `StoreKitManager.swift` / `UpgradeView.swift` / `AppState.swift` / `SettingsView.swift` + App Store Connect 产品配置

**验收**：Flow 用户点 🔒 弹升级 · Tune 购买解锁对应功能 · Studio 可用 Direct Input · 前 100 名看到 50% off 促销价


---

## v2.0 —— 音乐表现力（剩余：Phase C + Smart Adapt + 频谱三层耦合）

**目标**：解决频谱看腻 + 场景自适应（老鱼原话："现在的频谱太单调了"）。

**注：原抓手 B（Evolve 深度算法）已于 2026-04-19 提前至 v1.2.1 作为付费前置，不在 v2.0 范围内。**

### 抓手 A：频谱视觉表现力重塑（实施前再写 spec 到 `docs/superpowers/specs/`）

不做自动轮播，做**单个 visualizer 内部的三层耦合驱动**：

- **高频层（60fps，跟音频）**：新增 `AudioEngine.beatAmplitude`（bass RMS）+ `energyLevel`（整谱 RMS），用于粒子爆发 / 脉冲尺寸
- **中频层（秒级，独立时间相位）**：`Date()` 驱动 sine，颜色渐变相位 + 图层呼吸
- **低频层（跟 Evolve 触发）**：Evolve 每次触发时切主色 + 图层 reshuffle，Lock 模式完全静止

**5 个独立 commit 抓手**：
- [ ] A1：AudioEngine 暴露 `beatAmplitude` + `energyLevel`（~15 行，vDSP_rmsqv）
- [ ] A2：新建 `VisualizerDriver.swift`，三层信号中枢（需要从 `AppState.evolve()` 触发 `onEvolve()`——和 v1.1.1 同事拉通 hook 点）
- [ ] A3：`MorandiPalette` 静态 5 色 → 动态调色板函数（保留 static 作降级）
- [ ] A4：`SpectrumCarouselView:20-26` 唯一注入点，driver 传入 visualizer
- [ ] A5：11 个 visualizer 分 2 批接入（第 1 批 6 个已有 bass 检测的，第 2 批 5 个剩下的）

**Scope 硬约束**：只改 `VisualizerStyle.allCases` 枚举里的 **11 个**（horizon/ringPulse/terrain/rainfall/helix/lattice/prism/matrix/flora/glitch/oscilloscope），`Views/Visualizers/` 目录下不在枚举里的文件是老鱼否掉的，不碰。主页 UI 零视觉改动。

### 抓手 C-E：音乐侧（独立 commit）

- [x] ~~B：Evolve 深度算法~~ → **已提前至 v1.2.1 实施**
- [ ] C：BPM UI 开放（AppState.bpm 已有字段，暴露到 SettingsView 滑块，Studio 档独享）
- [ ] D：Slow Jam 推荐机制（基于播放时长 + 收藏行为推荐频道；依赖 v1.3 收藏数据）
- [ ] E：Smart Adapt（Phase 2.5 遗留）—— Time-aware 必做（早上明亮/深夜低沉），Weather-aware 可选

**关键文件**：`AudioEngine.swift` / `AppState.swift` / `SpectrumCarouselView.swift` / `Views/Visualizers/`（11 个）/ `PromptBuilder.swift` / `SettingsView.swift`

**验收**：
- 抓手 A：同频道任选 visualizer 守 60s 有明显节奏感（高频层）· 看 30s 有颜色相位漂移（中频层）· Evolve 10s 挡守 60s 主色/布局变化 ~6 次（低频层）· Lock 模式低频层静止
- 抓手 B-E：同频道播 30 分钟不疲劳（Evolve 有感变化 ≥3 次）· BPM 拖动 5s 响应 · 早/午/深夜氛围不同 · "For You"推荐频道


---

## v2.1 —— 平台集成（Phase D）

**目标**：把"当前在听什么"从 App 内延伸到 iOS 生态全境——锁屏/灵动岛/桌面小组件。用户不用解锁进 App 也能看到频道、切风格。

### 5 个独立 commit 抓手

- [ ] **1. 频谱快照 Artwork**：切台/Evolve 时用 `ImageRenderer` 对当前 visualizer 截一帧 → `MPMediaItemArtwork`。替换现有色块 artwork（`AudioEngine.swift:434 makeArtwork` 升级为 `VisualizerSnapshotRenderer`）
- [ ] **2. 锁屏 ◁▷ 切风格**：`MPRemoteCommandCenter.nextTrackCommand / previousTrackCommand` 绑到 `AppState.nextStyle / prevStyle`（和 v1.1.1 ◁▷ 按钮共用 AppIntent，不提供暂停——Simone 是电台不是播放器）
- [ ] **3. 灵动岛 Live Activity**：新建 `SimoneWidgetExtension` target，`ActivityKit` 注册。紧凑态 = 风格名 + 伪频谱呼吸 bar（SF Symbol `.variableColor.iterative`，**不绑真实 FFT**——跨进程+iOS 限流）；展开态 = 频谱快照艺术图 + ◁▷ AppIntent 按钮
- [ ] **4. 中号 Widget + 左右键交互**：同一 WidgetExtension target 加中号 Widget，timeline 每 15 分钟刷；◁▷ 用 AppIntent 触发 `prevStyle/nextStyle`；艺术图用频谱快照。**只做中号**（小/大档等装机数据回来再扩）
- [ ] **5. API Key 反调试**：XOR + 字节拆分基础上加三道——`sysctl` 检测调试器附加 / `dyld` 检查越狱/注入环境 / 运行时首次解密后立即抹内存 buffer

**共享基础设施**：
- 抓手 1/3/4 都要频谱快照 → 建 `VisualizerSnapshotRenderer.swift` 单例，主 App + WidgetExtension 共用
- 抓手 2/3/4 的 ◁▷ 行为 → 共享同一套 `NextStyleIntent` / `PrevStyleIntent`（AppIntents），一处定义三端通吃

**commit 顺序**：5 → 1 → 2 → 3 → 4（先 Key 加固抹掉安全风险，再升级锁屏，最后做 Live Activity + Widget 一起搞 target）

**关键文件**：`AudioEngine.swift`（artwork + remote command）/ `APIKeyObfuscator.swift`（加固）/ `AppState.swift`（AppIntent 对接）/ 新建 `VisualizerSnapshotRenderer.swift` / 新建 `SimoneWidgetExtension/`（Widget + Live Activity 同 target）/ 新建 `NextStyleIntent.swift` `PrevStyleIntent.swift`

**Out of Scope**：
- 大号/小号 Widget（数据驱动再扩）
- 灵动岛真实频谱 bar（iOS 限流，做不了真频谱；伪频谱替代）
- Widget 实时 FFT（timeline 每 15min 静态刷）
- 锁屏播放/暂停（Simone 产品定位是电台，不提供暂停）

**验收**：
- 抓手 1：切台瞬间锁屏 artwork 跟着换（新截图）
- 抓手 2：锁屏按 ◁▷ 正确切换下一个/上一个风格（频道内）
- 抓手 3：灵动岛紧凑态呼吸 bar 动起来·展开态点 ◁▷ 切风格（不解锁）
- 抓手 4：桌面装中号 Widget·点 ◁▷ 不开 App 切风格·15min 艺术图刷新
- 抓手 5：`strings` 扫安装包扫不出明文 Key·越狱设备/MobSF 检测到调试器自动清 Key

**工作量**：2 周（比原计划 1 周翻倍，多了"锁屏 ◁▷"+ 反调试两项）


---

## v2.2+ 长尾待定

- **Studio 档大功能**：多风格混合、离线电台、下载片段导出、6 套深度主题、Generate Custom Visualizer
- **Mac 版独立上架**（`simone mac/` 已有源码）
- **iPad 适配优化**
- **跨设备同步**（CloudKit 收藏/偏好）
- **数据统计**（风格热度、用户行为）
- **通知与每日氛围推送**

## 执行原则

- **每个 Phase 开工前单独 brainstorm 细节**：这份整体规划不是具体设计，每个新 version 启动用 brainstorming skill 深入该 Phase
- **每个 Phase 完成后立刻更新** `SimonePlan.md` + `CLAUDE.md`
- **每次改完代码立刻 push**（老鱼看 TestFlight）
- **Phase 间不混合**：上一个 version ship 前不开下一个 version

## 分工

**小克**：v1.1.0 → v2.1 全部代码实施 + 计划书维护
**老鱼**：TestFlight 体验反馈 + v1.3 的 App Store Connect 产品配置
