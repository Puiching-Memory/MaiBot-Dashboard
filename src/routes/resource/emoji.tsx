import { useState, useEffect, useCallback } from 'react'
import {
  Filter,
  RefreshCw,
  Trash2,
  Edit,
  Info,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CheckCircle2,
  Ban,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

import { Markdown } from '@/components/ui/markdown'
import { useToast } from '@/hooks/use-toast'
import type { Emoji, EmojiStats } from '@/types/emoji'
import {
  getEmojiList,
  getEmojiDetail,
  getEmojiStats,
  updateEmoji,
  deleteEmoji,
  registerEmoji,
  banEmoji,
  getEmojiThumbnailUrl,
  batchDeleteEmojis,
} from '@/lib/emoji-api'

export function EmojiManagementPage() {
  const [emojiList, setEmojiList] = useState<Emoji[]>([])
  const [stats, setStats] = useState<EmojiStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [registeredFilter, setRegisteredFilter] = useState<string>('all')
  const [bannedFilter, setBannedFilter] = useState<string>('all')
  const [formatFilter, setFormatFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('usage_count')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  const [selectedEmoji, setSelectedEmoji] = useState<Emoji | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [batchDeleteDialogOpen, setBatchDeleteDialogOpen] = useState(false)
  const [jumpToPage, setJumpToPage] = useState('')
  const [cardSize, setCardSize] = useState<'small' | 'medium' | 'large'>('medium')

  const { toast } = useToast()

  // 加载表情包列表
  const loadEmojiList = useCallback(async () => {
    try {
      setLoading(true)
      const response = await getEmojiList({
        page,
        page_size: pageSize,
        is_registered: registeredFilter === 'all' ? undefined : registeredFilter === 'registered',
        is_banned: bannedFilter === 'all' ? undefined : bannedFilter === 'banned',
        format: formatFilter === 'all' ? undefined : formatFilter,
        sort_by: sortBy,
        sort_order: sortOrder,
      })
      setEmojiList(response.data)
      setTotal(response.total)
    } catch (error) {
      const message = error instanceof Error ? error.message : '加载表情包列表失败'
      toast({
        title: '错误',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, registeredFilter, bannedFilter, formatFilter, sortBy, sortOrder, toast])

  // 加载统计数据
  const loadStats = async () => {
    try {
      const response = await getEmojiStats()
      setStats(response.data)
    } catch (error) {
      console.error('加载统计数据失败:', error)
    }
  }

  useEffect(() => {
    loadEmojiList()
  }, [loadEmojiList])

  useEffect(() => {
    loadStats()
  }, [])

  // 查看详情
  const handleViewDetail = async (emoji: Emoji) => {
    try {
      const response = await getEmojiDetail(emoji.id)
      setSelectedEmoji(response.data)
      setDetailDialogOpen(true)
    } catch (error) {
      const message = error instanceof Error ? error.message : '加载详情失败'
      toast({
        title: '错误',
        description: message,
        variant: 'destructive',
      })
    }
  }

  // 编辑表情包
  const handleEdit = (emoji: Emoji) => {
    setSelectedEmoji(emoji)
    setEditDialogOpen(true)
  }

  // 删除表情包
  const handleDelete = (emoji: Emoji) => {
    setSelectedEmoji(emoji)
    setDeleteDialogOpen(true)
  }

  // 确认删除
  const confirmDelete = async () => {
    if (!selectedEmoji) return

    try {
      await deleteEmoji(selectedEmoji.id)
      toast({
        title: '成功',
        description: '表情包已删除',
      })
      setDeleteDialogOpen(false)
      setSelectedEmoji(null)
      loadEmojiList()
      loadStats()
    } catch (error) {
      const message = error instanceof Error ? error.message : '删除失败'
      toast({
        title: '错误',
        description: message,
        variant: 'destructive',
      })
    }
  }

  // 快速注册
  const handleRegister = async (emoji: Emoji) => {
    try {
      await registerEmoji(emoji.id)
      toast({
        title: '成功',
        description: '表情包已注册',
      })
      loadEmojiList()
      loadStats()
    } catch (error) {
      const message = error instanceof Error ? error.message : '注册失败'
      toast({
        title: '错误',
        description: message,
        variant: 'destructive',
      })
    }
  }

  // 快速封禁
  const handleBan = async (emoji: Emoji) => {
    try {
      await banEmoji(emoji.id)
      toast({
        title: '成功',
        description: '表情包已封禁',
      })
      loadEmojiList()
      loadStats()
    } catch (error) {
      const message = error instanceof Error ? error.message : '封禁失败'
      toast({
        title: '错误',
        description: message,
        variant: 'destructive',
      })
    }
  }

  // 切换选择
  const toggleSelect = (id: number) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  // 批量删除
  const handleBatchDelete = async () => {
    try {
      const result = await batchDeleteEmojis(Array.from(selectedIds))
      toast({
        title: '批量删除完成',
        description: result.message,
      })
      setSelectedIds(new Set())
      setBatchDeleteDialogOpen(false)
      loadEmojiList()
      loadStats()
    } catch (error) {
      toast({
        title: '批量删除失败',
        description: error instanceof Error ? error.message : '批量删除失败',
        variant: 'destructive',
      })
    }
  }

  // 页面跳转
  const handleJumpToPage = () => {
    const targetPage = parseInt(jumpToPage)
    const totalPages = Math.ceil(total / pageSize)
    if (targetPage >= 1 && targetPage <= totalPages) {
      setPage(targetPage)
      setJumpToPage('')
    } else {
      toast({
        title: '无效的页码',
        description: `请输入1-${totalPages}之间的页码`,
        variant: 'destructive',
      })
    }
  }

  // 获取格式选项
  const formatOptions = stats?.formats ? Object.keys(stats.formats) : []

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col p-4 sm:p-6">
      {/* 页面标题 */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">表情包管理</h1>
        <p className="text-sm text-muted-foreground mt-1">
          管理麦麦的表情包资源
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-4 sm:space-y-6 pr-4">

      {/* 统计卡片 */}
      {stats && (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>总数</CardDescription>
              <CardTitle className="text-2xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>已注册</CardDescription>
              <CardTitle className="text-2xl text-green-600">
                {stats.registered}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>已封禁</CardDescription>
              <CardTitle className="text-2xl text-red-600">
                {stats.banned}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>未注册</CardDescription>
              <CardTitle className="text-2xl text-gray-600">
                {stats.unregistered}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* 筛选和排序 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            筛选和排序
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>排序方式</Label>
              <Select
                value={`${sortBy}-${sortOrder}`}
                onValueChange={(value) => {
                  const [newSortBy, newSortOrder] = value.split('-')
                  setSortBy(newSortBy)
                  setSortOrder(newSortOrder as 'desc' | 'asc')
                  setPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usage_count-desc">使用次数 (多→少)</SelectItem>
                  <SelectItem value="usage_count-asc">使用次数 (少→多)</SelectItem>
                  <SelectItem value="register_time-desc">注册时间 (新→旧)</SelectItem>
                  <SelectItem value="register_time-asc">注册时间 (旧→新)</SelectItem>
                  <SelectItem value="record_time-desc">记录时间 (新→旧)</SelectItem>
                  <SelectItem value="record_time-asc">记录时间 (旧→新)</SelectItem>
                  <SelectItem value="last_used_time-desc">最后使用 (新→旧)</SelectItem>
                  <SelectItem value="last_used_time-asc">最后使用 (旧→新)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>注册状态</Label>
              <Select
                value={registeredFilter}
                onValueChange={(value) => {
                  setRegisteredFilter(value)
                  setPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="registered">已注册</SelectItem>
                  <SelectItem value="unregistered">未注册</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>封禁状态</Label>
              <Select
                value={bannedFilter}
                onValueChange={(value) => {
                  setBannedFilter(value)
                  setPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="banned">已封禁</SelectItem>
                  <SelectItem value="unbanned">未封禁</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>格式</Label>
              <Select
                value={formatFilter}
                onValueChange={(value) => {
                  setFormatFilter(value)
                  setPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  {formatOptions.map((format) => (
                    <SelectItem key={format} value={format}>
                      {format.toUpperCase()} ({stats?.formats[format]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t">
            <div className="flex items-center gap-4">
              {selectedIds.size > 0 && (
                <span className="text-sm text-muted-foreground">已选择 {selectedIds.size} 个表情包</span>
              )}
              {/* 卡片尺寸切换 */}
              <div className="flex items-center gap-2">
                <Label className="text-sm whitespace-nowrap">卡片大小</Label>
                <Select
                  value={cardSize}
                  onValueChange={(value: 'small' | 'medium' | 'large') => setCardSize(value)}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">小</SelectItem>
                    <SelectItem value="medium">中</SelectItem>
                    <SelectItem value="large">大</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="emoji-page-size" className="text-sm whitespace-nowrap">每页显示</Label>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => {
                  setPageSize(parseInt(value))
                  setPage(1)
                  setSelectedIds(new Set())
                }}
              >
                <SelectTrigger id="emoji-page-size" className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="40">40</SelectItem>
                  <SelectItem value="60">60</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              {selectedIds.size > 0 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedIds(new Set())}
                  >
                    取消选择
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setBatchDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    批量删除
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={loadEmojiList}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 表情包卡片列表 */}
      <Card>
        <CardHeader>
          <CardTitle>表情包列表</CardTitle>
          <CardDescription>
            共 {total} 个表情包，当前第 {page} 页
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* 卡片网格视图 */}
          {emojiList.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              暂无数据
            </div>
          ) : (
            <div className={`grid gap-3 ${
              cardSize === 'small' 
                ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10' 
                : cardSize === 'medium'
                ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8'
                : 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
            }`}>
              {emojiList.map((emoji) => (
                <div 
                  key={emoji.id} 
                  className={`group relative rounded-lg border bg-card overflow-hidden hover:ring-2 hover:ring-primary transition-all cursor-pointer ${
                    selectedIds.has(emoji.id) ? 'ring-2 ring-primary bg-primary/5' : ''
                  }`}
                  onClick={() => toggleSelect(emoji.id)}
                >
                  {/* 选中指示器 */}
                  <div className={`absolute top-1 left-1 z-10 transition-opacity ${
                    selectedIds.has(emoji.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedIds.has(emoji.id) 
                        ? 'bg-primary border-primary text-primary-foreground' 
                        : 'bg-background/80 border-muted-foreground/50'
                    }`}>
                      {selectedIds.has(emoji.id) && <CheckCircle2 className="h-3 w-3" />}
                    </div>
                  </div>

                  {/* 状态标签 */}
                  <div className="absolute top-1 right-1 z-10 flex flex-col gap-0.5">
                    {emoji.is_registered && (
                      <Badge variant="default" className="bg-green-600 text-[10px] px-1 py-0">
                        已注册
                      </Badge>
                    )}
                    {emoji.is_banned && (
                      <Badge variant="destructive" className="text-[10px] px-1 py-0">
                        已封禁
                      </Badge>
                    )}
                  </div>

                  {/* 图片 */}
                  <div className={`aspect-square bg-muted flex items-center justify-center overflow-hidden ${
                    cardSize === 'small' ? 'p-1' : cardSize === 'medium' ? 'p-2' : 'p-3'
                  }`}>
                    <img
                      src={getEmojiThumbnailUrl(emoji.id)}
                      alt="表情包"
                      className="w-full h-full object-contain"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        const parent = target.parentElement
                        if (parent) {
                          parent.innerHTML = '<svg class="h-8 w-8 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>'
                        }
                      }}
                    />
                  </div>

                  {/* 底部信息和操作 */}
                  <div className={`border-t bg-card ${cardSize === 'small' ? 'p-1' : 'p-2'}`}>
                    {/* 使用次数和格式 */}
                    <div className="flex items-center justify-between gap-1 text-xs text-muted-foreground mb-1">
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        {emoji.format.toUpperCase()}
                      </Badge>
                      <span className="font-mono">{emoji.usage_count}次</span>
                    </div>
                    
                    {/* 操作按钮 - 悬停时显示 */}
                    <div className={`flex gap-1 justify-center opacity-0 group-hover:opacity-100 transition-opacity ${
                      cardSize === 'small' ? 'flex-wrap' : ''
                    }`}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEdit(emoji)
                        }}
                        title="编辑"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewDetail(emoji)
                        }}
                        title="详情"
                      >
                        <Info className="h-3 w-3" />
                      </Button>
                      {!emoji.is_registered && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-green-600 hover:text-green-700"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRegister(emoji)
                          }}
                          title="注册"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                        </Button>
                      )}
                      {!emoji.is_banned && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-orange-600 hover:text-orange-700"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleBan(emoji)
                          }}
                          title="封禁"
                        >
                          <Ban className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-600 hover:text-red-700"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(emoji)
                        }}
                        title="删除"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 分页 */}
          {/* 分页 - 增强版 */}
          {total > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
              <div className="text-sm text-muted-foreground">
                显示 {(page - 1) * pageSize + 1} 到{' '}
                {Math.min(page * pageSize, total)} 条，共 {total} 条
              </div>
              <div className="flex items-center gap-2">
                {/* 首页 */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="hidden sm:flex"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                
                {/* 上一页 */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">上一页</span>
                </Button>

                {/* 页码跳转 */}
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={jumpToPage}
                    onChange={(e) => setJumpToPage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleJumpToPage()}
                    placeholder={page.toString()}
                    className="w-16 h-8 text-center"
                    min={1}
                    max={Math.ceil(total / pageSize)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleJumpToPage}
                    disabled={!jumpToPage}
                    className="h-8"
                  >
                    跳转
                  </Button>
                </div>
                
                {/* 下一页 */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= Math.ceil(total / pageSize)}
                >
                  <span className="hidden sm:inline">下一页</span>
                  <ChevronRight className="h-4 w-4 sm:ml-1" />
                </Button>

                {/* 末页 */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.ceil(total / pageSize))}
                  disabled={page >= Math.ceil(total / pageSize)}
                  className="hidden sm:flex"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 详情对话框 */}
      <EmojiDetailDialog
        emoji={selectedEmoji}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />

      {/* 编辑对话框 */}
      <EmojiEditDialog
        emoji={selectedEmoji}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={() => {
          loadEmojiList()
          loadStats()
        }}
      />

        </div>
      </ScrollArea>

      {/* 批量删除确认对话框 */}
      <AlertDialog open={batchDeleteDialogOpen} onOpenChange={setBatchDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认批量删除</AlertDialogTitle>
            <AlertDialogDescription>
              你确定要删除选中的 {selectedIds.size} 个表情包吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleBatchDelete}>
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除这个表情包吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              取消
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// 详情对话框组件
function EmojiDetailDialog({
  emoji,
  open,
  onOpenChange,
}: {
  emoji: Emoji | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!emoji) return null

  const formatTime = (timestamp: number | null) => {
    if (!timestamp) return '-'
    return new Date(timestamp * 1000).toLocaleString('zh-CN')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>表情包详情</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-8rem)] pr-4">
          <div className="space-y-4">
          {/* 表情包预览图 */}
          <div className="flex justify-center">
            <div className="w-32 h-32 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
              <img
                src={getEmojiThumbnailUrl(emoji.id)}
                alt={emoji.description || '表情包'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  const parent = target.parentElement
                  if (parent) {
                    parent.innerHTML = '<svg class="h-16 w-16 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>'
                  }
                }}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-muted-foreground">ID</Label>
              <div className="mt-1 font-mono">{emoji.id}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">格式</Label>
              <div className="mt-1">
                <Badge variant="outline">{emoji.format.toUpperCase()}</Badge>
              </div>
            </div>
          </div>

          <div>
            <Label className="text-muted-foreground">文件路径</Label>
            <div className="mt-1 font-mono text-sm break-all bg-muted p-2 rounded">
              {emoji.full_path}
            </div>
          </div>

          <div>
            <Label className="text-muted-foreground">哈希值</Label>
            <div className="mt-1 font-mono text-sm break-all bg-muted p-2 rounded">
              {emoji.emoji_hash}
            </div>
          </div>

          <div>
            <Label className="text-muted-foreground">描述</Label>
            {emoji.description ? (
              <div className="mt-1 rounded-lg border bg-muted/50 p-3">
                <Markdown className="prose-sm">{emoji.description}</Markdown>
              </div>
            ) : (
              <div className="mt-1 text-sm text-muted-foreground">-</div>
            )}
          </div>

          <div>
            <Label className="text-muted-foreground">情绪</Label>
            <div className="mt-1">
              {emoji.emotion ? (
                <span className="text-sm">{emoji.emotion}</span>
              ) : (
                <span className="text-sm text-muted-foreground">-</span>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-muted-foreground">状态</Label>
              <div className="mt-2 flex gap-2">
                {emoji.is_registered && (
                  <Badge variant="default" className="bg-green-600">
                    已注册
                  </Badge>
                )}
                {emoji.is_banned && (
                  <Badge variant="destructive">已封禁</Badge>
                )}
                {!emoji.is_registered && !emoji.is_banned && (
                  <Badge variant="outline">未注册</Badge>
                )}
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">使用次数</Label>
              <div className="mt-1 font-mono text-lg">{emoji.usage_count}</div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-muted-foreground">记录时间</Label>
              <div className="mt-1 text-sm">{formatTime(emoji.record_time)}</div>
            </div>
            <div>
              <Label className="text-muted-foreground">注册时间</Label>
              <div className="mt-1 text-sm">{formatTime(emoji.register_time)}</div>
            </div>
          </div>

          <div>
            <Label className="text-muted-foreground">最后使用</Label>
            <div className="mt-1 text-sm">{formatTime(emoji.last_used_time)}</div>
          </div>
        </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

// 编辑对话框组件
function EmojiEditDialog({
  emoji,
  open,
  onOpenChange,
  onSuccess,
}: {
  emoji: Emoji | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const [emotionInput, setEmotionInput] = useState('')
  const [isRegistered, setIsRegistered] = useState(false)
  const [isBanned, setIsBanned] = useState(false)
  const [saving, setSaving] = useState(false)

  const { toast } = useToast()

  useEffect(() => {
    if (emoji) {
      setEmotionInput(emoji.emotion || '')
      setIsRegistered(emoji.is_registered)
      setIsBanned(emoji.is_banned)
    }
  }, [emoji])

  const handleSave = async () => {
    if (!emoji) return

    try {
      setSaving(true)
      // 将输入的标签字符串标准化为逗号分隔格式
      const emotionString = emotionInput
        .split(/[,,]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .join(',')

      await updateEmoji(emoji.id, {
        emotion: emotionString || undefined,
        is_registered: isRegistered,
        is_banned: isBanned,
      })

      toast({
        title: '成功',
        description: '表情包信息已更新',
      })
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      const message = error instanceof Error ? error.message : '保存失败'
      toast({
        title: '错误',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (!emoji) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>编辑表情包</DialogTitle>
          <DialogDescription>修改表情包的情绪和状态信息</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>情绪</Label>
            <Textarea
              value={emotionInput}
              onChange={(e) => setEmotionInput(e.target.value)}
              placeholder="输入情绪描述..."
              rows={2}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              输入情绪相关的文本描述
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_registered"
                checked={isRegistered}
                onCheckedChange={(checked) => {
                  if (checked === true) {
                    setIsRegistered(true)
                    setIsBanned(false) // 注册时自动取消封禁
                  } else {
                    setIsRegistered(false)
                  }
                }}
              />
              <Label htmlFor="is_registered" className="cursor-pointer">
                已注册
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_banned"
                checked={isBanned}
                onCheckedChange={(checked) => {
                  if (checked === true) {
                    setIsBanned(true)
                    setIsRegistered(false) // 封禁时自动取消注册
                  } else {
                    setIsBanned(false)
                  }
                }}
              />
              <Label htmlFor="is_banned" className="cursor-pointer">
                已封禁
              </Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
