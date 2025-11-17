import { Menu, Moon, Sun, ChevronLeft, Home, Settings, LogOut, FileText, Server, Boxes, Smile, MessageSquare, Users, FileSearch } from 'lucide-react'
import { useState } from 'react'
import { Link, useMatchRoute, useNavigate } from '@tanstack/react-router'
import { useTheme, toggleThemeWithTransition } from './use-theme'
import { useAuthGuard } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ReactNode, ComponentType } from 'react'
import type { LucideProps } from 'lucide-react'

interface LayoutProps {
  children: ReactNode
}

interface MenuItem {
  icon: ComponentType<LucideProps>
  label: string
  path: string
}

interface MenuSection {
  title: string
  items: MenuItem[]
}

export function Layout({ children }: LayoutProps) {
  useAuthGuard() // 检查认证状态
  
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const matchRoute = useMatchRoute()
  const navigate = useNavigate()

  // 菜单项配置 - 分块结构
  const menuSections: MenuSection[] = [
    {
      title: '概览',
      items: [
        { icon: Home, label: '首页', path: '/' },
      ],
    },
    {
      title: '麦麦配置编辑',
      items: [
        { icon: FileText, label: '麦麦主程序配置', path: '/config/bot' },
        { icon: Server, label: '麦麦模型提供商配置', path: '/config/modelProvider' },
        { icon: Boxes, label: '麦麦模型配置', path: '/config/model' },
      ],
    },
    {
      title: '麦麦资源管理',
      items: [
        { icon: Smile, label: '表情包管理', path: '/resource/emoji' },
        { icon: MessageSquare, label: '表达方式管理', path: '/resource/expression' },
        { icon: Users, label: '人物关系管理', path: '/resource/relationship' },
      ],
    },
    {
      title: '运维与监控',
      items: [
        { icon: FileSearch, label: '日志查看器', path: '/logs' },
      ],
    },
    {
      title: '系统',
      items: [
        { icon: Settings, label: '系统设置', path: '/settings' },
      ],
    },
  ]

  // 获取实际应用的主题（处理 system 情况）
  const getActualTheme = () => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return theme
  }

  const actualTheme = getActualTheme()

  // 登出处理
  const handleLogout = () => {
    localStorage.removeItem('access-token')
    navigate({ to: '/auth' })
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-card transition-all duration-300 lg:relative lg:z-0',
          sidebarOpen ? 'w-64' : 'w-16',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo 区域 */}
        <div className="flex h-16 items-center border-b px-4">
          <div
            className={cn(
              'relative flex items-center justify-center flex-1 transition-all',
              !sidebarOpen && 'flex-none w-8'
            )}
          >
            {sidebarOpen ? (
              <div className="relative inline-block">
                <span className="font-bold text-2xl text-primary">MaiBot</span>
                <span className="absolute -top-1 -right-10 text-[10px] font-medium text-muted-foreground">
                  v1.0.0
                </span>
              </div>
            ) : (
              <span className="font-bold text-primary text-2xl">M</span>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden rounded-lg p-2 hover:bg-accent lg:block flex-shrink-0 ml-2"
          >
            <ChevronLeft
              className={cn('h-4 w-4 transition-transform', !sidebarOpen && 'rotate-180')}
            />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-6">
            {menuSections.map((section, sectionIndex) => (
              <li key={section.title}>
                {/* 块标题 - 侧边栏展开时显示 */}
                {sidebarOpen && (
                  <div className="mb-2 px-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                      {section.title}
                    </h3>
                  </div>
                )}

                {/* 分割线 - 侧边栏折叠时显示 */}
                {!sidebarOpen && sectionIndex > 0 && (
                  <div className="mb-4 border-t border-border" />
                )}

                {/* 菜单项列表 */}
                <ul className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = matchRoute({ to: item.path })
                    const Icon = item.icon

                    return (
                      <li key={item.path} className="relative">
                        <Link
                          to={item.path}
                          className={cn(
                            'relative flex items-center gap-3 rounded-lg px-3 py-2 transition-colors',
                            'hover:bg-accent hover:text-accent-foreground',
                            isActive
                              ? 'bg-accent text-foreground'
                              : 'text-muted-foreground hover:text-foreground',
                            !sidebarOpen && 'justify-center px-0'
                          )}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {/* 左侧高亮条 */}
                          {isActive && (
                            <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
                          )}
                          <Icon
                            className={cn(
                              'h-5 w-5 flex-shrink-0',
                              !sidebarOpen && 'mx-auto',
                              isActive && 'text-primary'
                            )}
                            strokeWidth={2}
                            fill="none"
                          />
                          {sidebarOpen && (
                            <span className={cn('text-sm font-medium', isActive && 'font-semibold')}>
                              {item.label}
                            </span>
                          )}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-16 items-center justify-between border-b bg-card px-4">
          <div className="flex items-center gap-4">
            {/* 移动端菜单按钮 */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 hover:bg-accent lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* 主题切换按钮 */}
            <button
              onClick={(e) => {
                const newTheme = actualTheme === 'dark' ? 'light' : 'dark'
                toggleThemeWithTransition(newTheme, setTheme, e)
              }}
              className="rounded-lg p-2 hover:bg-accent"
              title={actualTheme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
            >
              {actualTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* 分隔线 */}
            <div className="h-6 w-px bg-border" />

            {/* 登出按钮 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="gap-2"
              title="登出系统"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">登出</span>
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-background p-6">{children}</main>
      </div>
    </div>
  )
}
