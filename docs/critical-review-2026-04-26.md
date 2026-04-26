# Simone 一针见血诊断 — 2026-04-26

> COO 自审，给 CEO 看。不堆 A/B/C，结论先行。
> 范围：代码 / 架构 / 战略 / 治理。

---

## TL;DR — 5 条最致命

1. **单人 + 单 AI 项目，搭了 7 角色公司架构**。每次"切角色"= /clear + 读 4 锚点 = **主动失忆再花 5-10 分钟重建上下文**。比一个 AI 一直在线干活慢得多、错得多。memory 累计 9 条 feedback，每条都是 ceremony 失守后的补救——是症状，不是治疗。
2. **战略 2 个月内换了 7 次主线**。每次都先开分支再开 plan 再开干，干一半再砍。**没有"做完一件事"的肌肉**。
3. **39 个 visualizer，5 个真在产品里用**。剩下 34 个加上"已砍但代码还在"的 RnB + Electronic Signature（2233 行）= **≈5000-8000 行 dead code 在 main**。
4. **音频/性能 fix 5 次全 revert**（main thread / bufferMin / TimelineView / GeometryReader / 三处减负）。**没有诊断 metrics**，靠 CEO 耳朵猜病。"改完必测"是手测，CI 只跑 42 行 xcodebuild。
5. **v2.1 战略前提"Lyria API 免费 = 无 burn rate"是 risky bet**。`models/lyria-realtime-exp` 字面 experimental，Google 改条款是大概率事件。整个商业化时机押在 Google 不变——不是 ban paywall 的好理由，是"提早设计、晚启用"的理由。

---

## 治理层

### 1. 7 角色公司是表演

实体：1 个 CEO（老鱼）+ 1 个 AI（小克）= 2 个。
角色卡：COO / PM / Strategist / iOS Engineer / UI/UX Engineer / Release Engineer / Assistant = 7 张。

每张 95% 文本相同：
- "启动必读 4 锚点（CLAUDE.md / AGENTS.md / operating-principles.md / SimonePlan.md）"
- "决策权限三类（钱/发布/定位）"
- "硬规矩：状态变化覆盖 status / Phase 切换走 SOP"
- "不碰：其他 6 角色的活"

实质：**同一个 AI 戴 7 顶帽子**。"切帽子"流程：① 更 team-status ② `/clear`（主动清空 working memory）③ 读 4 个锚点重建上下文 ④ 开干。

为了模拟"换人"主动失忆，再花成本重建——比一个 AI 一直在线、保留 working memory 直接干，**慢得多、错得多**（每次重建都丢细节）。

memory 9 条 feedback 印证：
- `feedback_clear_relay_prompt.md` "/clear 必附接力 prompt"
- `feedback_no_question_pushback_on_handoff.md` "接力 prompt 截断不回问"
- `feedback_self_verify_before_ship.md` "不靠纯推理 ship 让 CEO 当 QA"
- `feedback_open_xcode_not_simulator.md` "交付开 Xcode 不开模拟器"

→ **每条都是 /clear 后丢上下文的补救**。

### 2. 文档冗余 PageRank 倒挂

同一信息存 4 份：
- "决策三类" → CLAUDE.md / operating-principles.md / 7 角色卡
- "状态覆盖 / Phase SOP" → CLAUDE.md / AGENTS.md / 7 角色卡
- "启动必读 4 锚点" → 7 角色卡每张

CEO 自己刚做过 docs slimdown 28→13，但仍 11 + 7 = 18+ 文件。

### 3. daily 日报空转

operating-principles 写："CEO 次日早上只看这一份"。但 daily/2026-04-25.md 三段：
- 今天动了啥：4 行（每行都来自 git log 能看出）
- 明天谁在跑：2 行 TODO
- **待 CEO 拍：无**

**写的是 AI、看的也是 CEO（但 CEO 自己昨晚就在工程里）= 自我汇报**。价值为零的 ceremony。

---

## 战略层

### 4. 战略反复横跳（2 个月 7 次）

| 时间 | 当时主线 |
|---|---|
| 2026-04-15 | v1.2 Fog City Nocturne |
| 2026-04-19 | v1.2.1 PromptBuilder + v1.3 商业化 + v2.0 频谱三层 + v2.1 锁屏 |
| 2026-04-21 | v1.4a Signature Visualizers 插队（来自 inbox #005） |
| 2026-04-21 | "跳过 v1.4a Part1/2，先做 Lo-fi" |
| 2026-04-21 | "审过 Lo-fi 再开 Jazz/Rock/RnB/Electronic"——但 RnB + Electronic 没等审就写了 2233 行 |
| 2026-04-23 | v1.3.0 备料包（Lo-fi Signature + Onboarding + AppIcon） |
| 2026-04-25 | 战略 v2.1 "Retention First Fork B + iPad" + 砍 v1.4a 4 频道 + 砍 v1.4b Studio 档 + 砍 Mac 版 |
| 2026-04-25 | W1 锁屏 abort → 跳 W3-4 iPad |

**每 2-3 天换一次主线，每次都开新分支 + 写新 plan + 开干 + 砍**。这是"做了很多 + 没做完一件"的工艺。

### 5. SimonePlan v2.1 的伪科学节奏

5 周节奏看似有结构：W1 锁屏 → W2 Lo-fi Signature → W3-4 iPad → W5 观测 → W6 paywall。

实操问题：
- **W1 已经 abort**（status 板："main 已回滚 → 跳到 W3-4"）。"严格串行"承诺第一周就破。
- **W3-4 是 3-4 周单抓手**——不是周节奏，是月节奏，标错档位。
- **W5 决策点 D7 > 25% → paywall, < 25% → 回 W1 加新抓手**：
  - v1.3.0 上架 1 天，5 周后 install 估计 < 500，**D7 ±10% 都是噪声**，binary threshold 拍不出
  - "每周 1 抓手影响 D7"的因果链不存在——锁屏 / Lo-fi 视觉 / iPad 都不直接抬 D7
  - "<25% 回 W1 加新抓手" = 没策略，循环：失败时唯一动作是"做更多"
- **"🔴 paywall 价格 W6 触发再问"**——定价不可逆决策不能压到 W6 临时拍，必须前置思考 + 早做调研。

### 6. "Lyria API 免费"是高风险前提

SimonePlan v2.1 最大改动：
> "成本：Lyria API **免费**（无 burn rate 压力）"
> "战略：抬留存 → 观测 30 天 → 看数据决定 paywall"

事实：
- model id `models/lyria-realtime-exp` **字面 experimental**
- Google 历史上 experimental → GA 都开始收费（Gemini Pro / Veo / Imagen）
- 单一 vendor 单一 endpoint = 0 redundancy
- 没有 cost monitoring，没有 fallback 模型

**临时性外部依赖被当成永久财政基础**。这不是放弃 paywall 的好理由，是 **paywall 应该"骨架先建、晚启用"** 的理由——StoreKitManager.swift v1.3 已写骨架，应该继续推到"接 receipts 但不挂 paywall"，等 Lyria 收费当天启用。

### 7. 砍东西不彻底

战略宣告砍但代码还在：
- v1.4a 4 频道 Signature → `Views/Signatures/ElectronicSignatureView.swift` 1351 行 + `RnBSignatureView.swift` 882 行 = 2233 行
- v1.4b Studio 档 → 战略说"砍"，但 `StoreKitManager.swift` / `Tier.swift` / `ChannelTier.swift` 仍在
- Mac 版 → `simone mac/` 完整目录还在仓库（Package.swift / Simone.xcodeproj / SimoneTests）
- 38 通用 visualizer → 战略说"留着，等 v1.4b 真做再评估"= 既不清也不删
- `_archive/` 4 个老归档（Simone_ios_old / colab-bridge / simone-v0-github-backup / web）继续占空间

**"可逆原则"被滥用为"什么都不删"**。可逆 ≠ 不清理；可逆 = git 留下回滚 tag，但 working tree 可以瘦身。

---

## 代码 / 架构层

### 8. 双 git repo 没用 submodule

- `/Users/oldfisherman/Desktop/simone/` 主 repo（docs / SimonePlan / .claude）
- `/Users/oldfisherman/Desktop/simone/simone ios/` 独立 git history（生产代码）

Release Engineer 卡明文："两个 repo 都要 commit/push 不能漏"——纯手工同步。

应该 git submodule 或 monorepo subtree。**当前结构 release 漏推一个就 PR/build 不一致**，是 release engineering 的最大单点 risk。

### 9. AppState 是 654 行 god class

混了：selection / channel / playback / Auto-Evolve timer / Auto Tune timer / Sleep timer / VisualizationMode（已废 enum 还留）/ 三维度调制（不暴露 UI）/ UserDefaults 持久化 + **3 轮 migration 注释**。

`init()` 已经在做 v1.1.1 / v1.2.1 / v1.4a 三轮 UserDefaults 清理：
```swift
UserDefaults.standard.removeObject(forKey: "sessionRotationEnabled")  // v1.1.1
UserDefaults.standard.removeObject(forKey: "pinnedStyles")            // v1.4a
UserDefaults.standard.removeObject(forKey: "favoritesVisualizer")     // v1.4a
UserDefaults.standard.removeObject(forKey: "visualizationMode")       // v1.4a
// + autoTuneMigrationV121Done one-shot reset
```

每轮加注释解释"为什么保留" / "为什么删 key 但 enum 还留"。**"可逆原则"导致代码堆"虽然没用但保留"，每轮都加一层，从来不清理**。

### 10. Visualizer 池 dead code 占绝对多数

- `Views/Visualizers/` **39 个 .swift** 文件
- `Views/Signatures/` 2 个：Electronic 1351 行 + RnB 882 行 = 2233 行
- CLAUDE.md 自己说："5 默认 visualizer (tape/oscilloscope/liquor/ember/matrix)"

**≥34 个 visualizer + 2 个砍掉的 Signature ≈ 5000-8000 行不在产品里的代码**。

这也是 v1.4a "审过 Lo-fi 再做下一个频道"串行承诺被破坏的物证：
- plan：Lo-fi → CEO 审 → Jazz → CEO 审 → Rock → CEO 审 → RnB → CEO 审 → Electronic
- 实际：Lo-fi ship 同时已经把 RnB（882 行）+ Electronic（1351 行）写完进 main

### 11. 分支管理失控

iOS 仓库 8 个 feature 分支：
| 分支 | ahead/behind main | 应该 |
|---|---|---|
| feature/fog-redesign | — | 删 |
| feature/v1.2-fog | 0 / 91 | 删 |
| feature/v1.2.1-evolve-depth | 0 / 67 | 删 |
| feature/v1.3+signature-lofi | 0 / 1 | 删 |
| feature/v1.3-monetization | 0 / 36 | 删（要做时从 main 重开） |
| feature/v1.4a-signature-lofi | **4 / 89** | rebase 或砍（这 4 commit 是啥？） |
| feature/v2.1-w1-system-integration | 4 / 0 | abort 后 4 commit 没删 |
| feature/v2.1-ipad-adapt | 当前 working | 保留 |

主仓也有 `docs/v1.3-sync-2026-04-21` + `feature/v1.4a-signature-lofi` 两个没清。

### 12. 音频/性能补丁反复 revert

近期 git log（iOS 仓库）：
```
82a113f Revert "audio chunk processing 移出 main thread"
b88e369 audio chunk processing 移出 main thread (修 stutter)
8e618f6 Revert "audio stutter — bufferMin 1→3"
9ddee94 audio stutter — bufferMin 1→3
0623e6b Revert "修 UI rewrite 后双卡 — 删 GeometryReader + Channel.all 改 static let"
ef89a3c Revert "修音频/动画卡顿 — 三处主线程减负"
bfbddf4 Revert "干掉外层 TimelineView 30fps 常驻"
43660c9 revert(v1.3): 砍 ghost ring · CEO 判定呼吸感 UI 太难看
```

**5+ 次 audio/perf fix 全 revert**，复盘"是 Lyria 晚高峰 API 拥塞"。
- **没有诊断 metrics**（packet 间隔 / underrun count / queue depth）
- 凭"改 → 听 → 觉得没效果 → revert"猜诊断
- AudioEngine.swift 720 行 + LyriaClient.swift 345 行带 3 个 reconnect callback flag 互锁（`onConnected` / `onReconnectStarted` / `onReconnected` + `isIntentionallyRestarting`）。**每次 fix 加新 flag、加新注释解释为什么留**——下次 fix 时认知负担再加一档。

### 13. 测试覆盖 ≈ 仪式

- `SimoneTests/` 只 2 个文件：AudioBufferQueueTests.swift + PromptBuilderTests.swift
- `verify-build.sh` 42 行只跑 xcodebuild，**不跑 unit test**
- "改完必测" 是手测列表（首屏 5 秒 / 横滑 / Evolve / Lock 10 min / Settings 持久化 / 锁屏 artwork）——全靠 CEO/AI 在模拟器手测

CLAUDE.md 警告："类型检查和测试套件验证代码正确性，不验证特性正确性"——**对，但反过来不是"那就不要测"，是"两者都要"**。当前是只剩半边。

### 14. iOS 仓库混 dev 工具

`simone ios/server.py` 10KB Python server 在生产代码仓库里。`.env.local` 在工作区（.gitignore 应过滤但相邻代码视觉污染）。

---

## 立即可做的 5 件（不破坏可逆原则）

1. **承认 7 角色 ceremony 是 over-engineering，回 COO 单角色 + subagent 模式**——保留 COO.md，把其他 6 张归档到 _archive/roles_old/。AGENTS.md 改 "COO 一个 + 必要时 spawn subagent"。
2. **删 5 个废弃分支 + abort 2 个停滞分支**（v1.2-fog / v1.2.1-evolve-depth / v1.3+signature-lofi / v1.3-monetization / fog-redesign / v2.1-w1-system-integration / v1.4a-signature-lofi）。当前 working：v2.1-ipad-adapt 保留。
3. **冻结 v2.1 W1-W6 节奏，改"做完 W3-4 iPad 再说下一件"**——5 周节奏没有 sample size 支撑 D7 决策，串行承诺第一周已破。诚实节奏：一周 1 抓手 → ship → 看反馈 → 决定下一件。
4. **visualizer 二选一**：要么"砍 30+ dead code 移到 _archive/visualizers-pool/"，要么"保留作为 v1.4b 候选池但写明 owner + 启用条件"。当前的"留着不清不更"既占代码又占心智。
5. **加 audio metrics**——packet 间隔 / queue depth / underrun count，os_log 一个 ring buffer 即可。下次 stutter 不再凭"听感"猜。30 行代码事，CLI 抓 log 就能看。

---

## 待 CEO 拍（🔴）

仅 3 个，不堆 A/B/C：

### 🔴 1. 承认 7 角色公司是 over-engineering，回到 COO 单角色 + subagent

**推荐 ✅**。代价：删 6 张角色卡 + 简化 SOP；收益：每次"换帽子"省 5-10 分钟，working memory 不再被强制清空。subagent 留作真并行的活。

### 🔴 2. 砍 `simone mac/` 子仓库

**推荐 ✅**。SimonePlan v2.1 已说"iPad 适配吃掉跨设备需求，Mac 等 v2.0"——但代码还扎根仓库。砍 ≠ 永久不做，re-init 任何时候都行（git 有 tag）。

### 🔴 3. 承认 v2.1 W1-W6 节奏是空头支票，改"逐周决定下一周"

**推荐 ✅**。当前已 W1 abort 跳 W3-4，承诺已破。改成"做完一件再决定下一件"诚实些，也不用 W5 强行交决策。SimonePlan 写"一周一抓手、ship 后看反馈再决定"即可，去掉 5 周表。

---

## COO 自决执行（不需 CEO 拍）

- 删 7 个废弃分支
- 30+ dead visualizer 移 `_archive/visualizers-pool/`（含归档说明）
- audio metrics os_log 加 30 行
- AppState 拆成 3 文件（Selection / Playback / Persistence）— 一次 commit 一份，可逆
- 双 git repo 改 monorepo subtree —— 一次性事，3 小时
- daily 日报机制改"只在有 🔴 决策时写，否则跳过"
- docs/inbox.md 旧 resolve 项归档到 v1.x-resolved.md，主文件清空

---

## 核心判断

**Simone 现在最大的问题不是代码，是工艺**。代码所有问题（god class / dead visualizer / 音频 fix revert / 分支失控）都是工艺产物——
- 没有"做完才下一件"的肌肉 → 每次开新分支 + 新 plan + 写一半再砍 → 代码留下半成品
- 没有诊断 metrics → 性能 fix 凭感觉 → 5 次 revert
- 7 角色 ceremony 让每次都"换人重读"→ 上下文丢失 → memory 9 条 feedback 都是补救

**v1.3.0 已上架 = 产品阶段已切换**。从"边做边砍的实验期"切到"用户在用、改动有代价的运营期"。但内部还在用实验期的工艺（每周换主线 / 每个抓手新分支 / 砍东西只在文档里砍）——**这是不匹配**。

战略 v2.1 写"Retention First"是对的方向，但执行节奏要从 4 周一跳改成"做完一件 ship 再说下一件"，从"7 角色公司"改成"一个 AI 一直在线"。

