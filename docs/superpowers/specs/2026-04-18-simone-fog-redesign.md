# Simone · Fog City Nocturne 重设计方案

**日期**：2026-04-18
**版本**：Fog v5（最终锁定）
**性质**：设计探索参考文档（非实施计划）。先存着，后续是否实施再议。

---

## 一、方向定位

**Fog City Nocturne · 雾都夜色**

晚 11 点地下酒吧的雾玻璃感。克制、冷色、极简。视觉 99% 让给音乐。

- **品牌契合度**：★★★★★（最贴近 "都市夜晚 + 温柔陪伴" 的品牌调性）
- **风险**：新用户可能不知道能干嘛 → 通过 onboarding 和 Music DNA 标签解决
- **对标**：Teenage Engineering 说明书 / Aesop 产品页 / 黑胶封套内页

### 为什么不是另外两个方向
- **Neon Pulse**：冲击力强但跟 "温柔陪伴" 品牌冲突，像酒精饮料广告
- **Living Breath**：音乐感最强但动效吃电池，伤长时播放体验

---

## 二、视觉系统

### 2.1 色彩（OKLCH）

```
背景     #0a0d12 → #14181e   // 纵向渐变，顶部更深
纸白     oklch(0.96 0.005 280)  // 几乎白，带一丝冷紫
主文本   oklch(0.90 0.005 280 / 0.9)
次文本   oklch(0.90 0.005 280 / 0.55)
三级文本 oklch(0.90 0.005 280 / 0.30)
强调色   oklch(0.82 0.10 310)   // 紫丁香（Mauve），沿用 v1 的 MorandiPalette.mauve
描边     oklch(1 0 0 / 0.05)
```

**关键原则**：neutral 全部微微偏紫（h=280），跟强调色 Mauve 同系。零纯白纯黑。

### 2.2 字体

| 角色 | 字体 | 说明 |
|---|---|---|
| 显示标题 | **Unbounded** Light 300 | 现代 grotesque，字距偏紧，夜店海报感 |
| 副标题/点缀 | **Fraunces** Italic 300 | 秘密武器，serif 斜体提供文艺温度 |
| 正文 | **Archivo** Regular 400 | 中性无衬线，易读 |
| 元数据 | **Archivo Mono** 400 | 时间戳、版本号、节标签 |

三种字体各司其职：冷（Unbounded）+ 暖（Fraunces 斜体）+ 工具（Mono）。

### 2.3 间距（4pt）

```
--space-xs:  4px
--space-sm:  8px
--space-md:  12px
--space-lg:  16px
--space-xl:  24px
--space-2xl: 32px
--space-3xl: 48px
```

---

## 三、页面架构

**保留现有 VerticalPageView 三页架构不变**：

```
Page 0 · Immersive  沉浸页（频谱全屏）
Page 1 · Home       主页（默认进入，频道切换）
Page 2 · Settings   设置（一屏完整）
```

### 3.1 Page 0 · Immersive

**不动**：
- `SpectrumCarouselView` 全屏保留
- 11 个 visualizer 枚举全保留
- 点击切大小（v1.1.1 特性）

**改动**：
- 底部 Music DNA 标签行：`category · mood · instrument · bpm`，Mono 字体，opacity 0.55
- 风格名 22pt Unbounded Light 300 居中下方
- 频道切换：`translateX slideOut/slideIn` 已有，保持（120ms easeIn + 180ms easeOut）

### 3.2 Page 1 · Home

**保留**：
- 频道卡片列表的基本结构
- 当前播放频道置顶

**新增/改动**：
- 频道项：左侧 Unbounded 频道名 + Fraunces 斜体 mood 副标，右侧 Mono bpm
- 分隔线改虚线 `rgba(255,255,255,0.08)`，不用卡片包裹
- 频道标签用横向字符分隔符 `· · ·` 代替胶囊按钮

### 3.3 Page 2 · Settings（一屏化 · 方案 A）

**关键决策**：Settings 一屏装下，不滚动，彻底避免跟 VerticalPageView 的手势冲突。

**结构（从上到下）**：

1. `∙ Preferences ∙` 节标签（Mono 9pt 居中）
2. 五行紧凑列表（每行：Unbounded 名 + Fraunces 斜体副标 + Mono 值）
   - **Evolve** · *the slow mood shift* → ON
   - **Auto Tune** · *fresh channel weekly* → SUN
   - **Sleep** · *fade to silence* → 45m
   - **Spectrum** · *eleven shapes* → HORIZON
3. Spectrum 行下方嵌入 11 条 mini 频谱预览（4px 宽小条，当前 visualizer 紫色高亮）
4. 虚线分隔 → **Colophon** 区（书籍版权页风格）
   ```
   v1.1.1              2026·04
   Magenta RT          Shanghai
   ```

**未来扩展走二级页**：
- 点击版本号 → Debug & BYOK 二级页
- 长按某行 → 该设置的详细说明

---

## 四、动效

### 4.1 频道切换（Immersive 页）
已有实现保持：`translateX(±40px) + opacity 0→1`，120ms easeIn 出 / 180ms easeOut 进。

### 4.2 页面切换（三页）
保持 iOS 原生 VerticalPageView 的默认弹性，不干预。

### 4.3 Onboarding（首次启动）
三帧静态展示：
- Frame 1：频谱独自呼吸 3 秒，无文字
- Frame 2：底部浮现 Music DNA 标签 + 风格名（fade in 600ms）
- Frame 3：右下角 Fraunces 斜体 "swipe" 提示（2 秒后 fade out）

**零按钮、零跳过、零教程弹窗**。跟 Simone "零引导自解释" 原则一致。

---

## 五、不动清单（明确不改的东西）

- 频谱渲染逻辑（`SpectrumCarouselView` 及其 11 个 style）
- 音频引擎（Magenta RealTime）
- 频道数据结构
- BYOK 认证流程
- 三页垂直架构（VerticalPageView）
- 现有 channel-bound visualizer 绑定（v1.1.1）

**只换皮、不改骨**。

---

## 六、影响评估

| 文件 | 改动幅度 |
|---|---|
| `ImmersiveView.swift` | 中 · 底部文案改字体 + Music DNA 行 |
| `ChannelPageView.swift` | 中 · 列表样式重构 |
| `SettingsView.swift` | 大 · 整体重写为一屏化章节列表 |
| `Models/VisualizerStyle.swift` | 无 |
| `SpectrumCarouselView` | 无 |
| 音频/引擎代码 | 无 |
| 主题/Color 常量 | 新增 Fog 色板 |
| 字体资源 | 新增 Unbounded / Fraunces / Archivo 系列 |

---

## 七、风险与取舍

1. **新字体包体积**：三个字体族 + 字重大约 +500KB 到 IPA。可接受。
2. **Fraunces 斜体的接受度**：跟 Unbounded 冷调搭配是秘密武器，但如果老鱼看久了觉得"太文艺"，可随时降级为 Archivo Italic。
3. **Mauve 强调色**：沿用 v1 的 MorandiPalette.mauve，但在 Fog 里使用频率大幅降低（只在当前选中项、开关 ON 态、高亮值用），更贵重。
4. **一屏 Settings 的扩展性**：未来新功能走二级页，不往主 Settings 加行。这是原则。

---

## 八、参考产出

本次 brainstorm 产出的所有视觉稿：
- `directions-preview.html` · 三方向定位
- `moodboard-three-directions.html` · 三方向完整 moodboard
- `fog-v2-expanded.html` · Fog 沉浸页 + 主页 + 动/不动清单
- `fog-v3-motion-onboarding.html` · 频道切换分镜 + onboarding
- `fog-v4-settings.html` · Settings 章节式首稿（后被 v5 取代）
- `fog-v5-settings-scroll-conflict.html` · Settings 滑动冲突解决（方案 A 一屏化中选）

位置：`/Users/oldfisherman/Desktop/simone/.superpowers/brainstorm/71689-1776496254/content/`

---

## 九、下一步（当老鱼决定实施时）

1. 先做一个 `feature/fog-redesign` 分支
2. 按 "不动清单" 确认音频/频谱不会被误碰
3. 从 SettingsView 一屏化改起（影响最局部，可独立验证）
4. 再改 ChannelPageView
5. 最后改 ImmersiveView 文案 + 动效收尾
6. 每一步都在 TestFlight 跑几天，确认"不破坏沉浸感"原则没违背

**当前状态**：仅为设计探索，尚未实施。等老鱼决定。
