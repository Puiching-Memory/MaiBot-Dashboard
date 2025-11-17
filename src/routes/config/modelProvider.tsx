import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Pencil, Trash2, Save, Eye, EyeOff, Copy, Search } from 'lucide-react'
import { getModelConfig, updateModelConfig, updateModelConfigSection } from '@/lib/config-api'
import { useToast } from '@/hooks/use-toast'

interface APIProvider {
  name: string
  base_url: string
  api_key: string
  client_type: string
  max_retry: number
  timeout: number
  retry_interval: number
}

export function ModelProviderConfigPage() {
  const [providers, setProviders] = useState<APIProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState<APIProvider | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null)
  const [showApiKey, setShowApiKey] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { toast } = useToast()
  
  // 用于防抖的定时器
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialLoadRef = useRef(true)

  // 加载配置
  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const config = await getModelConfig()
      setProviders((config.api_providers as APIProvider[]) || [])
      setHasUnsavedChanges(false)
      initialLoadRef.current = false
    } catch (error) {
      console.error('加载配置失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 自动保存函数（使用增量 API）
  const autoSaveProviders = useCallback(async (newProviders: APIProvider[]) => {
    if (initialLoadRef.current) return // 初始加载时不自动保存
    
    try {
      setAutoSaving(true)
      await updateModelConfigSection('api_providers', newProviders)
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error('自动保存失败:', error)
      // 自动保存失败时不显示错误提示，避免打扰用户
      setHasUnsavedChanges(true)
    } finally {
      setAutoSaving(false)
    }
  }, [])

  // 监听 providers 变化，触发自动保存（带防抖）
  useEffect(() => {
    if (initialLoadRef.current) return

    setHasUnsavedChanges(true)

    // 清除之前的定时器
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    // 设置新的定时器（2秒后自动保存）
    autoSaveTimerRef.current = setTimeout(() => {
      autoSaveProviders(providers)
    }, 2000)

    // 清理函数
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [providers, autoSaveProviders])

  // 保存配置（手动保存，保存完整配置）
  const saveConfig = async () => {
    try {
      setSaving(true)
      
      // 先取消自动保存定时器
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }

      const config = await getModelConfig()
      config.api_providers = providers
      await updateModelConfig(config)
      setHasUnsavedChanges(false)
      toast({
        title: '保存成功',
        description: '模型提供商配置已保存',
      })
    } catch (error) {
      console.error('保存配置失败:', error)
      toast({
        title: '保存失败',
        description: (error as Error).message,
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  // 打开编辑对话框
  const openEditDialog = (provider: APIProvider | null, index: number | null) => {
    setEditingProvider(
      provider || {
        name: '',
        base_url: '',
        api_key: '',
        client_type: 'openai',
        max_retry: 2,
        timeout: 30,
        retry_interval: 10,
      }
    )
    setEditingIndex(index)
    setShowApiKey(false)
    setEditDialogOpen(true)
  }

  // 复制 API Key
  const copyApiKey = async () => {
    if (!editingProvider?.api_key) return
    try {
      await navigator.clipboard.writeText(editingProvider.api_key)
      toast({
        title: '复制成功',
        description: 'API Key 已复制到剪贴板',
      })
    } catch {
      toast({
        title: '复制失败',
        description: '无法访问剪贴板',
        variant: 'destructive',
      })
    }
  }

  // 保存编辑
  const handleSaveEdit = () => {
    if (!editingProvider) return

    if (editingIndex !== null) {
      // 更新现有提供商
      const newProviders = [...providers]
      newProviders[editingIndex] = editingProvider
      setProviders(newProviders)
    } else {
      // 添加新提供商
      setProviders([...providers, editingProvider])
    }

    setEditDialogOpen(false)
    setEditingProvider(null)
    setEditingIndex(null)
  }

  // 打开删除确认对话框
  const openDeleteDialog = (index: number) => {
    setDeletingIndex(index)
    setDeleteDialogOpen(true)
  }

  // 确认删除提供商
  const handleConfirmDelete = () => {
    if (deletingIndex !== null) {
      const newProviders = providers.filter((_, i) => i !== deletingIndex)
      setProviders(newProviders)
      toast({
        title: '删除成功',
        description: '提供商已从列表中移除',
      })
    }
    setDeleteDialogOpen(false)
    setDeletingIndex(null)
  }

  // 过滤提供商列表
  const filteredProviders = providers.filter((provider) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      provider.name.toLowerCase().includes(query) ||
      provider.base_url.toLowerCase().includes(query) ||
      provider.client_type.toLowerCase().includes(query)
    )
  })

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl space-y-4 sm:space-y-6">
      {/* 页面标题 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">模型提供商配置</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">管理 API 提供商配置</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={() => openEditDialog(null, null)} size="sm" className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" strokeWidth={2} fill="none" />
            添加提供商
          </Button>
          <Button 
            onClick={saveConfig} 
            disabled={saving || autoSaving || !hasUnsavedChanges} 
            size="sm" 
            variant="default"
            className="w-full sm:w-auto"
          >
            <Save className="mr-2 h-4 w-4" strokeWidth={2} fill="none" />
            {saving ? '保存中...' : autoSaving ? '自动保存中...' : hasUnsavedChanges ? '保存配置' : '已保存'}
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-260px)]">
        {/* 搜索框 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-4">
          <div className="relative w-full sm:flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索提供商名称、URL 或类型..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {searchQuery && (
            <p className="text-sm text-muted-foreground whitespace-nowrap">
              找到 {filteredProviders.length} 个结果
            </p>
          )}
        </div>

        {/* 提供商列表 - 移动端卡片视图 */}
        <div className="md:hidden space-y-3">
          {filteredProviders.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 rounded-lg border bg-card">
              {searchQuery ? '未找到匹配的提供商' : '暂无提供商配置，点击"添加提供商"开始配置'}
            </div>
          ) : (
            filteredProviders.map((provider, index) => (
              <div key={index} className="rounded-lg border bg-card p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base truncate">{provider.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 break-all">{provider.base_url}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(provider, index)}
                    >
                      <Pencil className="h-4 w-4" strokeWidth={2} fill="none" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDeleteDialog(index)}
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={2} fill="none" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs">客户端类型</span>
                    <p className="font-medium">{provider.client_type}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">最大重试</span>
                    <p className="font-medium">{provider.max_retry}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">超时(秒)</span>
                    <p className="font-medium">{provider.timeout}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">重试间隔(秒)</span>
                    <p className="font-medium">{provider.retry_interval}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 提供商列表 - 桌面端表格视图 */}
        <div className="hidden md:block rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名称</TableHead>
                <TableHead>基础URL</TableHead>
                <TableHead>客户端类型</TableHead>
                <TableHead className="text-right">最大重试</TableHead>
                <TableHead className="text-right">超时(秒)</TableHead>
                <TableHead className="text-right">重试间隔(秒)</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProviders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    {searchQuery ? '未找到匹配的提供商' : '暂无提供商配置，点击"添加提供商"开始配置'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredProviders.map((provider, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{provider.name}</TableCell>
                    <TableCell className="max-w-xs truncate" title={provider.base_url}>
                      {provider.base_url}
                    </TableCell>
                    <TableCell>{provider.client_type}</TableCell>
                    <TableCell className="text-right">{provider.max_retry}</TableCell>
                    <TableCell className="text-right">{provider.timeout}</TableCell>
                    <TableCell className="text-right">{provider.retry_interval}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(provider, index)}
                        >
                          <Pencil className="h-4 w-4" strokeWidth={2} fill="none" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(index)}
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={2} fill="none" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </ScrollArea>

      {/* 编辑对话框 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null ? '编辑提供商' : '添加提供商'}
            </DialogTitle>
            <DialogDescription>
              配置 API 提供商的连接信息和参数
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">名称 *</Label>
              <Input
                id="name"
                value={editingProvider?.name || ''}
                onChange={(e) =>
                  setEditingProvider((prev) =>
                    prev ? { ...prev, name: e.target.value } : null
                  )
                }
                placeholder="例如: DeepSeek, SiliconFlow"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="base_url">基础 URL *</Label>
              <Input
                id="base_url"
                value={editingProvider?.base_url || ''}
                onChange={(e) =>
                  setEditingProvider((prev) =>
                    prev ? { ...prev, base_url: e.target.value } : null
                  )
                }
                placeholder="https://api.example.com/v1"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="api_key">API Key *</Label>
              <div className="flex gap-2">
                <Input
                  id="api_key"
                  type={showApiKey ? 'text' : 'password'}
                  value={editingProvider?.api_key || ''}
                  onChange={(e) =>
                    setEditingProvider((prev) =>
                      prev ? { ...prev, api_key: e.target.value } : null
                    )
                  }
                  placeholder="sk-..."
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowApiKey(!showApiKey)}
                  title={showApiKey ? '隐藏密钥' : '显示密钥'}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={copyApiKey}
                  title="复制密钥"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="client_type">客户端类型</Label>
              <Select
                value={editingProvider?.client_type || 'openai'}
                onValueChange={(value) =>
                  setEditingProvider((prev) =>
                    prev ? { ...prev, client_type: value } : null
                  )
                }
              >
                <SelectTrigger id="client_type">
                  <SelectValue placeholder="选择客户端类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="gemini">Gemini</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="max_retry">最大重试</Label>
                <Input
                  id="max_retry"
                  type="number"
                  min="0"
                  value={editingProvider?.max_retry || 2}
                  onChange={(e) =>
                    setEditingProvider((prev) =>
                      prev ? { ...prev, max_retry: parseInt(e.target.value) } : null
                    )
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="timeout">超时(秒)</Label>
                <Input
                  id="timeout"
                  type="number"
                  min="1"
                  value={editingProvider?.timeout || 30}
                  onChange={(e) =>
                    setEditingProvider((prev) =>
                      prev ? { ...prev, timeout: parseInt(e.target.value) } : null
                    )
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="retry_interval">重试间隔(秒)</Label>
                <Input
                  id="retry_interval"
                  type="number"
                  min="1"
                  value={editingProvider?.retry_interval || 10}
                  onChange={(e) =>
                    setEditingProvider((prev) =>
                      prev
                        ? { ...prev, retry_interval: parseInt(e.target.value) }
                        : null
                    )
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveEdit}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除提供商 "{deletingIndex !== null ? providers[deletingIndex]?.name : ''}" 吗？
              此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
