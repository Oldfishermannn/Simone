# Simone Inc. 团队状态板

> 每个员工状态变化时**必须**覆盖更新自己那行（不 append）。
> 状态字段：🟢 IDLE（待命）/ 🟡 WORKING（在干活）/ 🔴 BLOCKED（卡住）/ ✅ DONE（刚交付）
> **Stale 规则**：更新时间超过 24h 自动视为过期，下次看到这一行的员工或 COO 必须主动刷新（要么真干活、要么改状态，不能装在线）。
> CEO 扫一眼：`cat docs/team-status.md`

| 角色 | 状态 | 当前任务 / 最新交付 | 更新时间 |
|---|---|---|---|
| COO 小克（主窗口） | ✅ DONE（等 CEO Cmd+R） | v1.4a Signature **UI 大整理 + P0 audio bugs**（CEO 8 项一锅端）：①Signature/Classic toggle 全删 — VisualizationMode 锁 .signature，AppState 不再 restore mode key · ②横滑 bug Classic 闪现修了 — crossfadeLegacy 删干净，TabView 接管 · ③横滑改 **TabView .page(indexDisplayMode: .never)** 跟手 native iOS paging · ④Settings 学 DetailsView 极简：FogTokens.bgDeep 黑底 + 3 行 hairline (Auto Tune / Evolve / Sleep) + footer Privacy + 版本号，删 Spectrum/DEBUG/Art toggle/colophon 全部 · ⑤启动默认 style 用 `orderedStyles(for: currentChannel).first` 不再硬编码 lofi-chill · ⑥点 visualizer = togglePlayPause（小图点 = 放 / 大图点 = 停），isSmall 由 isPlaying 推导，play 按钮也同步切大小 · ⑦切频道/style auto-play bug — `flushScheduledBuffers` 里 `playerNode?.play()` 加 isPlaying guard · ⑧🔥**AVAudioSession 中断 bug**（CEO 痛点：暂停状态下看视频，视频暂停后 Simone 自动续播）— interruption.ended 加 `guard shouldResume, self.isPlaying`，尊重用户暂停意图 · ImmersiveView 480 → 193 行（crossfadeLegacy + 重复 visualizer dispatch 全清）· verify-build ✅ · 已 push origin/feature/v1.3+signature-lofi (3bce6e2) | 2026-04-22 |
| Strategist | ✅ DONE | Signature draft + plan 双交付：[`draft`](docs/v1.4a-signature-visualizers-draft.md)（5 频道全语法 3 配方）+ [`plan`](docs/v1.4a-signature-visualizers-plan.md)（CEO 拍板跳 Part 1/2 直上 Lo-fi 单频道单审 · M1-M5 里程碑 · 独立分支 `feature/v1.4a-signature-lofi` off main 不碰 v1.3 · 3-4 天完工 · COO 接手/clear 接力 prompt 已备）· 审过 Lo-fi 再按模板开 Jazz/Rock/R&B/Electronic | 2026-04-21 |
| PM | 🟡 WORKING（待上岗） | 本轮：v1.3 商业化文案预启动 → docs/v1.3-appstore-copy-draft.md | 2026-04-19 16:58 |
| Release Engineer | ✅ DONE | v1.2.1 build 11 submit to App Store 完成（COO 直操 push_metadata.py）· 撤 v1.2 pending · version record rename 1.2→1.2.1 · WAITING_FOR_REVIEW | 2026-04-19 23:08 |
| Assistant | ✅ DONE | memory 体检完：4 过期 / 2 冲突 / 6 缺失 / 3 合并建议 → docs/memory-audit-2026-04-19.md | 2026-04-19 17:05 |
| UI/UX Engineer | ✅ DONE | v1.2 UI/UX 诊断完：Fog/Morandi 分裂、字号过小、pause 自动缩图、手势嵌套、纵滑无 affordance — 等 CEO 定开刀顺序 | 2026-04-19 15:02 |
| iOS Engineer | 🟡 WORKING | v1.2.1 UI 包 #1/#2/#3 落地中（接 docs/v1.2.1-ui-tokens.md，同分支 feature/v1.2.1-evolve-depth，HEAD e237704 之后）— 上一活 PromptBuilder ✅ 已合（4 commits 247b157→e237704） | 2026-04-19 18:35 |

---

## 使用规约

**员工写**：状态一变就回来覆盖自己那行 + 更新时间。简短。
**CEO 看**：`cat /Users/oldfisherman/Desktop/simone/docs/team-status.md`
**COO 调度**：发现谁卡了 / 谁闲了 / 谁状态行超 24h 没动 → 主动刷新或重新分配活
