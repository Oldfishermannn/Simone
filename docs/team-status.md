# Simone Inc. 团队状态板

> 每个员工状态变化时**必须**更新自己那行（覆盖式，不 append）。
> CEO 用 `watch -n 5 cat docs/team-status.md` 看整个公司在干啥。
> 状态字段：🟢 IDLE（待命）/ 🟡 WORKING（在干活）/ 🔴 BLOCKED（卡住）/ ✅ DONE（刚交付）

| 窗口 | 角色 | 状态 | 当前任务 / 最新交付 | 更新时间 |
|---|---|---|---|---|
| 1 | COO 小克 | ✅ DONE | v1.2.1 build 11 已提交 App Store 审核（撤 v1.2 pending + rename version + push metadata + attach + submit）· submission `b76bd517` WAITING_FOR_REVIEW · SimonePlan P0-P4 ✅ | 2026-04-19 23:08 |
| 2 | PM | 🟡 WORKING（待上岗） | 本轮：v1.3 商业化文案预启动 → docs/v1.3-appstore-copy-draft.md | 2026-04-19 16:58 |
| 3 | Strategist | ✅ DONE | A.4 单位经济学交付：docs/v1.3-unit-economics.md（Lyria 三档 pricing 假设 + BYOK 分流 + 盈亏平衡 + "每日 120min 软上限" 硬约束） | 2026-04-19 17:50 |
| 4 | Release Engineer | ✅ DONE | v1.2.1 build 11 submit to App Store 完成（COO 直操 push_metadata.py）· 撤 v1.2 pending · version record rename 1.2→1.2.1 · WAITING_FOR_REVIEW | 2026-04-19 23:08 |
| 5 | Assistant | ✅ DONE | memory 体检完：4 过期 / 2 冲突 / 6 缺失 / 3 合并建议 → docs/memory-audit-2026-04-19.md | 2026-04-19 17:05 |
| 6 | UI/UX Engineer | ✅ DONE | v1.2 UI/UX 诊断完：Fog/Morandi 分裂、字号过小、pause 自动缩图、手势嵌套、纵滑无 affordance — 等 CEO 定开刀顺序 | 2026-04-19 15:02 |
| 4 | iOS Engineer | 🟡 WORKING | v1.2.1 UI 包 #1/#2/#3 落地中（接 docs/v1.2.1-ui-tokens.md，同分支 feature/v1.2.1-evolve-depth，HEAD e237704 之后）— 上一活 PromptBuilder ✅ 已合（4 commits 247b157→e237704） | 2026-04-19 18:35 |

---

## 使用规约

**员工写**：状态一变就回来覆盖自己那行 + 更新时间。简短。
**CEO 看**：另开一个 Terminal 跑 `watch -n 5 cat /Users/oldfisherman/Desktop/simone/docs/team-status.md`
**COO 调度**：发现谁卡了 / 谁闲了 → 主动重新分配活
