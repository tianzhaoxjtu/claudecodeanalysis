# 模块地图证据笔记

## 已确认事实

- 当前可见目录几乎全部集中在 `src/` 下，属于大型单仓源码树快照。
- 目录统计显示高密度区域为：
  - `src/utils`：564 个文件
  - `src/components`：389 个文件
  - `src/commands`：207 个文件
  - `src/tools`：184 个文件
  - `src/services`：130 个文件
  - `src/hooks`：104 个文件
  - `src/ink`：96 个文件
- 从 `src/main.tsx`、`src/setup.ts`、`src/entrypoints/init.ts` 可以确认系统不是单纯脚本集合，而是完整的 CLI/TUI 应用。
- 从 `src/commands.ts` 可以确认其具备较重的命令层；从 `src/tools.ts` 可以确认其具备模型可调用工具层；两者是平行但协同的接口体系。
- 从 `src/state/AppStateStore.ts`、`src/state/AppState.tsx`、`src/screens/REPL.tsx` 可以确认存在 React/Ink 驱动的终端 UI。
- 从 `src/services/mcp/*`、`src/utils/plugins/*`、`src/skills/*` 可以确认存在三套扩展机制：
  - MCP 服务器
  - 插件
  - 技能/提示型命令

## 建议的架构分层

### 1. 入口与生命周期层

- `src/main.tsx`
- `src/setup.ts`
- `src/entrypoints/init.ts`

负责进程级初始化、环境准备、配置与远程/桥接/会话初始化。

### 2. 交互接口层

- `src/commands.ts`
- `src/commands/*`
- `src/screens/REPL.tsx`
- `src/components/*`

负责 slash command、REPL、权限弹窗、任务面板、消息展示。

### 3. 查询与编排层

- `src/QueryEngine.ts`
- `src/query.ts`
- `src/services/api/claude.ts`
- `src/services/tools/*`

负责主模型调用、turn 循环、工具调用、流式控制、错误恢复。

### 4. 执行与任务层

- `src/Task.ts`
- `src/tasks/*`
- `src/tools/AgentTool/*`

负责本地 shell、子 agent、远程 agent、后台任务、任务状态生命周期。

### 5. 权限与安全层

- `src/utils/permissions/*`
- `src/components/permissions/*`
- `src/utils/sandbox/*`

负责规则解析、审批、hook/classifier/sandbox 协同。

### 6. 扩展与集成层

- `src/services/mcp/*`
- `src/utils/plugins/*`
- `src/skills/*`

负责外部服务、插件、技能、资源、命令与工具的动态装配。

### 7. 横切基础设施层

- `src/utils/*`
- `src/services/analytics/*`
- `src/migrations/*`
- `src/bootstrap/*`

负责日志、性能、配置、缓存、迁移、统计、会话元数据。

## 合理推断

- 这是一种“终端智能体应用内核 + 大量受特性开关控制的产品能力”的架构。
- `src/utils` 体量异常大，说明很多横切逻辑没有被沉淀为更清晰的领域子包，后续维护将依赖工程师对隐式约定的熟悉度。
- 组件、命令、工具、状态之间的跨层引用较多，说明分层是“逻辑上的”，而不是严格的物理隔离。

## 未确认项

- 当前快照无法确认是否还存在 `packages/`、`scripts/`、`tests/`、`docs/` 等未提供目录。
- 无法确认是否存在 monorepo 根级构建/发布协调层。
