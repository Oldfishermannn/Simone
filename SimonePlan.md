# Simone 路线图

> 规划中看这里。已 ship 看 `git log`。

---

## TL;DR

- **当前状态**：v1.3.0 build 14 🔴 提审 2026-04-23（submission `48493a99`）等 Apple
- **下一锚点**：v1.3.0 审核通过后起 v1.4a signature visualizers 主线
- **发版节奏**：串行，上一版 ship 前不开下一版
- **战略顺序**：先稳 → 再变 → 再美 → 再签名 → 再赚 → 再连

---

## 版本状态

| 版本 | 主题 | 状态 |
|---|---|---|
| v1.0 – v1.2 | 上架 + 稳定 + 交互 + Fog City 视觉 | ✅ shipped |
| v1.2.1 | Evolve PromptBuilder 三维度 | ✅ shipped |
| **v1.3.0** | **60 style rewrite + OnboardingView + AppIcon + Lo-fi 回首屏** | 🔴 **WAITING_FOR_REVIEW** |
| **v1.4a** | **Signature Visualizers**（分频道签名视觉） | 📋 Lo-fi 分支进行中 `feature/v1.4a-signature-lofi` |
| v1.4b | Studio 档兑现 | 📋 规划中 |
| v1.4c | iOS 系统集成（锁屏 / 灵动岛 / Widget） | 📋 规划中 |

---

## 当前 phase: v1.4a Signature Visualizers

**详见** `docs/v1.4a-signature-visualizers-plan.md`

- CEO 拍板：跳 Part 1/2，直上 Lo-fi 单频道单审
- 独立分支 `feature/v1.4a-signature-lofi` off main，不碰 v1.3
- M1-M5 里程碑，3-4 天完工
- 审过 Lo-fi 再按模板开 Jazz / Rock / R&B / Electronic

---

## 执行原则

- 每个 Phase 开工前 brainstorm，plan 落到 `docs/<version>-plan.md`
- Phase 间串行，不混合
- 改完代码立刻 push（老鱼看 TestFlight / App Store）
- 角色 / Phase 切换走 `CLAUDE.md` 的 Context 防爆 SOP

分工见 `AGENTS.md`。实时状态看 `docs/team-status.md`。
