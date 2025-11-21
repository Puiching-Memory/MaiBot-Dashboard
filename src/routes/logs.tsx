import { useState, useRef, useEffect, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Search, RefreshCw, Download, Filter, Trash2, Pause, Play, Calendar as CalendarIcon, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { logWebSocket, type LogEntry } from '@/lib/log-websocket'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

export function LogViewerPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [moduleFilter, setModuleFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined)
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined)
  const [autoScroll, setAutoScroll] = useState(true)
  const [connected, setConnected] = useState(false)
  const parentRef = useRef<HTMLDivElement>(null)
  const updateTimerRef = useRef<number | null>(null)

  // 订阅全局 WebSocket 连接
  useEffect(() => {
    // 初始化时加载缓存的日志
    const cachedLogs = logWebSocket.getAllLogs()
    setLogs(cachedLogs)
    
    // 订阅日志消息 - 直接使用全局缓存而不是组件状态
    const unsubscribeLogs = logWebSocket.onLog(() => {
      // 每次收到新日志，重新从全局缓存加载
      setLogs(logWebSocket.getAllLogs())
    })

    // 订阅连接状态
    const unsubscribeConnection = logWebSocket.onConnectionChange((isConnected) => {
      setConnected(isConnected)
    })

    // 清理订阅
    return () => {
      unsubscribeLogs()
      unsubscribeConnection()
    }
  }, [])

  // 获取所有唯一的模块名
  const uniqueModules = useMemo(() => {
    const modules = new Set(logs.map(log => log.module))
    return Array.from(modules).sort()
  }, [logs])

  // 日志级别颜色映射
  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'DEBUG':
        return 'text-muted-foreground'
      case 'INFO':
        return 'text-blue-500 dark:text-blue-400'
      case 'WARNING':
        return 'text-yellow-600 dark:text-yellow-500'
      case 'ERROR':
        return 'text-red-600 dark:text-red-500'
      case 'CRITICAL':
        return 'text-red-700 dark:text-red-400 font-bold'
      default:
        return 'text-foreground'
    }
  }

  const getLevelBgColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'DEBUG':
        return 'bg-gray-800/30 dark:bg-gray-800/50'
      case 'INFO':
        return 'bg-blue-900/20 dark:bg-blue-500/20'
      case 'WARNING':
        return 'bg-yellow-900/20 dark:bg-yellow-500/20'
      case 'ERROR':
        return 'bg-red-900/20 dark:bg-red-500/20'
      case 'CRITICAL':
        return 'bg-red-900/30 dark:bg-red-600/30'
      default:
        return 'bg-gray-800/20 dark:bg-gray-800/30'
    }
  }

  // 刷新日志（刷新页面）
  const handleRefresh = () => {
    window.location.reload()
  }

  // 清空日志
  const handleClear = () => {
    logWebSocket.clearLogs() // 清空全局缓存
    setLogs([])
  }

  // 导出日志为 TXT 格式
  const handleExport = () => {
    // 格式化日志为文本
    const logText = filteredLogs.map(log => 
      `${log.timestamp} [${log.level.padEnd(8)}] [${log.module}] ${log.message}`
    ).join('\n')
    
    const dataBlob = new Blob([logText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `logs-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  // 切换自动滚动
  const toggleAutoScroll = () => {
    setAutoScroll(!autoScroll)
  }

  // 清除时间筛选
  const clearDateFilter = () => {
    setDateFrom(undefined)
    setDateTo(undefined)
  }

  // 过滤日志
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // 搜索过滤
      const matchesSearch =
        searchQuery === '' ||
        log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.module.toLowerCase().includes(searchQuery.toLowerCase())
      
      // 级别过滤
      const matchesLevel = levelFilter === 'all' || log.level === levelFilter
      
      // 模块过滤
      const matchesModule = moduleFilter === 'all' || log.module === moduleFilter
      
      // 时间过滤
      let matchesDate = true
      if (dateFrom || dateTo) {
        const logDate = new Date(log.timestamp)
        if (dateFrom) {
          const fromDate = new Date(dateFrom)
          fromDate.setHours(0, 0, 0, 0)
          matchesDate = matchesDate && logDate >= fromDate
        }
        if (dateTo) {
          const toDate = new Date(dateTo)
          toDate.setHours(23, 59, 59, 999)
          matchesDate = matchesDate && logDate <= toDate
        }
      }
      
      return matchesSearch && matchesLevel && matchesModule && matchesDate
    })
  }, [logs, searchQuery, levelFilter, moduleFilter, dateFrom, dateTo])

  // 虚拟滚动配置
  const rowVirtualizer = useVirtualizer({
    count: filteredLogs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // 预估每条日志高度(移动端垂直布局更高)
    overscan: 10, // 上下各额外渲染10条
  })

  // 自动滚动到底部
  useEffect(() => {
    if (autoScroll && filteredLogs.length > 0) {
      rowVirtualizer.scrollToIndex(filteredLogs.length - 1, {
        align: 'end',
        behavior: 'auto',
      })
    }
  }, [filteredLogs.length, autoScroll, rowVirtualizer])

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-3 sm:p-4 lg:p-6">
        {/* 标题 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">日志查看器</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              实时查看和分析麦麦运行日志
            </p>
          </div>
          {/* 连接状态指示器 */}
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full',
                connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              )}
            />
            <span className="text-xs sm:text-sm text-muted-foreground">
              {connected ? '已连接' : '未连接'}
            </span>
          </div>
        </div>

        {/* 控制栏 */}
        <Card className="p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* 第一行：搜索和筛选 */}
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              {/* 搜索框 */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索日志..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>

              {/* 日志级别筛选 */}
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-full sm:w-[140px] lg:w-[180px] h-9 text-sm">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="级别" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部级别</SelectItem>
                  <SelectItem value="DEBUG">DEBUG</SelectItem>
                  <SelectItem value="INFO">INFO</SelectItem>
                  <SelectItem value="WARNING">WARNING</SelectItem>
                  <SelectItem value="ERROR">ERROR</SelectItem>
                  <SelectItem value="CRITICAL">CRITICAL</SelectItem>
                </SelectContent>
              </Select>

              {/* 模块筛选 */}
              <Select value={moduleFilter} onValueChange={setModuleFilter}>
                <SelectTrigger className="w-full sm:w-[160px] lg:w-[200px] h-9 text-sm">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="模块" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部模块</SelectItem>
                  {uniqueModules.map(module => (
                    <SelectItem key={module} value={module}>
                      {module}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 第二行：时间筛选 */}
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
              {/* 开始日期 */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      'w-full sm:w-[200px] lg:w-[240px] justify-start text-left font-normal h-9',
                      !dateFrom && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <span className="text-xs sm:text-sm">
                      {dateFrom ? format(dateFrom, 'PPP', { locale: zhCN }) : '开始日期'}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                    locale={zhCN}
                  />
                </PopoverContent>
              </Popover>

              {/* 结束日期 */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      'w-full sm:w-[200px] lg:w-[240px] justify-start text-left font-normal h-9',
                      !dateTo && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <span className="text-xs sm:text-sm">
                      {dateTo ? format(dateTo, 'PPP', { locale: zhCN }) : '结束日期'}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                    locale={zhCN}
                  />
                </PopoverContent>
              </Popover>

              {/* 清除时间筛选 */}
              {(dateFrom || dateTo) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearDateFilter}
                  className="w-full sm:w-auto h-9"
                >
                  <X className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline text-sm">清除时间筛选</span>
                  <span className="sm:hidden text-sm">清除</span>
                </Button>
              )}
            </div>

            {/* 第三行：操作按钮 */}
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={autoScroll ? 'default' : 'outline'}
                  size="sm"
                  onClick={toggleAutoScroll}
                  className="flex-1 sm:flex-none h-9"
                >
                  {autoScroll ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  <span className="ml-2 text-sm">
                    {autoScroll ? '自动滚动' : '已暂停'}
                  </span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  className="flex-1 sm:flex-none h-9"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span className="ml-2 text-sm">刷新</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleClear}
                  className="flex-1 sm:flex-none h-9"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="ml-2 text-sm">清空</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleExport}
                  className="flex-1 sm:flex-none h-9"
                >
                  <Download className="h-4 w-4" />
                  <span className="ml-2 text-sm">导出</span>
                </Button>
              </div>
              <div className="flex-1 hidden sm:block" />
              <div className="text-xs sm:text-sm text-muted-foreground flex items-center justify-center sm:justify-end">
                <span className="font-mono">
                  {filteredLogs.length} / {logs.length}
                </span>
                <span className="ml-1">条日志</span>
              </div>
            </div>
          </div>
        </Card>

        {/* 日志终端 - 使用虚拟滚动 */}
        <Card className="bg-black dark:bg-gray-950 border-gray-800 dark:border-gray-900">
          <ScrollArea 
            viewportRef={parentRef}
            className="h-[calc(100vh-280px)] sm:h-[calc(100vh-320px)] lg:h-[calc(100vh-400px)]"
          >
              <div
                className="p-2 sm:p-3 lg:p-4 font-mono text-xs sm:text-sm relative"
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                }}
              >
              {filteredLogs.length === 0 ? (
                <div className="text-gray-500 dark:text-gray-600 text-center py-8 text-sm">
                  暂无日志数据
                </div>
              ) : (
                rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const log = filteredLogs[virtualRow.index]
                  return (
                    <div
                      key={virtualRow.key}
                      data-index={virtualRow.index}
                      ref={rowVirtualizer.measureElement}
                      className={cn(
                        'absolute top-0 left-0 w-full py-2 px-2 sm:px-3 rounded hover:bg-white/5 transition-colors group',
                        getLevelBgColor(log.level)
                      )}
                      style={{
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      {/* 移动端：垂直布局 */}
                      <div className="flex flex-col gap-1 sm:hidden">
                        {/* 第一行：时间戳和级别 */}
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 dark:text-gray-600 text-xs">
                            {log.timestamp}
                          </span>
                          <span
                            className={cn(
                              'text-xs font-semibold',
                              getLevelColor(log.level)
                            )}
                          >
                            [{log.level}]
                          </span>
                        </div>
                        {/* 第二行：模块名 */}
                        <div className="text-cyan-400 dark:text-cyan-500 text-xs truncate">
                          {log.module}
                        </div>
                        {/* 第三行：消息内容 */}
                        <div className="text-gray-300 dark:text-gray-400 text-xs whitespace-pre-wrap break-words">
                          {log.message}
                        </div>
                      </div>

                      {/* 平板/桌面端：水平布局 */}
                      <div className="hidden sm:flex gap-3 items-start">
                        {/* 时间戳 */}
                        <span className="text-gray-500 dark:text-gray-600 flex-shrink-0 w-[140px] lg:w-[180px] text-xs lg:text-sm">
                          {log.timestamp}
                        </span>

                        {/* 日志级别 */}
                        <span
                          className={cn(
                            'flex-shrink-0 w-[70px] lg:w-[80px] font-semibold text-xs lg:text-sm',
                            getLevelColor(log.level)
                          )}
                        >
                          [{log.level}]
                        </span>

                        {/* 模块名 */}
                        <span className="text-cyan-400 dark:text-cyan-500 flex-shrink-0 w-[120px] lg:w-[150px] truncate text-xs lg:text-sm">
                          {log.module}
                        </span>

                        {/* 消息内容 */}
                        <span className="text-gray-300 dark:text-gray-400 flex-1 whitespace-pre-wrap break-words text-xs lg:text-sm">
                          {log.message}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </ScrollArea>
  )
}


