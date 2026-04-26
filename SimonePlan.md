# Simone 路线图

> 起点：2026-04-26（v1.3.0 已上架，工艺重置）
> 节奏：**做完一件 ship 再说下一件**——不堆 5 周表，不写"4 周内有数字决策"的伪科学

---

## TL;DR

- **现状**：v1.3.0 ✅ LIVE 2026-04-25，零收入
- **成本**：Lyria API 当前免费（experimental status，**不当永久前提**）
- **战略**：Retention First——抬留存优先级 > 货币化时机
- **节奏**：一周 1 抓手，ship 完看反馈决定下一件，不预排 5 周表

---

## 当前主线 — iPad 适配

**为什么先做这个**：iPad 适配把单设备 app 变跨设备，受众面 ×1.5；Visualizer 大屏渲染天然 wow；首屏改观最大。

**进度**（branch `feature/v2.1-ipad-adapt` cb26580）：
- ✅ Phase 0+1+2+3：UIRequiresFullScreen=false / Onboarding 居中 / transport size class / spacer ratio
- 🟡 Phase 4：CEO Cmd+R iPad sim 验最终效果 → 决定是否 merge

**ship 完才决定下一件**。

---

## ship 完 iPad 后的候选池（不排顺序，看反馈再选）

- **锁屏 ◁▷ + Widget**：Now Playing artwork / 切站；中号 Widget tap 进 app
- **Lo-fi Signature Visualizer 收尾**（Lo-fi 已在 main，剩 4 个 commit 在 `feature/v1.4a-signature-lofi`）
- **paywall 骨架完工**（StoreKitManager 已写骨架，receipts 接好但不挂 UI——Lyria 收费当天才启用）
- **audio metrics**：os_log packet 间隔 / queue depth / underrun count，下次 stutter 不再凭"听感"猜
- **AppState 拆分**：Selection / Playback / Persistence 三文件，god class 瘦身

---

## 不再做（明确砍掉）

- **Mac 版**——iPad 适配吃掉跨设备需求，砍 `simone mac/` 子目录，要做随时 re-init
- **v1.4a Jazz / Rock / R&B / Electronic signature 的扩展**——Lo-fi 收尾即可（RnB + Electronic 已写的 view 移 _archive）
- **v1.4b Studio 档功能**（多风格混合 / 离线 / 导出 / Custom Visualizer）——0 付费用户 = 0 优先级
- **5 周决策表 + W5 D7 阈值 binary trigger**——sample size 不支撑，决策表是 ceremony
- **CloudKit 同步**——0 用户跨设备 = 0 优先级
- **Money / billing 监控**——Lyria 当前免费，paywall 启用时再加

---

## 待 CEO 拍板（🔴）

仅 paywall 真要启用时再问：
1. 价格档（推荐 $2.99/mo unlimited 单档，不堆 Tier 2/3）
2. free 池阈值（推荐 1h/day，不堆 30min/2h/day 三档）
3. Introductory Offer（推荐前 14 天 50% off）

**现在不占 CEO 认知**——等 Lyria 收费或 D30 留存数据明确再问。

---

## 执行原则

- **做完一件再开下一件**——上一件 ship 前不开新分支
- 改完代码立刻 push（CEO 看 App Store / TestFlight）
- 状态变化覆盖更新 `docs/team-status.md`
- COO 单角色 + 必要时 spawn subagent 做并行——不再 7 角色切窗口

分工见 `AGENTS.md`。实时状态看 `docs/team-status.md`。
