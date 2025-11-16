# MaiBot Dashboard

> MaiBot 的现代化 Web 管理面板 - 基于 React 19 + TypeScript + Vite 构建

<div align="center">

[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

</div>

## 📖 项目简介

MaiBot Dashboard 是 MaiBot 聊天机器人的 Web 管理界面，提供了直观的配置管理、系统设置和模型管理功能。通过自动解析后端配置类，动态生成表单，实现了配置的可视化编辑。

### ✨ 核心特性

- 🎨 **现代化 UI** - 基于 shadcn/ui 组件库，支持亮色/暗色主题切换
- ⚡ **高性能** - 使用 Vite 7.2 构建，React 19 最新特性
- 🔐 **安全认证** - Token 认证机制，支持自定义和自动生成 Token
- 📝 **智能配置** - 自动解析 Python dataclass，生成配置表单
- 🎯 **类型安全** - 完整的 TypeScript 类型定义
- 🔄 **实时更新** - 配置修改实时保存到 TOML 文件
- 📱 **响应式设计** - 适配桌面和移动设备

## 🏗️ 技术架构

### 前端技术栈

```
React 19.2.0          # UI 框架
├── TypeScript 5.9    # 类型系统
├── Vite 7.2          # 构建工具
├── TanStack Router   # 路由管理
├── Jotai             # 状态管理
├── Tailwind CSS 3.4  # 样式框架
└── shadcn/ui         # 组件库
    ├── Radix UI      # 无障碍组件
    └── lucide-react  # 图标库
```

### 后端集成

```
FastAPI               # Python 后端框架
├── config_schema.py  # 配置架构生成器
├── config_routes.py  # 配置管理 API
└── tomlkit           # TOML 文件处理
```

## 📁 项目结构

```
MaiBot-Dashboard/
├── src/
│   ├── components/          # 组件目录
│   │   ├── ui/             # shadcn/ui 组件
│   │   ├── layout.tsx      # 布局组件（侧边栏+导航）
│   │   ├── use-theme.tsx   # 主题管理
│   │   └── ...
│   ├── routes/             # 路由页面
│   │   ├── index.tsx       # 首页
│   │   ├── auth.tsx        # 登录页
│   │   ├── settings.tsx    # 系统设置
│   │   └── config/         # 配置管理页面
│   │       ├── bot.tsx         # 麦麦主程序配置
│   │       ├── modelProvider.tsx  # 模型提供商配置
│   │       └── model.tsx       # 模型配置
│   ├── lib/                # 工具库
│   │   ├── config-api.ts   # 配置 API 客户端
│   │   ├── api.ts          # 通用 API 工具
│   │   ├── utils.ts        # 通用工具函数
│   │   └── token-validator.ts  # Token 验证
│   ├── types/              # 类型定义
│   │   └── config-schema.ts    # 配置架构类型
│   ├── hooks/              # React Hooks
│   │   ├── use-auth.ts     # 认证逻辑
│   │   ├── use-animation.ts    # 动画控制
│   │   └── use-toast.ts    # 消息提示
│   ├── store/              # 全局状态
│   │   └── auth.ts         # 认证状态
│   ├── router.tsx          # 路由配置
│   ├── main.tsx            # 应用入口
│   └── index.css           # 全局样式
├── public/                 # 静态资源
├── vite.config.ts          # Vite 配置
├── tailwind.config.js      # Tailwind 配置
├── tsconfig.json           # TypeScript 配置
└── package.json            # 依赖管理
```

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- Bun >= 1.0.0 (推荐) 或 npm/yarn/pnpm

### 安装依赖

```bash
# 使用 Bun（推荐）
bun install

# 或使用 npm
npm install
```

### 开发模式

```bash
# 启动开发服务器 (默认端口: 7999)
bun run dev

# 或
npm run dev
```

访问 http://localhost:7999 查看应用。

### 生产构建

```bash
# 构建生产版本
bun run build

# 预览生产构建
bun run preview
```

### 代码格式化

```bash
# 格式化代码
bun run format
```

## 🎯 核心功能


#### 前端动态渲染

根据架构自动生成表单控件，无需手写表单代码：

```typescript
// 获取配置架构
const schema = await getBotConfigSchema()

// 根据 schema.fields 自动渲染对应组件
schema.fields.map(field => {
  switch(field.type) {
    case 'boolean': return <Switch />
    case 'select': return <Select options={field.options} />
    case 'string': return <Input />
    // ...
  }
})
```
### 3. UI 组件系统

基于 shadcn/ui 构建的组件库：

- **表单组件**: Input, Select, Switch, Textarea
- **数据展示**: Table, Tabs, Dialog, Alert
- **交互组件**: Button, Toast, AlertDialog
- **布局组件**: Layout, Separator

所有组件支持：
- 亮色/暗色主题
- 完整的无障碍支持
- TypeScript 类型安全



## 📦 依赖说明

### 核心依赖

| 包名 | 版本 | 用途 |
|------|------|------|
| react | ^19.2.0 | UI 框架 |
| react-dom | ^19.2.0 | React DOM 渲染 |
| typescript | ~5.9.3 | 类型系统 |
| vite | ^7.2.2 | 构建工具 |
| @tanstack/react-router | ^1.136.1 | 路由管理 |
| jotai | ^2.15.1 | 状态管理 |
| axios | ^1.13.2 | HTTP 客户端 |

### UI 组件库

| 包名 | 版本 | 用途 |
|------|------|------|
| @radix-ui/react-* | ^1.x | 无障碍组件基础 |
| lucide-react | ^0.553.0 | 图标库 |
| tailwindcss | ^3.4 | CSS 框架 |
| class-variance-authority | ^0.7.1 | 类名管理 |
| tailwind-merge | ^3.4.0 | Tailwind 类合并 |


## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 代码规范

- 使用 TypeScript 严格模式
- 遵循 ESLint 规则
- 使用 Prettier 格式化代码
- 组件使用函数式编写
- 优先使用 Hooks

## 📄 开源协议

本项目基于 GPLv3 协议开源，详见 [LICENSE](./LICENSE) 文件。

## 👥 作者

**MotricSeven** - [GitHub](https://github.com/DrSmoothl)

## 🙏 致谢

- [React](https://react.dev/) - UI 框架
- [shadcn/ui](https://ui.shadcn.com/) - 组件库
- [Radix UI](https://www.radix-ui.com/) - 无障碍组件
- [TanStack Router](https://tanstack.com/router) - 路由解决方案
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架

---

<div align="center">
Made with ❤️ by MotricSeven and Mai-with-u
</div>
