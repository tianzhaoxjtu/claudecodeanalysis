# 设计风险与复杂度热点笔记

## 已确认复杂度热点

### 1. `feature('...')` 造成的路径膨胀

- 几乎所有入口级文件都混入大量 feature gate。
- 影响：
  - 同一文件承担多个产品形态
  - 代码阅读需要频繁 mentally evaluate feature state
  - 行为测试矩阵扩大

### 2. `src/utils` 体量过大

- `utils` 超过 500 文件，承载配置、权限、日志、遥测、文件系统、git、MCP、prompt、teleport、sandbox 等横切逻辑。
- 风险：
  - 新逻辑容易继续向 `utils` 聚集
  - 领域边界模糊
  - 隐式依赖增多

### 3. 权限模型为多阶段叠加

- 规则
- hook
- classifier
- sandbox
- UI prompt
- session / source / mode 上下文

这提高了安全性，但也使行为解释和回归验证变复杂。

### 4. 代码可见形态带有编译/转换痕迹

- 如 `src/state/AppState.tsx`、`src/screens/REPL.tsx` 可见 `react/compiler-runtime` 注入与内嵌 sourcemap。
- 说明当前快照可能不是最原始 authoring source。
- 风险：
  - 架构分析仍然有效
  - 但风格、体量、可读性可能受构建转换影响

## 设计优势

- 启动阶段切分清晰，有明显的性能敏感设计。
- 查询执行、工具编排、API 适配三层区分较清楚。
- 插件 / MCP / 技能三套扩展机制各自职责明确。
- 配置与权限有 schema、来源建模与策略层，不是 ad-hoc if/else。

## 主要风险

- `commands.ts`、`tools.ts`、`REPL.tsx`、`main.tsx` 等文件承担过多装配职责。
- 高度依赖运行时上下文对象（如 `ToolUseContext`、`AppState`），使局部推理成本高。
- 后台任务、远程会话、MCP、agent、权限系统交织，局部修改容易产生非显式副作用。

## 需要在正式报告中特别强调的点

- “这是一套产品内核，不是简单 CLI”
- “其主要复杂度来自产品能力叠加，而不是单一算法”
- “安全/权限和扩展系统是最值得优先理解的架构支点”
