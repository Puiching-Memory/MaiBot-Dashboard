import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Pencil, Trash2, Save, Eye, EyeOff, Copy, Search, Info, Power, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Check, ChevronsUpDown, HelpCircle } from 'lucide-react'
import { getModelConfig, updateModelConfig, updateModelConfigSection } from '@/lib/config-api'
import { restartMaiBot } from '@/lib/system-api'
import { useToast } from '@/hooks/use-toast'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useTour } from '@/components/tour'
import { MODEL_ASSIGNMENT_TOUR_ID, modelAssignmentTourSteps, STEP_ROUTE_MAP } from '@/components/tour/tours/model-assignment-tour'
import { useNavigate } from '@tanstack/react-router'
import { RestartingOverlay } from '@/components/RestartingOverlay'
import { PROVIDER_TEMPLATES } from './providerTemplates'

interface APIProvider {
  name: string
  base_url: string
  api_key: string
  client_type: string
  max_retry: number | null
  timeout: number | null
  retry_interval: number | null
}

export function ModelProviderConfigPage() {
  const [providers, setProviders] = useState<APIProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [restarting, setRestarting] = useState(false)
  const [showRestartOverlay, setShowRestartOverlay] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState<APIProvider | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('custom')
  const [templateComboboxOpen, setTemplateComboboxOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null)
  const [showApiKey, setShowApiKey] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProviders, setSelectedProviders] = useState<Set<number>>(new Set())
  const [batchDeleteDialogOpen, setBatchDeleteDialogOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [jumpToPage, setJumpToPage] = useState('')
  const { toast } = useToast()
  const navigate = useNavigate()
  const { state: tourState, goToStep, registerTour } = useTour()
  
  // 用于防抖的定时器
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialLoadRef = useRef(true)

  // 注册 Tour（确保跨页导航时 Tour 仍然可用）
  useEffect(() => {
    registerTour(MODEL_ASSIGNMENT_TOUR_ID, modelAssignmentTourSteps)
  }, [registerTour])

  // 监听 Tour 步骤变化，处理页面导航
  useEffect(() => {
    if (tourState.activeTourId === MODEL_ASSIGNMENT_TOUR_ID && tourState.isRunning) {
      const targetRoute = STEP_ROUTE_MAP[tourState.stepIndex]
      if (targetRoute && !window.location.pathname.endsWith(targetRoute.replace('/config/', ''))) {
        navigate({ to: targetRoute })
      }
    }
  }, [tourState.stepIndex, tourState.activeTourId, tourState.isRunning, navigate])

  // 监听 Tour 步骤变化，当从弹窗内步骤回退到弹窗外步骤时，自动关闭弹窗
  // 提供商弹窗步骤: 3-9 (index 3-9)，弹窗外步骤: 0-2 (index 0-2)
  const prevTourStepRef = useRef(tourState.stepIndex)
  useEffect(() => {
    if (tourState.activeTourId === MODEL_ASSIGNMENT_TOUR_ID && tourState.isRunning) {
      const prevStep = prevTourStepRef.current
      const currentStep = tourState.stepIndex
      
      // 如果从弹窗内步骤 (3-9) 回退到弹窗外步骤 (0-2)，关闭弹窗
      if (prevStep >= 3 && prevStep <= 9 && currentStep < 3) {
        setEditDialogOpen(false)
      }
      
      prevTourStepRef.current = currentStep
    }
  }, [tourState.stepIndex, tourState.activeTourId, tourState.isRunning])

  // 处理 Tour 中需要用户点击才能继续的步骤
  useEffect(() => {
    if (tourState.activeTourId !== MODEL_ASSIGNMENT_TOUR_ID || !tourState.isRunning) return

    const handleTourClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const currentStep = tourState.stepIndex

      // Step 3 (index 2): 点击添加提供商按钮
      if (currentStep === 2 && target.closest('[data-tour="add-provider-button"]')) {
        setTimeout(() => goToStep(3), 300)
      }
      // Step 10 (index 9): 点击取消按钮（关闭提供商弹窗）
      else if (currentStep === 9 && target.closest('[data-tour="provider-cancel-button"]')) {
        setTimeout(() => goToStep(10), 300)
      }
    }

    document.addEventListener('click', handleTourClick, true)
    return () => document.removeEventListener('click', handleTourClick, true)
  }, [tourState, goToStep])

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

  // 重启麦麦
  const handleRestart = async () => {
    try {
      setRestarting(true)
      // 发送重启请求（不等待响应，因为服务器会立即关闭）
      restartMaiBot().catch(() => {
        // 忽略网络错误，这是预期行为
      })
      // 立即显示遮罩层并开始状态检测
      setShowRestartOverlay(true)
    } catch (error) {
      console.error('重启失败:', error)
      setShowRestartOverlay(false)
      toast({
        title: '重启失败',
        description: '无法发送重启请求，请手动重启',
        variant: 'destructive',
      })
      setRestarting(false)
    }
  }

  // 保存并重启
  const handleSaveAndRestart = async () => {
    try {
      setSaving(true)
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
      const config = await getModelConfig()
      config.api_providers = providers
      await updateModelConfig(config)
      setHasUnsavedChanges(false)
      toast({
        title: '保存成功',
        description: '正在重启麦麦...',
      })
      await handleRestart()
    } catch (error) {
      console.error('保存配置失败:', error)
      toast({
        title: '保存失败',
        description: (error as Error).message,
        variant: 'destructive',
      })
      setSaving(false)
    }
  }

  // 重启完成回调
  const handleRestartComplete = () => {
    // 清除token，避免自动登录
    localStorage.removeItem('access-token')
    window.location.href = '/auth'
  }

  // 重启失败回调
  const handleRestartFailed = () => {
    setShowRestartOverlay(false)
    setRestarting(false)
    toast({
      title: '重启超时',
      description: '服务未能在预期时间内恢复，请手动检查或刷新页面',
      variant: 'destructive',
    })
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
    if (provider) {
      // 编辑现有提供商 - 检测匹配的模板
      const matchedTemplate = PROVIDER_TEMPLATES.find(
        t => t.base_url === provider.base_url && t.client_type === provider.client_type
      )
      setSelectedTemplate(matchedTemplate?.id || 'custom')
      setEditingProvider(provider)
    } else {
      // 新建提供商 - 默认使用自定义模板
      setSelectedTemplate('custom')
      setEditingProvider({
        name: '',
        base_url: '',
        api_key: '',
        client_type: 'openai',
        max_retry: 2,
        timeout: 30,
        retry_interval: 10,
      })
    }
    setEditingIndex(index)
    setShowApiKey(false)
    setEditDialogOpen(true)
  }
  
  // 处理模板选择变化
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId)
    setTemplateComboboxOpen(false)
    const template = PROVIDER_TEMPLATES.find(t => t.id === templateId)
    if (template && template.id !== 'custom') {
      // 应用模板配置
      setEditingProvider(prev => ({
        ...prev!,
        name: template.name,
        base_url: template.base_url,
        client_type: template.client_type,
      }))
    } else if (template?.id === 'custom') {
      // 切换到自定义模板 - 清空URL和客户端类型(保留其他字段)
      setEditingProvider(prev => ({
        ...prev!,
        name: '',
        base_url: '',
        client_type: 'openai',
      }))
    }
  }
  
  // 判断当前是否使用模板(非自定义)
  const isUsingTemplate = useMemo(() => {
    return selectedTemplate !== 'custom'
  }, [selectedTemplate])

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

    // 填充空值的默认值
    const providerToSave = {
      ...editingProvider,
      max_retry: editingProvider.max_retry ?? 2,
      timeout: editingProvider.timeout ?? 30,
      retry_interval: editingProvider.retry_interval ?? 10,
    }

    if (editingIndex !== null) {
      // 更新现有提供商
      const newProviders = [...providers]
      newProviders[editingIndex] = providerToSave
      setProviders(newProviders)
    } else {
      // 添加新提供商
      setProviders([...providers, providerToSave])
    }

    setEditDialogOpen(false)
    setEditingProvider(null)
    setEditingIndex(null)
  }

  // 处理编辑对话框关闭
  const handleEditDialogClose = (open: boolean) => {
    if (!open && editingProvider) {
      // 关闭时填充默认值
      const updatedProvider = {
        ...editingProvider,
        max_retry: editingProvider.max_retry ?? 2,
        timeout: editingProvider.timeout ?? 30,
        retry_interval: editingProvider.retry_interval ?? 10,
      }
      setEditingProvider(updatedProvider)
    }
    setEditDialogOpen(open)
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

  // 切换单个提供商选择
  const toggleProviderSelection = (index: number) => {
    const newSelected = new Set(selectedProviders)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedProviders(newSelected)
  }

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedProviders.size === filteredProviders.length) {
      setSelectedProviders(new Set())
    } else {
      const allIndices = filteredProviders.map((_, idx) => 
        providers.findIndex(p => p === filteredProviders[idx])
      )
      setSelectedProviders(new Set(allIndices))
    }
  }

  // 打开批量删除确认对话框
  const openBatchDeleteDialog = () => {
    if (selectedProviders.size === 0) {
      toast({
        title: '提示',
        description: '请先选择要删除的提供商',
        variant: 'default',
      })
      return
    }
    setBatchDeleteDialogOpen(true)
  }

  // 确认批量删除
  const handleConfirmBatchDelete = () => {
    const newProviders = providers.filter((_, index) => !selectedProviders.has(index))
    setProviders(newProviders)
    setSelectedProviders(new Set())
    setBatchDeleteDialogOpen(false)
    toast({
      title: '批量删除成功',
      description: `已删除 ${selectedProviders.size} 个提供商`,
    })
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

  // 分页逻辑
  const totalPages = Math.ceil(filteredProviders.length / pageSize)
  const paginatedProviders = filteredProviders.slice(
    (page - 1) * pageSize,
    page * pageSize
  )

  // 页码跳转
  const handleJumpToPage = () => {
    const targetPage = parseInt(jumpToPage)
    if (targetPage >= 1 && targetPage <= totalPages) {
      setPage(targetPage)
      setJumpToPage('')
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* 页面标题 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">AI模型厂商配置</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">管理 AI 模型厂商的 API 配置</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {selectedProviders.size > 0 && (
            <Button 
              onClick={openBatchDeleteDialog} 
              size="sm" 
              variant="destructive" 
              className="w-full sm:w-auto"
            >
              <Trash2 className="mr-2 h-4 w-4" strokeWidth={2} fill="none" />
              批量删除 ({selectedProviders.size})
            </Button>
          )}
          <Button onClick={() => openEditDialog(null, null)} size="sm" className="w-full sm:w-auto" data-tour="add-provider-button">
            <Plus className="mr-2 h-4 w-4" strokeWidth={2} fill="none" />
            添加提供商
          </Button>
          <Button 
            onClick={saveConfig} 
            disabled={saving || autoSaving || !hasUnsavedChanges || restarting} 
            size="sm" 
            variant="outline"
            className="w-full sm:w-auto sm:min-w-[120px]"
          >
            <Save className="mr-2 h-4 w-4" strokeWidth={2} fill="none" />
            {saving ? '保存中...' : autoSaving ? '自动保存中...' : hasUnsavedChanges ? '保存配置' : '已保存'}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={saving || autoSaving || restarting}
                size="sm"
                className="w-full sm:w-auto sm:min-w-[120px]"
              >
                <Power className="mr-2 h-4 w-4" />
                {restarting ? '重启中...' : hasUnsavedChanges ? '保存并重启' : '重启麦麦'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认重启麦麦？</AlertDialogTitle>
                <AlertDialogDescription className="space-y-3" asChild>
                  <div>
                    <p>
                      {hasUnsavedChanges 
                        ? '当前有未保存的配置更改。点击确认将先保存配置,然后重启麦麦使新配置生效。重启过程中麦麦将暂时离线。'
                        : '即将重启麦麦主程序。重启过程中麦麦将暂时离线,配置将在重启后生效。'
                      }
                    </p>
                    <Alert className="border-yellow-500/50 bg-yellow-500/10">
                      <Info className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-900 dark:text-yellow-100">
                        <strong>重要提示:</strong>由于技术原因,使用重启功能后,将无法再使用 <code className="px-1 py-0.5 bg-yellow-200 dark:bg-yellow-900 rounded">Ctrl+C</code> 结束程序。
                        <Dialog>
                          <DialogTrigger asChild>
                            <button className="ml-1 text-yellow-700 dark:text-yellow-300 underline hover:text-yellow-800 dark:hover:text-yellow-200 inline-flex items-center gap-1">
                              <HelpCircle className="h-3 w-3" />
                              如何结束程序？
                            </button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>如何结束使用重启功能后的麦麦程序</DialogTitle>
                              <DialogDescription>
                                由于重启功能会使程序脱离终端控制，需要通过系统命令来结束进程
                              </DialogDescription>
                            </DialogHeader>
                            <Tabs defaultValue="windows" className="w-full">
                              <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="windows">Windows</TabsTrigger>
                                <TabsTrigger value="macos">macOS</TabsTrigger>
                                <TabsTrigger value="linux">Linux</TabsTrigger>
                              </TabsList>
                              <TabsContent value="windows" className="space-y-4 mt-4">
                                <div className="space-y-2">
                                  <h4 className="font-semibold">方法一：使用任务管理器</h4>
                                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                                    <li>按 <code className="px-1 py-0.5 bg-muted rounded">Ctrl + Shift + Esc</code> 打开任务管理器</li>
                                    <li>在“进程”或“详细信息”标签页中找到 <code className="px-1 py-0.5 bg-muted rounded">python.exe</code></li>
                                    <li>右键点击并选择“结束任务”</li>
                                  </ol>
                                </div>
                                <div className="space-y-2">
                                  <h4 className="font-semibold">方法二：使用命令行</h4>
                                  <p className="text-sm text-muted-foreground">打开 PowerShell 或命令提示符，执行以下命令：</p>
                                  <div className="bg-muted p-3 rounded-md font-mono text-sm">
                                    <p># 查找麦麦进程</p>
                                    <p>Get-Process python | Where-Object &#123;$_.MainWindowTitle -eq ""&#125;</p>
                                    <p className="mt-2"># 结束所有 Python 进程（谨慎使用）</p>
                                    <p>Stop-Process -Name python -Force</p>
                                  </div>
                                </div>
                              </TabsContent>
                              <TabsContent value="macos" className="space-y-4 mt-4">
                                <div className="space-y-2">
                                  <h4 className="font-semibold">方法一：使用活动监视器</h4>
                                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                                    <li>按 <code className="px-1 py-0.5 bg-muted rounded">Cmd + Space</code> 打开 Spotlight，搜索“活动监视器”</li>
                                    <li>在进程列表中找到 <code className="px-1 py-0.5 bg-muted rounded">Python</code></li>
                                    <li>选中后点击左上角的 X 按钮结束进程</li>
                                  </ol>
                                </div>
                                <div className="space-y-2">
                                  <h4 className="font-semibold">方法二：使用终端</h4>
                                  <p className="text-sm text-muted-foreground">打开终端，执行以下命令：</p>
                                  <div className="bg-muted p-3 rounded-md font-mono text-sm">
                                    <p># 查找麦麦进程</p>
                                    <p>ps aux | grep python | grep -v grep</p>
                                    <p className="mt-2"># 结束指定 PID 的进程</p>
                                    <p>kill -9 &lt;PID&gt;</p>
                                    <p className="mt-2"># 或结束所有 Python 进程（谨慎使用）</p>
                                    <p>pkill -9 python</p>
                                  </div>
                                </div>
                              </TabsContent>
                              <TabsContent value="linux" className="space-y-4 mt-4">
                                <div className="space-y-2">
                                  <h4 className="font-semibold">使用终端命令</h4>
                                  <p className="text-sm text-muted-foreground">打开终端，执行以下命令：</p>
                                  <div className="bg-muted p-3 rounded-md font-mono text-sm">
                                    <p># 查找麦麦进程</p>
                                    <p>ps aux | grep python | grep -v grep</p>
                                    <p className="mt-2"># 结束指定 PID 的进程</p>
                                    <p>kill -9 &lt;PID&gt;</p>
                                    <p className="mt-2"># 或使用 pkill 按名称结束</p>
                                    <p>pkill -9 -f "bot.py"</p>
                                    <p className="mt-2"># 或结束所有 Python 进程（谨慎使用）</p>
                                    <p>pkill -9 python</p>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <h4 className="font-semibold">使用 htop（如已安装）</h4>
                                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                                    <li>在终端输入 <code className="px-1 py-0.5 bg-muted rounded">htop</code></li>
                                    <li>按 <code className="px-1 py-0.5 bg-muted rounded">F3</code> 搜索 python</li>
                                    <li>按 <code className="px-1 py-0.5 bg-muted rounded">F9</code> 发送信号，选择 SIGKILL</li>
                                  </ol>
                                </div>
                              </TabsContent>
                            </Tabs>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button variant="outline">关闭</Button>
                              </DialogClose>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </AlertDescription>
                    </Alert>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction onClick={hasUnsavedChanges ? handleSaveAndRestart : handleRestart}>
                  {hasUnsavedChanges ? '保存并重启' : '确认重启'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* 重启提示 */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          配置更新后需要<strong>重启麦麦</strong>才能生效。你可以点击右上角的"保存并重启"按钮一键完成保存和重启。
        </AlertDescription>
      </Alert>

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
            paginatedProviders.map((provider, displayIndex) => {
              const actualIndex = providers.findIndex(p => p === provider)
              return (
              <div key={displayIndex} className="rounded-lg border bg-card p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base truncate">{provider.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 break-all">{provider.base_url}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => openEditDialog(provider, actualIndex)}
                    >
                      <Pencil className="h-4 w-4 mr-1" strokeWidth={2} fill="none" />
                      编辑
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => openDeleteDialog(actualIndex)}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Trash2 className="h-4 w-4 mr-1" strokeWidth={2} fill="none" />
                      删除
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
              )
            })
          )}
        </div>

        {/* 提供商列表 - 桌面端表格视图 */}
        <div className="hidden md:block rounded-lg border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedProviders.size === filteredProviders.length && filteredProviders.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
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
              {paginatedProviders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    {searchQuery ? '未找到匹配的提供商' : '暂无提供商配置，点击"添加提供商"开始配置'}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedProviders.map((provider, displayIndex) => {
                  const actualIndex = providers.findIndex(p => p === provider)
                  return (
                    <TableRow key={displayIndex}>
                      <TableCell>
                        <Checkbox
                          checked={selectedProviders.has(actualIndex)}
                          onCheckedChange={() => toggleProviderSelection(actualIndex)}
                        />
                      </TableCell>
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
                            variant="default"
                            size="sm"
                            onClick={() => openEditDialog(provider, actualIndex)}
                          >
                            <Pencil className="h-4 w-4 mr-1" strokeWidth={2} fill="none" />
                            编辑
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => openDeleteDialog(actualIndex)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            <Trash2 className="h-4 w-4 mr-1" strokeWidth={2} fill="none" />
                            删除
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
          </div>
        </div>

        {/* 分页 - 增强版 */}
        {filteredProviders.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="page-size-provider" className="text-sm whitespace-nowrap">每页显示</Label>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => {
                  setPageSize(parseInt(value))
                  setPage(1)
                  setSelectedProviders(new Set())
                }}
              >
                <SelectTrigger id="page-size-provider" className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">
                显示 {(page - 1) * pageSize + 1} 到{' '}
                {Math.min(page * pageSize, filteredProviders.length)} 条，共 {filteredProviders.length} 条
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="hidden sm:flex"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">上一页</span>
              </Button>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={jumpToPage}
                  onChange={(e) => setJumpToPage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleJumpToPage()}
                  placeholder={page.toString()}
                  className="w-16 h-8 text-center"
                  min={1}
                  max={totalPages}
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages}
              >
                <span className="hidden sm:inline">下一页</span>
                <ChevronRight className="h-4 w-4 sm:ml-1" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(totalPages)}
                disabled={page >= totalPages}
                className="hidden sm:flex"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </ScrollArea>

      {/* 编辑对话框 */}
      <Dialog open={editDialogOpen} onOpenChange={handleEditDialogClose}>
        <DialogContent 
          className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto" 
          data-tour="provider-dialog"
          preventOutsideClose={tourState.isRunning}
        >
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null ? '编辑提供商' : '添加提供商'}
            </DialogTitle>
            <DialogDescription>
              配置 API 提供商的连接信息和参数
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }} autoComplete="off">
          <div className="grid gap-4 py-4">
            <div className="grid gap-2" data-tour="provider-template-select">
              <Label htmlFor="template">提供商模板</Label>
              <Popover open={templateComboboxOpen} onOpenChange={setTemplateComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={templateComboboxOpen}
                    className="w-full justify-between"
                  >
                    {selectedTemplate
                      ? PROVIDER_TEMPLATES.find((template) => template.id === selectedTemplate)?.display_name
                      : "选择提供商模板..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start" style={{ width: 'var(--radix-popover-trigger-width)' }}>
                  <Command>
                    <CommandInput placeholder="搜索提供商模板..." />
                    <ScrollArea className="h-[300px]">
                      <CommandList className="max-h-none overflow-visible">
                        <CommandEmpty>未找到匹配的模板</CommandEmpty>
                        <CommandGroup>
                          {PROVIDER_TEMPLATES.map((template) => (
                            <CommandItem
                              key={template.id}
                              value={template.display_name}
                              onSelect={() => handleTemplateChange(template.id)}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  selectedTemplate === template.id ? "opacity-100" : "opacity-0"
                                }`}
                              />
                              {template.display_name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </ScrollArea>
                  </Command>
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                选择预设模板可自动填充 URL 和客户端类型,支持搜索
              </p>
            </div>

            <div className="grid gap-2" data-tour="provider-name-input">
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

            <div className="grid gap-2" data-tour="provider-url-input">
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
                disabled={isUsingTemplate}
                className={isUsingTemplate ? 'bg-muted cursor-not-allowed' : ''}
              />
              {isUsingTemplate && (
                <p className="text-xs text-muted-foreground">
                  使用模板时 URL 不可编辑,切换到"自定义"以手动配置
                </p>
              )}
            </div>

            <div className="grid gap-2" data-tour="provider-apikey-input">
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
                disabled={isUsingTemplate}
              >
                <SelectTrigger id="client_type" className={isUsingTemplate ? 'bg-muted cursor-not-allowed' : ''}>
                  <SelectValue placeholder="选择客户端类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="gemini">Gemini</SelectItem>
                </SelectContent>
              </Select>
              {isUsingTemplate && (
                <p className="text-xs text-muted-foreground">
                  使用模板时客户端类型不可编辑,切换到"自定义"以手动配置
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="max_retry">最大重试</Label>
                <Input
                  id="max_retry"
                  type="number"
                  min="0"
                  value={editingProvider?.max_retry ?? ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? null : parseInt(e.target.value)
                    setEditingProvider((prev) =>
                      prev ? { ...prev, max_retry: val } : null
                    )
                  }}
                  placeholder="默认: 2"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="timeout">超时(秒)</Label>
                <Input
                  id="timeout"
                  type="number"
                  min="1"
                  value={editingProvider?.timeout ?? ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? null : parseInt(e.target.value)
                    setEditingProvider((prev) =>
                      prev ? { ...prev, timeout: val } : null
                    )
                  }}
                  placeholder="默认: 30"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="retry_interval">重试间隔(秒)</Label>
                <Input
                  id="retry_interval"
                  type="number"
                  min="1"
                  value={editingProvider?.retry_interval ?? ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? null : parseInt(e.target.value)
                    setEditingProvider((prev) =>
                      prev
                        ? { ...prev, retry_interval: val }
                        : null
                    )
                  }}
                  placeholder="默认: 10"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)} data-tour="provider-cancel-button">
              取消
            </Button>
            <Button type="submit" data-tour="provider-save-button">保存</Button>
          </DialogFooter>
          </form>
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

      {/* 批量删除确认对话框 */}
      <AlertDialog open={batchDeleteDialogOpen} onOpenChange={setBatchDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认批量删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除选中的 {selectedProviders.size} 个提供商吗？
              此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmBatchDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              批量删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 重启遮罩层 */}
      {showRestartOverlay && (
        <RestartingOverlay 
          onRestartComplete={handleRestartComplete}
          onRestartFailed={handleRestartFailed}
        />
      )}
    </div>
  )
}
