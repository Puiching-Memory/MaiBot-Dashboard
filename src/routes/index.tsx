import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import {
  Activity,
  TrendingUp,
  DollarSign,
  Clock,
  MessageSquare,
  Zap,
  Database,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface StatisticsSummary {
  total_requests: number
  total_cost: number
  total_tokens: number
  online_time: number
  total_messages: number
  total_replies: number
  avg_response_time: number
  cost_per_hour: number
  tokens_per_hour: number
}

interface ModelStatistics {
  model_name: string
  request_count: number
  total_cost: number
  total_tokens: number
  avg_response_time: number
}

interface TimeSeriesData {
  timestamp: string
  requests: number
  cost: number
  tokens: number
}

interface RecentActivity {
  timestamp: string
  model: string
  request_type: string
  tokens: number
  cost: number
  time_cost: number
  status: string
}

interface DashboardData {
  summary: StatisticsSummary
  model_stats: ModelStatistics[]
  hourly_data: TimeSeriesData[]
  daily_data: TimeSeriesData[]
  recent_activity: RecentActivity[]
}

export function IndexPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [timeRange, setTimeRange] = useState(24) // 默认24小时
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [hitokoto, setHitokoto] = useState<{ hitokoto: string; from: string } | null>(null)
  const [hitokotoLoading, setHitokotoLoading] = useState(true)

  // 获取一言
  const fetchHitokoto = useCallback(async () => {
    try {
      setHitokotoLoading(true)
      const response = await axios.get('https://v1.hitokoto.cn/?c=a&c=b&c=c&c=d&c=h&c=i&c=k')
      setHitokoto({
        hitokoto: response.data.hitokoto,
        from: response.data.from || response.data.from_who || '未知'
      })
    } catch (error) {
      console.error('获取一言失败:', error)
      setHitokoto({
        hitokoto: '人生就像一盒巧克力，你永远不知道下一颗是什么味道。',
        from: '阿甘正传'
      })
    } finally {
      setHitokotoLoading(false)
    }
  }, [])

  const fetchDashboardData = useCallback(async () => {
    try {
      const token = localStorage.getItem('access-token')
      const response = await axios.get(`/api/webui/statistics/dashboard?hours=${timeRange}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setDashboardData(response.data)
      setLoading(false)
      setLoadingProgress(100)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      setLoading(false)
      setLoadingProgress(100)
    }
  }, [timeRange])

  // 伪加载进度条效果
  useEffect(() => {
    if (!loading) return

    setLoadingProgress(0)
    
    // 快速到15%
    const timer1 = setTimeout(() => setLoadingProgress(15), 200)
    // 到30%
    const timer2 = setTimeout(() => setLoadingProgress(30), 800)
    // 到45%
    const timer3 = setTimeout(() => setLoadingProgress(45), 2000)
    // 到60%
    const timer4 = setTimeout(() => setLoadingProgress(60), 4000)
    // 到75%
    const timer5 = setTimeout(() => setLoadingProgress(75), 6500)
    // 到85%
    const timer6 = setTimeout(() => setLoadingProgress(85), 9000)
    // 到92%
    const timer7 = setTimeout(() => setLoadingProgress(92), 11000)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      clearTimeout(timer4)
      clearTimeout(timer5)
      clearTimeout(timer6)
      clearTimeout(timer7)
    }
  }, [loading])

  useEffect(() => {
    fetchDashboardData()
    fetchHitokoto()
  }, [fetchDashboardData, fetchHitokoto])

  // 自动刷新
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchDashboardData()
    }, 30000) // 30秒刷新一次

    return () => clearInterval(interval)
  }, [autoRefresh, fetchDashboardData])

  if (loading || !dashboardData) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center space-y-6 w-full max-w-md px-4">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto text-primary" />
          <div className="space-y-2">
            <p className="text-lg font-medium">加载统计数据中...</p>
            <p className="text-sm text-muted-foreground">正在获取麦麦运行数据</p>
          </div>
          <div className="space-y-2">
            <Progress value={loadingProgress} className="h-2" />
            <p className="text-xs text-muted-foreground">{loadingProgress}%</p>
          </div>
        </div>
      </div>
    )
  }

  const { summary, model_stats, hourly_data, daily_data, recent_activity } = dashboardData

  // 格式化时间显示
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}小时${minutes}分钟`
  }

  // 格式化日期时间
  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // 准备饼图数据（模型请求分布）
  const modelPieData = model_stats.slice(0, 6).map((stat) => ({
    name: stat.model_name,
    value: stat.request_count,
    fill: `hsl(var(--chart-${(model_stats.indexOf(stat) % 5) + 1}))`,
  }))

  // 图表配置
  const chartConfig = {
    requests: {
      label: '请求数',
      color: 'hsl(var(--chart-1))',
    },
    cost: {
      label: '花费(¥)',
      color: 'hsl(var(--chart-2))',
    },
    tokens: {
      label: 'Tokens',
      color: 'hsl(var(--chart-3))',
    },
  } satisfies ChartConfig

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* 标题和控制栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">实时监控面板</h1>
          <p className="text-sm text-muted-foreground mt-1">
            麦麦运行状态和统计数据一览
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tabs value={timeRange.toString()} onValueChange={(v) => setTimeRange(Number(v))}>
            <TabsList className="grid grid-cols-3 w-full sm:w-auto">
              <TabsTrigger value="24">24小时</TabsTrigger>
              <TabsTrigger value="168">7天</TabsTrigger>
              <TabsTrigger value="720">30天</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">自动刷新</span>
          </Button>
          <Button variant="outline" size="sm" onClick={fetchDashboardData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 一言 */}
      <div className="flex items-center gap-3 px-4 py-2 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20">
        {hitokotoLoading ? (
          <Skeleton className="h-5 flex-1" />
        ) : hitokoto ? (
          <p className="flex-1 text-sm text-muted-foreground italic truncate">
            "{hitokoto.hitokoto}" —— {hitokoto.from}
          </p>
        ) : null}
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7 shrink-0" 
          onClick={fetchHitokoto}
          disabled={hitokotoLoading}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${hitokotoLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* 核心指标卡片 */}
      <div className="grid gap-4 grid-cols-1 xs:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总请求数</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total_requests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              最近{timeRange < 48 ? timeRange + '小时' : Math.floor(timeRange / 24) + '天'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总花费</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{summary.total_cost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.cost_per_hour > 0 ? `¥${summary.cost_per_hour.toFixed(2)}/小时` : '暂无数据'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Token消耗</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(summary.total_tokens / 1000).toFixed(1)}K
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.tokens_per_hour > 0
                ? `${(summary.tokens_per_hour / 1000).toFixed(1)}K/小时`
                : '暂无数据'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均响应</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.avg_response_time.toFixed(2)}s</div>
            <p className="text-xs text-muted-foreground mt-1">API平均耗时</p>
          </CardContent>
        </Card>
      </div>

      {/* 次要指标 */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">在线时长</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatTime(summary.online_time)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">消息处理</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{summary.total_messages.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              回复 {summary.total_replies.toLocaleString()} 条
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">成本效率</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {summary.total_messages > 0
                ? `¥${((summary.total_cost / summary.total_messages) * 100).toFixed(2)}`
                : '¥0.00'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">每100条消息</p>
          </CardContent>
        </Card>
      </div>

      {/* 图表区域 */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="trends">趋势</TabsTrigger>
          <TabsTrigger value="models">模型</TabsTrigger>
          <TabsTrigger value="activity">活动</TabsTrigger>
          <TabsTrigger value="daily">日统计</TabsTrigger>
        </TabsList>

        {/* 趋势图表 */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>请求趋势</CardTitle>
              <CardDescription>最近{timeRange}小时的请求量变化</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] sm:h-[400px] w-full aspect-auto">
                <LineChart data={hourly_data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(value) => formatDateTime(value)}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <ChartTooltip
                    content={<ChartTooltipContent labelFormatter={(value) => formatDateTime(value as string)} />}
                  />
                  <Line
                    type="monotone"
                    dataKey="requests"
                    stroke="var(--color-requests)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>花费趋势</CardTitle>
                <CardDescription>API调用成本变化</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px] w-full aspect-auto">
                  <BarChart data={hourly_data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(value) => formatDateTime(value)}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <ChartTooltip
                      content={<ChartTooltipContent labelFormatter={(value) => formatDateTime(value as string)} />}
                    />
                    <Bar dataKey="cost" fill="var(--color-cost)" />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Token消耗</CardTitle>
                <CardDescription>Token使用量变化</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px] w-full aspect-auto">
                  <BarChart data={hourly_data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(value) => formatDateTime(value)}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <ChartTooltip
                      content={<ChartTooltipContent labelFormatter={(value) => formatDateTime(value as string)} />}
                    />
                    <Bar dataKey="tokens" fill="var(--color-tokens)" />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 模型统计 */}
        <TabsContent value="models" className="space-y-4">
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>模型请求分布</CardTitle>
                <CardDescription>各模型使用占比</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={
                    Object.fromEntries(
                      model_stats.slice(0, 6).map((stat, i) => [
                        stat.model_name,
                        {
                          label: stat.model_name,
                          color: `hsl(var(--chart-${(i % 5) + 1}))`,
                        },
                      ])
                    ) as ChartConfig
                  }
                  className="h-[300px] sm:h-[400px] w-full aspect-auto"
                >
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={modelPieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`
                      }
                      outerRadius={100}
                      dataKey="value"
                    >
                      {modelPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>模型详细统计</CardTitle>
                <CardDescription>请求数、花费和性能</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] sm:h-[400px]">
                  <div className="space-y-3">
                    {model_stats.map((stat, index) => (
                      <div
                        key={index}
                        className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-sm truncate flex-1 min-w-0">
                            {stat.model_name}
                          </h4>
                          <div
                            className="w-3 h-3 rounded-full ml-2 flex-shrink-0"
                            style={{
                              backgroundColor: `hsl(var(--chart-${(index % 5) + 1}))`,
                            }}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">请求数:</span>
                            <span className="ml-1 font-medium">
                              {stat.request_count.toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">花费:</span>
                            <span className="ml-1 font-medium">¥{stat.total_cost.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Tokens:</span>
                            <span className="ml-1 font-medium">
                              {(stat.total_tokens / 1000).toFixed(1)}K
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">平均耗时:</span>
                            <span className="ml-1 font-medium">
                              {stat.avg_response_time.toFixed(2)}s
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>最近活动</CardTitle>
              <CardDescription>最新的API调用记录</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] sm:h-[500px]">
                <div className="space-y-2">
                  {recent_activity.map((activity, index) => (
                    <div
                      key={index}
                      className="p-3 sm:p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{activity.model}</div>
                          <div className="text-xs text-muted-foreground">
                            {activity.request_type}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground flex-shrink-0">
                          {formatDateTime(activity.timestamp)}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Tokens:</span>
                          <span className="ml-1">{activity.tokens}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">花费:</span>
                          <span className="ml-1">¥{activity.cost.toFixed(4)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">耗时:</span>
                          <span className="ml-1">{activity.time_cost.toFixed(2)}s</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">状态:</span>
                          <span
                            className={`ml-1 ${activity.status === 'success' ? 'text-green-600' : 'text-red-600'}`}
                          >
                            {activity.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 日统计 */}
        <TabsContent value="daily">
          <Card>
            <CardHeader>
              <CardTitle>每日统计</CardTitle>
              <CardDescription>最近7天的数据汇总</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  requests: {
                    label: '请求数',
                    color: 'hsl(var(--chart-1))',
                  },
                  cost: {
                    label: '花费(¥)',
                    color: 'hsl(var(--chart-2))',
                  },
                }}
                className="h-[400px] sm:h-[500px] w-full aspect-auto"
              >
                <BarChart data={daily_data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(value) => {
                      const date = new Date(value)
                      return `${date.getMonth() + 1}/${date.getDate()}`
                    }}
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(value) => {
                          const date = new Date(value as string)
                          return date.toLocaleDateString('zh-CN')
                        }}
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar yAxisId="left" dataKey="requests" fill="var(--color-requests)" />
                  <Bar yAxisId="right" dataKey="cost" fill="var(--color-cost)" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </ScrollArea>
  )
}
