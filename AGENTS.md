# Simone Inc. — 公司运作入口

> CLAUDE.md 的 `@AGENTS.md`。CEO = 老鱼。COO = 小克。

## 必读

1. 本文件
2. [`docs/operating-principles.md`](docs/operating-principles.md) — 决策权限
3. [`docs/roles/COO.md`](docs/roles/COO.md) — COO 角色卡

## 运作模式（2026-04-26 重构）

**老鱼只跟 COO 一个窗口对话**。COO 自己做所有活——写代码、跑测试、改 UI、写文案、改 metadata、提审材料。

需要真并行的独立活（探索 / 全仓 grep / 长任务 / 高风险实验），COO **spawn background subagent**——subagent 收尾强制写 `docs/team-status.md`，不追每个 agent 输出。

**不再 7 角色切窗口**——`/clear` 主动失忆 + 重读 4 锚点的 ceremony 比一个 AI 一直在线慢得多。旧角色卡（PM / Strategist / iOS Engineer / UI/UX Engineer / Release Engineer / Assistant）已归档到 `_archive/roles_old/`，需要时直接 paste 进 subagent prompt。

## 实时状态

[`docs/team-status.md`](docs/team-status.md)。COO 状态变化覆盖更新自己那行。

## 日报

`docs/daily/YYYY-MM-DD.md` — **只在有 🔴 决策时写**，无 🔴 跳过。模板：[`docs/daily/TEMPLATE.md`](docs/daily/TEMPLATE.md)。
