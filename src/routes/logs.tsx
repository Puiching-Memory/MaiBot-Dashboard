import { useState, useRef, useEffect, useMemo } from 'react'
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
  const viewportRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

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

  // 自动滚动到底部
  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      // 使用 scrollIntoView 确保滚动到底部
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [logs, autoScroll])

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
        return 'bg-secondary/50'
      case 'INFO':
        return 'bg-blue-500/10 dark:bg-blue-500/20'
      case 'WARNING':
        return 'bg-yellow-500/10 dark:bg-yellow-500/20'
      case 'ERROR':
        return 'bg-red-500/10 dark:bg-red-500/20'
      case 'CRITICAL':
        return 'bg-red-600/20 dark:bg-red-600/30'
      default:
        return 'bg-muted/50'
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

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-4 sm:p-6">
        {/* 标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">日志查看器</h1>
            <p className="text-sm text-muted-foreground mt-1">
              实时查看和分析麦麦运行日志
            </p>
          </div>
          {/* 连接状态指示器 */}
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'h-3 w-3 rounded-full',
                connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
              )}
            />
            <span className="text-sm text-muted-foreground">
              {connected ? '已连接' : '未连接'}
            </span>
          </div>
        </div>

        {/* 控制栏 */}
        <Card className="p-4">
          <div className="flex flex-col gap-4">
            {/* 第一行：搜索和筛选 */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* 搜索框 */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索日志内容、模块名..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* 日志级别筛选 */}
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="日志级别" />
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
                <SelectTrigger className="w-full sm:w-[200px]">
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
            <div className="flex flex-col sm:flex-row gap-4">
              {/* 开始日期 */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full sm:w-[240px] justify-start text-left font-normal',
                      !dateFrom && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, 'PPP', { locale: zhCN }) : '开始日期'}
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
                    className={cn(
                      'w-full sm:w-[240px] justify-start text-left font-normal',
                      !dateTo && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, 'PPP', { locale: zhCN }) : '结束日期'}
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
                  className="w-full sm:w-auto"
                >
                  <X className="h-4 w-4 mr-2" />
                  清除时间筛选
                </Button>
              )}
            </div>

            {/* 第三行：操作按钮 */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={autoScroll ? 'default' : 'outline'}
                size="sm"
                onClick={toggleAutoScroll}
              >
                {autoScroll ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                <span className="ml-2">
                  {autoScroll ? '自动滚动' : '已暂停'}
                </span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
              >
                <RefreshCw className="h-4 w-4" />
                <span className="ml-2">刷新</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleClear}>
                <Trash2 className="h-4 w-4" />
                <span className="ml-2">清空</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4" />
                <span className="ml-2">导出</span>
              </Button>
              <div className="flex-1" />
              <div className="text-sm text-muted-foreground flex items-center">
                {filteredLogs.length} / {logs.length} 条日志
              </div>
            </div>
          </div>
        </Card>

        {/* 日志终端 */}
        <Card className="bg-black dark:bg-gray-950 border-gray-800 dark:border-gray-900">
          <ScrollArea className="h-[calc(100vh-400px)]">
            <div ref={viewportRef} className="p-4 font-mono text-sm space-y-1">
              {filteredLogs.length === 0 ? (
                <div className="text-gray-500 dark:text-gray-600 text-center py-8">
                  暂无日志数据
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className={cn(
                      'flex gap-3 py-1.5 px-3 rounded hover:bg-white/5 transition-colors group',
                      getLevelBgColor(log.level)
                    )}
                  >
                    {/* 时间戳 */}
                    <span className="text-gray-500 dark:text-gray-600 flex-shrink-0 w-[180px]">
                      {log.timestamp}
                    </span>

                    {/* 日志级别 */}
                    <span
                      className={cn(
                        'flex-shrink-0 w-[80px] font-semibold',
                        getLevelColor(log.level)
                      )}
                    >
                      [{log.level}]
                    </span>

                    {/* 模块名 */}
                    <span className="text-cyan-400 dark:text-cyan-500 flex-shrink-0 w-[150px] truncate">
                      {log.module}
                    </span>

                    {/* 消息内容 */}
                    <span className="text-gray-300 dark:text-gray-400 flex-1 break-all">
                      {log.message}
                    </span>
                  </div>
                ))
              )}

              {/* 底部锚点，用于自动滚动 */}
              <div ref={bottomRef} className="h-4" />
            </div>
          </ScrollArea>
        </Card>
      </div>
    </ScrollArea>
  )
}


