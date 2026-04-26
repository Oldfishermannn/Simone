# Simone 运作原则

> CEO 老鱼时间最贵。所有流程围绕一件事：**让 CEO 的待决策数量趋近于零**。

## 决策权限（0-决策原则）

### 🔴 必回 CEO（三类，其余全自决）

1. **不可逆的钱** — 订阅定价 / 绑定新云服务 / 购买付费 SDK / 合同支出
2. **对外发布** — App Store 提交 / TestFlight 外部邀请 / 社交媒体发帖
3. **产品定位** — 品牌名 / tagline / 核心人格 / 版本主题切换

### 🟢 COO 全权自决（事后报备）

技术栈、代码架构、第三方库、UI 微调、文案润色、动效、分支策略、commit 粒度、回滚、bug 排查、测试方案。

### ⚠️ 汇报方式

**不堆 A/B/C 给 CEO**——选好最优解 + 备一条 fallback，只在 🔴 三类升级。

## 日报机制（2026-04-26 简化）

`docs/daily/YYYY-MM-DD.md` — **只在有 🔴 决策时写**，无 🔴 当天跳过。

CEO 不需要"早上扫一份昨天没事发生的日报"——git log + team-status.md 自带历史。模板见 `docs/daily/TEMPLATE.md`。

## 可逆原则

所有操作可逆：git 粒度细 / 不破坏性删除 / feature flag / schema 双写一版。

但**可逆 ≠ 不清理**——working tree 可以瘦身，git history 留 tag 即可恢复。当前 `_archive/` 用于沉淀这类瘦身的代码。
