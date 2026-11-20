# 分寸江湖 · 战斗核心

从《分寸江湖》提取的 JavaScript 回合制战斗逻辑。适合参考战斗状态写入、回合推进、技能选目标和状态效果处理。示例使用虚构单位，在终端输出战斗事件和结果。

需要 Node.js 22 或更新版本。项目没有运行时依赖。

```sh
npm run demo
npm test
```

从 `src/index.js` 导入所需模块。回合管理器通过参数接收状态、状态写入器和事件回调。调用方负责提供项目自己的战斗规则和界面。

| 模块 | 用途 |
| --- | --- |
| `createTurnManager` | 回合切换、队列、胜负和结算事件 |
| `createBattleStateSink` | 写入战斗状态，可接入调用方的状态管理 |
| `selectSkillTargets` | 按阵营、位置和单位状态筛选技能目标 |
| `applyBuffToUnit`、`tickBuffsOnUnit` | 应用状态效果并推进持续时间 |
| `stepSettlementProgress` | 根据经过时间计算结算进度 |
| `createSeededRng` | 可复现的随机结果，供示例和测试使用 |

此仓库包含选定的战斗模块、终端示例和测试。许可证为 [MIT](LICENSE)。
