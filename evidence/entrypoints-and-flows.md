# 入口点与关键流证据笔记

## 1. 启动主线

### 已确认事实

- `src/main.tsx` 是主入口：
  - 顶层执行 `profileCheckpoint(...)`
  - 预启动 MDM 读取与 keychain 预取
  - 引入 `init`、`getCommands`、`getTools`、`launchRepl` 等核心能力
- `src/setup.ts` 负责运行前环境准备：
  - Node 版本检查
  - UDS messaging
  - teammate snapshot
  - Terminal/iTerm 恢复
  - `setCwd`
  - hook 快照
  - worktree / tmux 会话准备
- `src/entrypoints/init.ts` 负责全局初始化：
  - `enableConfigs`
  - `applySafeConfigEnvironmentVariables`
  - CA 证书
  - telemetry / OAuth / JetBrains / repository 检测
  - remote managed settings / policy limits 预加载
  - proxy / mTLS / preconnect / upstream proxy
  - scratchpad 初始化

### 结论

系统启动被拆成三段：

1. `main.tsx` 作为进程入口和高层编排
2. `setup.ts` 作为会话/终端/工作目录级准备
3. `entrypoints/init.ts` 作为全局配置与基础设施初始化

这是一种明显的“冷启动成本分摊”设计。

## 2. 命令装配链路

### 已确认事实

- `src/commands.ts` 中：
  - `COMMANDS()` 汇总内建命令
  - `getSkills(cwd)` 汇总 skills、plugin skills、bundled skills
  - `loadAllCommands(cwd)` 合并 skills、plugins、workflows 与 built-ins
  - `getCommands(cwd)` 再按 availability 与 `isEnabled()` 过滤
  - 支持 dynamic skills 插入

### 结论

命令装配不是静态数组，而是“基础命令 + 外挂命令 + 动态发现命令”的多源合并模型。

## 3. 查询执行链路

### 已确认事实

- `src/QueryEngine.ts` 的 `submitMessage()`：
  - 组装上下文与工具
  - 设置 cwd
  - 处理 session 持久化、消息与缓存
  - 调用 `query(...)`
- `src/query.ts`：
  - 负责 turn 循环、tool use、compact、token budget、error recovery
- `src/services/api/claude.ts`：
  - 负责 API 参数归一化、模型/headers/betas/usage/streaming 适配

### 结论

`QueryEngine` 是会话级 façade，`query.ts` 是 turn 级编排器，`claude.ts` 是 API 边界适配器。

## 4. 工具调用链路

### 已确认事实

- `src/query.ts` 使用：
  - `StreamingToolExecutor`
  - `runTools`
  - `applyToolResultBudget`
- `src/services/tools/toolOrchestration.ts`：
  - 对 tool blocks 分组
  - 并发安全工具并行
  - 非并发工具串行
- `src/services/tools/toolExecution.ts`：
  - 查找工具定义
  - 做权限判定
  - 执行 hooks
  - 记录 telemetry
  - 规范化 tool result
- `src/services/tools/StreamingToolExecutor.ts`：
  - 在流式场景下边收边执行
  - 处理 sibling abort、fallback discard、progress yield、exclusive vs concurrent 执行

### 结论

系统同时存在两套工具执行视角：

- 完整 turn 后的批处理编排
- 流式响应中的增量编排

这说明其设计目标包含“尽早启动工具”和“降低长链路等待时间”。

## 5. 权限审批链路

### 已确认事实

- `src/utils/permissions/permissions.ts`：
  - 表达 allow/deny/ask 规则
  - 解释 decision reason
  - 区分 rule/hook/classifier/mode/sandbox 等来源
- `src/utils/permissions/permissionsLoader.ts`：
  - 从多个 setting source 装载规则
  - 支持 managed-only 模式
- `src/utils/permissions/permissionSetup.ts`：
  - 将设置源规则应用到上下文
  - 处理 default mode、additional directories、auto/plan mode 安全限制
- `src/components/permissions/*`：
  - 提供不同审批场景的 UI

### 结论

权限系统不是单一弹窗，而是“静态规则 + 运行时分类器 + hook + sandbox + UI”组成的多阶段判定体系。

## 6. 插件 / MCP / 技能装配链路

### 已确认事实

- `src/utils/plugins/pluginLoader.ts`：
  - 支持 marketplace、session-only plugin、seed cache、zip cache、manifest 校验
- `src/services/mcp/config.ts`：
  - 合并多来源 MCP 配置
  - 计算 signature 做去重
  - 支持写 `.mcp.json`
- `src/services/mcp/client.ts`：
  - 管理 MCP client transport、auth、tool/resource/prompt discovery
- `src/skills/loadSkillsDir.ts`：
  - 从多个 source 加载 markdown-based skills
  - 解析 frontmatter、hooks、paths、model、effort 等元信息

### 结论

扩展机制并非单一插件点，而是三条平行扩展通路：

1. 插件：偏“分发与封装”
2. MCP：偏“外部能力接入”
3. Skills：偏“提示与流程复用”
