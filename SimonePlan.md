# Simone 路线图

> 战略 v2 起点：2026-04-25（v1.3.0 已上架）。
> 路径：**Fork B — Retention First + iPad 适配**（CEO 2026-04-25 拍板）。

---

## TL;DR

- **现状**：v1.3.0 ✅ LIVE 2026-04-25，零收入，月 Lyria API 烧待测
- **战略**：先抬留存（系统集成 + 单 signature + iPad），观测 30 天再决定 paywall
- **顺序**：先稳 → 再变 → 再美 → **再黏（系统集成 + iPad）→ 再签名 → 再观测 → 再赚**
- **节奏**：1 周 1 主抓手，6 周内有数字决策

---

## 战略核心

**留存 > 货币化**——前提：月 Lyria 烧 < $200。每周一查 billing，超阈值自动跳 Fork A（paywall 优先）。

**为什么 Fork B**：visualizer / 签名美学不抬 D7。锁屏 ◁▷ + Widget 才是日常使用 anchor。iPad 把单设备 app 变跨设备，受众 ×1.5。

**砍掉**：v1.4a 其余 4 频道 signature（Jazz/Rock/R&B/Electronic）· v1.4b Studio 档兑现 · 38 通用 visualizer 池清理 — 全等留存数据再说。

---

## 6 周节奏

### Week 0（今天，半天）— Money 体检

- [ ] 查 Google Cloud billing（v1.3 上架前 7 天 Lyria 用量 → 月预估）
- [ ] 查 ASC 后台首日 install 数
- [ ] 算 unit economics：每用户日均 listen-min × Lyria 单价
- [ ] **决策点**：月烧 > $200 → 跳 Fork A；< $200 → 走下面 Week 1+

### Week 1 — 系统集成（锁屏 + Widget）

- [ ] 锁屏 Now Playing：标题 / artwork / ◁▷ 切站（不是 evolve）
- [ ] 中号 Widget：显示当前 station + style，tap 进 app 直达
- [ ] artwork 用当前 visualizer 帧快照（不要静态图）
- **验收**：CEO 自测每天打开 ≥ 5 次（之前 ~1 次）

### Week 2 — Lo-fi Signature Visualizer

- [ ] 走原 `docs/v1.4a-signature-visualizers-plan.md` M1-M5
- [ ] 分支 `feature/v1.4a-signature-lofi`（已存在）
- **验收**：首屏 Lo-fi station 视觉成型，press-ready 截图素材

### Week 3-4 — iPad 适配

- [ ] Universal app 验证（pbxproj target 是否 already universal）
- [ ] ContentView size-class 适配（竖屏 / 横屏 / Stage Manager）
- [ ] ImmersiveView + SpectrumCarousel 大屏 layout（不简单 scale）
- [ ] Visualizer 大屏渲染（粒子密度 / line thickness 跟尺寸走）
- [ ] OnboardingView iPad 排版
- [ ] iPad AppIcon 尺寸全套（76/152/167/1024）
- [ ] 4 种 iPad 模拟器实机测：mini / 11" / 13" / Pro 12.9"
- **验收**：iPad 真实截图（不再 letterbox），ASC iPad slot 重新上传

### Week 5 — 观测期

- **不加功能**，只 bug fix
- 收集：D1 / D7 / D14 install→active 比 · App Store review 文字 · CEO 自测时长
- **决策点**：D7 > 25% → Week 6 ship paywall；< 25% → 再加 1 个增长抓手

### Week 6 — Paywall（条件触发）

- [ ] 复活 `StoreKitManager.swift`（v1.3 已写骨架）
- [ ] Free 池：30min / 1h / 2h / day（🔴 CEO 拍）
- [ ] Tier 1：$2.99/mo unlimited（🔴 CEO 拍价格）
- [ ] Tier 2 暂不上（Studio 档等真用户再做）
- [ ] StoreKit 2 Introductory Offer：前 14 天 50% off

---

## 待 CEO 拍板（🔴）

1. **Week 0 Money 体检结果出来后** → Fork A vs Fork B 走向（如果月烧 > $200，整个计划重排）
2. **Week 6 paywall 价格 / free 池阈值**（30min / 1h / 2h × $2.99 / $4.99）
3. **Week 5 决策点 D7 阈值**（推荐 25%，可调 20-30%）

其余全 COO 自决。

---

## 不再做（明确砍掉）

- v1.4a Jazz / Rock / R&B / Electronic signature——除非 Lo-fi 上线后 review 明确要求
- v1.4b Studio 档功能（多风格混合 / 离线 / 导出 / Custom Visualizer）——0 付费用户 = 0 优先级
- 38 通用 visualizer 池清理——留着，等 v1.4b 真做再评估
- Mac 版（独立上架）——iPad 适配吃掉跨设备需求，Mac 等 v2.0
- CloudKit 同步——0 用户跨设备 = 0 优先级

---

## 执行原则

- 串行：上一周抓手 ship 前不开下一周
- 改完代码立刻 push（CEO 看 App Store / TestFlight）
- 每周一覆盖更新 `docs/team-status.md`
- Phase 切换走 `CLAUDE.md` Context 防爆 SOP

分工见 `AGENTS.md`。实时状态看 `docs/team-status.md`。
