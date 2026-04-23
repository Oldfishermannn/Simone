# Simone Inc. 团队状态板

> 每个员工状态变化时**必须**覆盖更新自己那行（不 append）。
> 状态字段：🟢 IDLE（待命）/ 🟡 WORKING（在干活）/ 🔴 BLOCKED（卡住）/ ✅ DONE（刚交付）
> **Stale 规则**：更新时间超过 24h 自动视为过期，下次看到这一行的员工或 COO 必须主动刷新（要么真干活、要么改状态，不能装在线）。
> CEO 扫一眼：`cat docs/team-status.md`

| 角色 | 状态 | 当前任务 / 最新交付 | 更新时间 |
|---|---|---|---|
| COO 小克（主窗口） | ✅ DONE（v1.3.0 备料包完工，待 commit + Release Engineer 接手提审） | v1.3.0 上架备料一把梭完成。交付（iOS 仓 9 文件 dirty + 外仓 team-status + logo_candidates 未追踪，即将 commit）：①Info.plist 1.3.0/build 12 ②AppIcon 手绘磁带图（磁带居中 524 / visual offset +12） ③MusicStyle.swift 60 style 全重写（rock 去 blues 化、ambient 雨声 Prominent+minor-key、lofi/jazz/rnb/electronic 按 Lyria prompt 铁律重打磨） ④StyleCategory.swift allCases 改 [.lofi, .ambient, .rnb, .jazz, .rock, .electronic]（Lo-fi 回首屏） ⑤ImmersiveView DetailsView→home 同步 bug 修 ⑥push_metadata.py name/subtitle 加 ⑦**OnboardingView.swift 新建**（Radio Manual 风格：黑底 0.78 嵌套层 + 白字纯排版教 4 手势 + 2 角落按钮，tap 退出，@AppStorage("hasSeenOnboarding_v1_3") 控制首启） ⑧ContentView.swift 加 onboarding overlay + 两个 native sheet ⑨pbxproj 加 OnboardingView.swift 注册。verify-build ✅。CEO 拍板："ok就这样吧 准备上架app store"。**下一棒 Release Engineer**：提审走 push_metadata.py，只能在 CEO 明确说"提审" 再动手（🔴 对外发布决策）。 | 2026-04-23 |
| Strategist | ✅ DONE | Signature draft + plan 双交付：[`draft`](docs/v1.4a-signature-visualizers-draft.md)（5 频道全语法 3 配方）+ [`plan`](docs/v1.4a-signature-visualizers-plan.md)（CEO 拍板跳 Part 1/2 直上 Lo-fi 单频道单审 · M1-M5 里程碑 · 独立分支 `feature/v1.4a-signature-lofi` off main 不碰 v1.3 · 3-4 天完工 · COO 接手/clear 接力 prompt 已备）· 审过 Lo-fi 再按模板开 Jazz/Rock/R&B/Electronic | 2026-04-21 |
| PM | ✅ DONE | v1.3.0 App Store 截图方案 draft 交付：6 张 shot list（Hero Lo-fi · Onboarding 四手势 · 横滑切 5 站 · Evolve 三维度漂移 · Pause 缩图 · Settings 一屏）+ 每张 caption（≤8 词 lowercase 英文）+ 模拟器拍摄步骤 + 排序叙事弧 + caption 关键词池。等 CEO/UI Engineer 照拍。→ [`docs/v1.3-appstore-screenshots-plan.md`](v1.3-appstore-screenshots-plan.md) | 2026-04-23 |
| Release Engineer | 🟡 WORKING（等 CEO 说"提审"） | v1.3.0 build 13 已 upload ASC ✅（UUID bcb1a3ef-4f9d-48dc-b706-92935ef8de17，2.26MB）· preflight 自动 bump 12→13（LAST_BUILD state 污染根因，已记教训）· iOS 仓 commit `22268ef` Info.plist + push_metadata.py 12→13 同步 · 7 张截图归档 `appstore-screenshots/v1.3/`（Onboarding + Lo-fi 磁带 / Ambient 雨窗 / R&B 酒杯 / Jazz 留声机 / Rock 线 / Electronic 合成器，1320×2868 全部 iPhone 6.9" 标准尺寸）· Slow Blues 归 Rock 站 CEO 选 (a) 保留 · 下一步等 CEO "提审" → 跑 `push_metadata.py` 推 metadata + attach build 13 + submit，同时 CEO ASC web 上传 7 张截图 | 2026-04-23 |
| Assistant | ✅ DONE | memory 体检完：4 过期 / 2 冲突 / 6 缺失 / 3 合并建议 → docs/memory-audit-2026-04-19.md | 2026-04-19 17:05 |
| UI/UX Engineer | ✅ DONE | v1.2 UI/UX 诊断完：Fog/Morandi 分裂、字号过小、pause 自动缩图、手势嵌套、纵滑无 affordance — 等 CEO 定开刀顺序 | 2026-04-19 15:02 |
| iOS Engineer | 🟡 WORKING | v1.2.1 UI 包 #1/#2/#3 落地中（接 docs/v1.2.1-ui-tokens.md，同分支 feature/v1.2.1-evolve-depth，HEAD e237704 之后）— 上一活 PromptBuilder ✅ 已合（4 commits 247b157→e237704） | 2026-04-19 18:35 |

---

## 使用规约

**员工写**：状态一变就回来覆盖自己那行 + 更新时间。简短。
**CEO 看**：`cat /Users/oldfisherman/Desktop/simone/docs/team-status.md`
**COO 调度**：发现谁卡了 / 谁闲了 / 谁状态行超 24h 没动 → 主动刷新或重新分配活
