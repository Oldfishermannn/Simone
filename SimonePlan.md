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

**产品定位**：氛围电台（Ambient Radio）— 不是播放器，是电台。选台就完了。
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
**Simone — AI Ambient Radio**

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

## v1.1 总体策略

**串行执行，子版本滚动发布**：每个 Phase ship 独立 `v1.1.x`，两周一节奏。

**顺序：先稳 → 再变 → 再爽 → 再连 → 再赚。**

| 子版本 | 主题 | 估时 | 累积 |
|---|---|---|---|
| v1.1.0 | 稳定性 | 1.5 周 | 1.5 周 |
| v1.1.1 | 交互重塑 | 2 周 | 3.5 周 |
| v1.1.2 | 音乐表现力 | 1.5 周 | 5 周 |
| v1.1.3 | 平台集成 | 1 周 | 6 周 |
| v1.1.4 | 商业化 | 1 周 | 7 周 |

---

## v1.1.0 —— 稳定性修复（Phase B）

**目标**：消除用户流失点，把 v1.0 地基打牢。

- [ ] 预加载伪实时：进入 App 先下载 1-2 分钟音频到本地缓冲，切出回来无缝续播
- [ ] 重连平滑：LyriaClient 重连过渡时保持旧 buffer 播放，用户无感
- [ ] 30 分钟自动换台机制：session 级定时换电台，规避 Lyria 长连接不稳
- [ ] 播放卡死 bug 定位 —— heartbeat 监控 + 自动恢复
- [ ] 免费试用残留代码清理
- [ ] NowPlaying 补齐：title（风格名）+ artwork

**关键文件**：`LyriaClient.swift` / `AudioBufferQueue.swift` / `AudioEngine.swift` / `AppState.swift`

**验收**：切出 5 分钟回来无缝续播 · 连续播放 1 小时无卡死 · 锁屏显示风格名+artwork

---

## v1.1.1 —— 交互重塑（Phase A + Phase 2.6 命名落地）

**目标**：从"列表选风格"颠覆为"滑动即切台"。

- [ ] 频谱 = 频道：每个频谱绑定频道视觉身份
- [ ] 滑动频谱切换频道（替代 ◁ ▷ 按钮）
- [ ] 详情页改横向左右滑动（替代纵向 Tab）
- [ ] 详情页频道/pills 自由排列（拖拽排序，Tune 档）
- [ ] Evolve 重定义：从"同风格微调"改为"定时在同频道内换台"
- [ ] 收藏逻辑：收藏**频道**，不是单独电台
- [ ] Phase 2.6 命名落地：UI 文案改 Flow / Tune / Studio

**关键文件**：`SpectrumCarouselView.swift` / `PlayControlView.swift` / `DetailsView.swift` / `AppState.swift` / `MusicStyle.swift`

**验收**：频谱水平滑动 < 2s 出声 · 详情页横滑无卡顿 · Evolve 定时换台 · 收藏作用于频道

---

## v1.1.2 —— 音乐表现力（Phase C + Smart Adapt + Phase 2.5 Evolve 深度）

**目标**：解决听久疲劳、频谱看腻。

- [ ] Evolve 深度算法：加减乐器/密度变化/能量变化三类微调（当前只是 temperature 抖动）
- [ ] BPM UI 开放：AppState 已有字段，暴露到 SettingsView 滑块
- [ ] 频谱视觉多样化：28 可视化器自动轮播 / 氛围联动
- [ ] Slow Jam 推荐机制：基于播放时长 + 收藏行为推荐频道
- [ ] Smart Adapt（Phase 2.5 遗留）：
  - Time-aware 必做（早上明亮/深夜低沉）
  - Weather-aware 可选（需定位权限，评估后定）

**关键文件**：`PromptBuilder.swift` / `SettingsView.swift` / `Visualizers/` / `AppState.swift`

**验收**：同频道播 30 分钟不疲劳（Evolve 有感变化 ≥3 次）· BPM 拖动 5s 响应 · 早/午/深夜氛围不同 · "For You"推荐频道

---

## v1.1.3 —— 平台集成（Phase D）

**目标**：iOS 生态深度融合。

- [ ] 锁屏/灵动岛优化：title（频道名·风格）+ artwork（频谱快照/专属 artwork）
- [ ] API Key 保护加强：XOR + 字节拆分基础上加运行时反调试
- [ ] 小组件（Widget）：小/中/大三尺寸（当前频道 + 播放/暂停 + 频谱预览 + 频道切换）

**关键文件**：`AudioEngine.swift` / `APIKeyObfuscator.swift` / 新建 `SimoneWidget/`

**验收**：灵动岛显示频道名+频谱动画 · 锁屏 artwork 随频道变 · 小组件点击 <1s 响应 · `strings` 扫不出明文 Key

---

## v1.1.4 —— 商业化（Phase E + StoreKit 2 + Phase 2.5 付费分层真接入）

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

## v2.0 延后项清单

- **Studio 档大功能**：多风格混合、离线电台、下载片段导出、6 套深度主题、Generate Custom Visualizer
- **Mac 版独立上架**（`simone mac/` 已有源码）
- **iPad 适配优化**
- **跨设备同步**（CloudKit 收藏/偏好）
- **数据统计**（风格热度、用户行为）
- **通知与每日氛围推送**

## v1.1 执行原则

- **每个 Phase 开工前单独 brainstorm 细节**：这份整体规划不是具体设计，每个 v1.1.x 启动用 brainstorming skill 深入该 Phase
- **每个 Phase 完成后立刻更新** `SimonePlan.md` + `CLAUDE.md`
- **每次改完代码立刻 push**（老鱼看 TestFlight）
- **Phase 间不混合**：v1.1.0 不 ship 绝不开 v1.1.1

## v1.1 分工

**小克**：v1.1.0 → v1.1.4 全部代码实施 + 计划书维护
**老鱼**：TestFlight 体验反馈 + v1.1.4 的 App Store Connect 产品配置

