import { useState, useRef, useEffect } from 'react'
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
import { Search, RefreshCw, Download, Filter, Trash2, Pause, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LogEntry {
  id: string
  timestamp: string
  level: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
  module: string
  message: string
  details?: Record<string, unknown>
}

export function LogViewerPage() {
  const [logs] = useState<LogEntry[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState<string>('all')
  const [loading, setLoading] = useState(false)
  const [autoScroll, setAutoScroll] = useState(true)
  const viewportRef = useRef<HTMLDivElement>(null)

  // 自动滚动到底部
  useEffect(() => {
    if (autoScroll && viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight
    }
  }, [logs, autoScroll])

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

  // 刷新日志
  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 1000)
  }

  // 清空日志
  const handleClear = () => {
    // TODO: 实现清空逻辑
    console.log('清空日志')
  }

  // 导出日志
  const handleExport = () => {
    // TODO: 实现导出逻辑
    console.log('导出日志')
  }

  // 切换自动滚动
  const toggleAutoScroll = () => {
    setAutoScroll(!autoScroll)
  }

  // 过滤日志
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      searchQuery === '' ||
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.module.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesLevel = levelFilter === 'all' || log.level === levelFilter
    return matchesSearch && matchesLevel
  })

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-4 sm:p-6">
        {/* 标题 */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">日志查看器</h1>
          <p className="text-sm text-muted-foreground mt-1">
            实时查看和分析麦麦运行日志
          </p>
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
                  <SelectValue placeholder="选择日志级别" />
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
            </div>

            {/* 第二行：操作按钮 */}
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
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
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
                {filteredLogs.length} 条日志
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

              {/* 底部占位，确保能滚动到最底部 */}
              <div className="h-4" />
            </div>
          </ScrollArea>
        </Card>
      </div>
    </ScrollArea>
  )
}


