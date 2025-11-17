import { createRootRoute, createRoute, createRouter, Outlet, redirect } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { IndexPage } from './routes/index'
import { SettingsPage } from './routes/settings'
import { AuthPage } from './routes/auth'
import { NotFoundPage } from './routes/404'
import { BotConfigPage } from './routes/config/bot'
import { ModelProviderConfigPage } from './routes/config/modelProvider'
import { ModelConfigPage } from './routes/config/model'
import { EmojiManagementPage } from './routes/resource/emoji'
import { ExpressionManagementPage } from './routes/resource/expression'
import { RelationshipManagementPage } from './routes/resource/relationship'
import { LogViewerPage } from './routes/logs'
import { Layout } from './components/layout'
import { checkAuth } from './hooks/use-auth'

// Root 路由
const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
  beforeLoad: () => {
    // 如果访问根路径且未认证，重定向到认证页面
    if (window.location.pathname === '/' && !checkAuth()) {
      throw redirect({ to: '/auth' })
    }
  },
})

// 认证路由（无 Layout）
const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth',
  component: AuthPage,
})

// 受保护的路由 Root（带 Layout）
const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'protected',
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
})

// 首页路由
const indexRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/',
  component: IndexPage,
})

// 配置路由 - 麦麦主程序配置
const botConfigRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/config/bot',
  component: BotConfigPage,
})

// 配置路由 - 麦麦模型提供商配置
const modelProviderConfigRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/config/modelProvider',
  component: ModelProviderConfigPage,
})

// 配置路由 - 麦麦模型配置
const modelConfigRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/config/model',
  component: ModelConfigPage,
})

// 资源管理路由 - 表情包管理
const emojiManagementRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/resource/emoji',
  component: EmojiManagementPage,
})

// 资源管理路由 - 表达方式管理
const expressionManagementRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/resource/expression',
  component: ExpressionManagementPage,
})

// 资源管理路由 - 人物关系管理
const relationshipManagementRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/resource/relationship',
  component: RelationshipManagementPage,
})

// 日志查看器路由
const logsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/logs',
  component: LogViewerPage,
})

// 设置页路由
const settingsRoute = createRoute({
  getParentRoute: () => protectedRoute,
  path: '/settings',
  component: SettingsPage,
})

// 404 路由
const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '*',
  component: NotFoundPage,
})

// 路由树
const routeTree = rootRoute.addChildren([
  authRoute,
  protectedRoute.addChildren([
    indexRoute,
    botConfigRoute,
    modelProviderConfigRoute,
    modelConfigRoute,
    emojiManagementRoute,
    expressionManagementRoute,
    relationshipManagementRoute,
    logsRoute,
    settingsRoute,
  ]),
  notFoundRoute,
])

// 创建路由器
export const router = createRouter({ 
  routeTree,
  defaultNotFoundComponent: NotFoundPage,
})

// 类型声明
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
