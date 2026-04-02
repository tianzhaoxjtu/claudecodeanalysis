# 配置与扩展机制笔记

## 配置模型

### 已确认事实

- `src/utils/config.ts` 定义了 `ProjectConfig`、`GlobalConfig` 等核心配置结构。
- `src/utils/settings/settings.ts`：
  - 支持多 setting source
  - 支持 managed settings base file + drop-in 目录
  - 读取时带缓存
  - 解析时先过滤无效 permission rules，再做 schema 校验
- `src/utils/settings/types.ts` 使用 Zod 定义统一 `SettingsSchema`，并包含：
  - permissions
  - env
  - MCP allow/deny
  - marketplace
  - hooks
  - sandbox settings

## 配置来源

### 已确认事实

- 可见的 setting source 至少包括：
  - `policySettings`
  - `userSettings`
  - `projectSettings`
  - `localSettings`
  - `flagSettings`
- 权限规则的来源在 `permissions.ts` 与 `permissionsLoader.ts` 中单独建模。
- `permissionSetup.ts` 会将设置源、CLI 参数、session 临时修改统一压入 `ToolPermissionContext`。

## 运行时环境与 feature gate

### 已确认事实

- 多个核心模块大量依赖 `feature('...')`。
- 典型能力门控包括：
  - `KAIROS`
  - `PROACTIVE`
  - `COORDINATOR_MODE`
  - `VOICE_MODE`
  - `WORKFLOW_SCRIPTS`
  - `AGENT_TRIGGERS`
  - `MCP_SKILLS`
  - `TRANSCRIPT_CLASSIFIER`
  - `HISTORY_SNIP`

### 影响

- 同一份代码实际运行行为高度依赖打包/环境特征。
- 代码阅读必须区分：
  - 永远存在的路径
  - 编译时裁剪路径
  - 运行时门控路径

## 扩展机制

### 插件

- 以目录结构和 manifest 驱动。
- 加载器处理路径合法性、来源校验、版本缓存、依赖解析。

### MCP

- 同时支持 stdio、SSE、Streamable HTTP、WebSocket 等 transport。
- 既能暴露工具，也能暴露资源、prompts、auth 流程。

### 技能

- 本质是 markdown/frontmatter 驱动的 prompt command。
- 支持 hooks、模型、effort、用户可调用性等元信息。

## 合理推断

- 该系统把“配置”当作产品能力编排层的一部分，而不仅仅是静态参数源。
- 插件、MCP、技能三者分别对应“可分发单元”“外部协议能力”“轻量流程知识”。
