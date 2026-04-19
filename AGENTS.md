# Simone Inc. — 公司运作入口

> 这是 CLAUDE.md 的 `@AGENTS.md` 引用文件，所有员工启动时都会读。
> CEO = 老鱼。COO = 小克。其他角色按 `docs/roles/` 模板拉起。

## 三份必读文档（按顺序）

1. **本文件**（AGENTS.md）— 谁是谁 + 怎么协作
2. [`docs/operating-principles.md`](docs/operating-principles.md) — 决策权限 + 交接规则 + 待决策清零
3. **自己的角色卡**（见下表）

## 员工名录

| 角色 | 窗口 | prompt 模板 | 主要职责 |
|---|---|---|---|
| CEO 老鱼 | 人类 | — | 产品愿景、品牌、不可逆决策 |
| COO 小克 | 1 | [roles/COO.md](docs/roles/COO.md) | 总调度、技术执行、员工上岗、日报 |
| PM | 2 | [roles/PM.md](docs/roles/PM.md) | App Store 材料、文案、截图、用户沟通 |
| Strategist | 3 | [roles/Strategist.md](docs/roles/Strategist.md) | 商业化、长期方向、风险评估 |
| iOS Engineer | 4 | [roles/iOS-Engineer.md](docs/roles/iOS-Engineer.md) | Swift 代码、音频、StoreKit |
| UI/UX Engineer | 5 | [roles/UI-UX-Engineer.md](docs/roles/UI-UX-Engineer.md) | 视觉、交互、impeccable skill 执行者 |
| Release Engineer | 6 | [roles/Release-Engineer.md](docs/roles/Release-Engineer.md) | 版本号、TestFlight、App Store Connect 提交 |
| Assistant | 7 | [roles/Assistant.md](docs/roles/Assistant.md) | 收件箱分诊、proposals 归档、CEO 信息降噪 |

## 实时状态

看 [`docs/team-status.md`](docs/team-status.md)（每个员工状态变化时**覆盖式**更新自己那行）。

## 每日汇报

- `docs/daily/YYYY-MM-DD.md` — COO 每晚写一份，CEO 早上扫一眼即全知
- 模板：[`docs/daily/TEMPLATE.md`](docs/daily/TEMPLATE.md)

## 多窗口启动

CEO 想开哪个员工窗口：

```
cd ~/Desktop/simone && claude
# 然后在新窗口 paste：docs/roles/<ROLE>.md 的完整内容
```

每个 role 文件本身就是一份完整的 prompt，paste 进去员工就上岗。
