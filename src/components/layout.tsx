import { Menu, Moon, Sun, ChevronLeft, Home, Settings, LogOut, FileText, Server, Boxes, Smile, MessageSquare, UserCircle, FileSearch, BarChart3, Package } from 'lucide-react'
import { useState } from 'react'
import { Link, useMatchRoute, useNavigate } from '@tanstack/react-router'
import { useTheme, toggleThemeWithTransition } from './use-theme'
import { useAuthGuard } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { formatVersion } from '@/lib/version'
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
        { icon: UserCircle, label: '人物信息管理', path: '/resource/person' },
      ],
    },
    {
      title: '扩展与监控',
      items: [
        { icon: BarChart3, label: '统计信息', path: '/statistics' },
        { icon: Package, label: '插件市场', path: '/plugins' },
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
    <TooltipProvider delayDuration={300}>
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-card transition-all duration-300 lg:relative lg:z-0',
          // 移动端始终显示完整宽度，桌面端根据 sidebarOpen 切换
          'w-64 lg:w-auto',
          sidebarOpen ? 'lg:w-64' : 'lg:w-16',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo 区域 */}
        <div className="flex h-16 items-center border-b px-4">
          <div
            className={cn(
              'relative flex items-center justify-center flex-1 transition-all overflow-hidden',
              // 移动端始终完整显示,桌面端根据 sidebarOpen 切换
              'lg:flex-1',
              !sidebarOpen && 'lg:flex-none lg:w-8'
            )}
          >
            {/* 移动端始终显示完整 Logo，桌面端根据 sidebarOpen 切换 */}
            <div className={cn(
              "relative inline-block",
              !sidebarOpen && "lg:hidden"
            )}>
              <span className="font-bold text-2xl text-primary whitespace-nowrap">MaiBot</span>
              <span className="absolute -top-1 -right-10 text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                {formatVersion()}
              </span>
            </div>
            {/* 折叠时的 Logo - 仅桌面端显示 */}
            {!sidebarOpen && (
              <span className="hidden lg:block font-bold text-primary text-2xl">M</span>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          <ul className={cn(
            // 移动端始终使用正常间距，桌面端根据 sidebarOpen 切换
            "space-y-6",
            !sidebarOpen && "lg:space-y-3"
          )}>
            {menuSections.map((section, sectionIndex) => (
              <li key={section.title}>
                {/* 块标题 - 移动端始终可见，桌面端根据 sidebarOpen 切换 */}
                <div className={cn(
                  "px-3 h-[1.25rem]",
                  // 移动端始终显示，桌面端根据状态切换
                  "mb-2",
                  !sidebarOpen && "lg:mb-1 lg:invisible"
                )}>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 whitespace-nowrap">
                    {section.title}
                  </h3>
                </div>

                {/* 分割线 - 仅在桌面端折叠时显示 */}
                {!sidebarOpen && sectionIndex > 0 && (
                  <div className="hidden lg:block mb-2 border-t border-border" />
                )}

                {/* 菜单项列表 */}
                <ul className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = matchRoute({ to: item.path })
                    const Icon = item.icon

                    const menuItemContent = (
                      <>
                        {/* 左侧高亮条 */}
                        {isActive && (
                          <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-primary transition-opacity duration-300" />
                        )}
                        <div className={cn(
                          'flex items-center transition-all duration-300',
                          sidebarOpen ? 'gap-3' : 'lg:gap-0'
                        )}>
                          <Icon
                            className={cn(
                              'h-5 w-5 flex-shrink-0',
                              isActive && 'text-primary'
                            )}
                            strokeWidth={2}
                            fill="none"
                          />
                          <span className={cn(
                            'text-sm font-medium whitespace-nowrap transition-all duration-300',
                            isActive && 'font-semibold',
                            sidebarOpen 
                              ? 'opacity-100 max-w-[200px]' 
                              : 'lg:opacity-0 lg:max-w-0 lg:overflow-hidden'
                          )}>
                            {item.label}
                          </span>
                        </div>
                      </>
                    )

                    return (
                      <li key={item.path} className="relative">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link
                              to={item.path}
                              className={cn(
                                'relative flex items-center rounded-lg py-2 transition-all duration-300',
                                'hover:bg-accent hover:text-accent-foreground',
                                isActive
                                  ? 'bg-accent text-foreground'
                                  : 'text-muted-foreground hover:text-foreground',
                                sidebarOpen ? 'px-3' : 'lg:px-0 lg:justify-center'
                              )}
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              {menuItemContent}
                            </Link>
                          </TooltipTrigger>
                          {!sidebarOpen && (
                            <TooltipContent side="right" className="hidden lg:block">
                              <p>{item.label}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
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
            
            {/* 桌面端侧边栏收起/展开按钮 */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden rounded-lg p-2 hover:bg-accent lg:block"
              title={sidebarOpen ? '收起侧边栏' : '展开侧边栏'}
            >
              <ChevronLeft
                className={cn('h-5 w-5 transition-transform', !sidebarOpen && 'rotate-180')}
              />
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
        <main className="flex-1 overflow-hidden bg-background">{children}</main>
      </div>
    </div>
    </TooltipProvider>
  )
}
