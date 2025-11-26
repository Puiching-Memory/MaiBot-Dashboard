import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, Save, Search, Info, Power, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, HelpCircle } from 'lucide-react'
import { getModelConfig, updateModelConfig, updateModelConfigSection } from '@/lib/config-api'
import { restartMaiBot } from '@/lib/system-api'
import { useToast } from '@/hooks/use-toast'
import { MultiSelect } from '@/components/ui/multi-select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RestartingOverlay } from '@/components/RestartingOverlay'

interface ModelInfo {
  model_identifier: string
  name: string
  api_provider: string
  price_in: number | null
  price_out: number | null
  force_stream_mode?: boolean
  extra_params?: Record<string, unknown>
}

interface TaskConfig {
  model_list: string[]
  temperature?: number
  max_tokens?: number
}

interface ModelTaskConfig {
  utils: TaskConfig
  utils_small: TaskConfig
  tool_use: TaskConfig
  replyer: TaskConfig
  planner: TaskConfig
  vlm: TaskConfig
  voice: TaskConfig
  embedding: TaskConfig
  lpmm_entity_extract: TaskConfig
  lpmm_rdf_build: TaskConfig
  lpmm_qa: TaskConfig
}

export function ModelConfigPage() {
  const [models, setModels] = useState<ModelInfo[]>([])
  const [providers, setProviders] = useState<string[]>([])
  const [modelNames, setModelNames] = useState<string[]>([])
  const [taskConfig, setTaskConfig] = useState<ModelTaskConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [restarting, setRestarting] = useState(false)
  const [showRestartOverlay, setShowRestartOverlay] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingModel, setEditingModel] = useState<ModelInfo | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedModels, setSelectedModels] = useState<Set<number>>(new Set())
  const [batchDeleteDialogOpen, setBatchDeleteDialogOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [jumpToPage, setJumpToPage] = useState('')
  const { toast} = useToast()

  // 用于防抖的定时器
  const modelsAutoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const taskConfigAutoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialLoadRef = useRef(true)

  // 加载配置
  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const config = await getModelConfig()
      const modelList = (config.models as ModelInfo[]) || []
      setModels(modelList)
      setModelNames(modelList.map((m) => m.name))
      
      const providerList = (config.api_providers as { name: string }[]) || []
      setProviders(providerList.map((p) => p.name))
      
      setTaskConfig((config.model_task_config as ModelTaskConfig) || null)
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
      if (modelsAutoSaveTimerRef.current) {
        clearTimeout(modelsAutoSaveTimerRef.current)
      }
      if (taskConfigAutoSaveTimerRef.current) {
        clearTimeout(taskConfigAutoSaveTimerRef.current)
      }
      const config = await getModelConfig()
      config.models = models
      config.model_task_config = taskConfig
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

  // 自动保存模型列表
  const autoSaveModels = useCallback(async (newModels: ModelInfo[]) => {
    if (initialLoadRef.current) return
    
    try {
      setAutoSaving(true)
      await updateModelConfigSection('models', newModels)
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error('自动保存模型列表失败:', error)
      setHasUnsavedChanges(true)
    } finally {
      setAutoSaving(false)
    }
  }, [])

  // 自动保存任务配置
  const autoSaveTaskConfig = useCallback(async (newTaskConfig: ModelTaskConfig) => {
    if (initialLoadRef.current) return
    
    try {
      setAutoSaving(true)
      await updateModelConfigSection('model_task_config', newTaskConfig)
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error('自动保存任务配置失败:', error)
      setHasUnsavedChanges(true)
    } finally {
      setAutoSaving(false)
    }
  }, [])

  // 监听 models 变化
  useEffect(() => {
    if (initialLoadRef.current) return

    setHasUnsavedChanges(true)

    if (modelsAutoSaveTimerRef.current) {
      clearTimeout(modelsAutoSaveTimerRef.current)
    }

    modelsAutoSaveTimerRef.current = setTimeout(() => {
      autoSaveModels(models)
    }, 2000)

    return () => {
      if (modelsAutoSaveTimerRef.current) {
        clearTimeout(modelsAutoSaveTimerRef.current)
      }
    }
  }, [models, autoSaveModels])

  // 监听 taskConfig 变化
  useEffect(() => {
    if (initialLoadRef.current || !taskConfig) return

    setHasUnsavedChanges(true)

    if (taskConfigAutoSaveTimerRef.current) {
      clearTimeout(taskConfigAutoSaveTimerRef.current)
    }

    taskConfigAutoSaveTimerRef.current = setTimeout(() => {
      autoSaveTaskConfig(taskConfig)
    }, 2000)

    return () => {
      if (taskConfigAutoSaveTimerRef.current) {
        clearTimeout(taskConfigAutoSaveTimerRef.current)
      }
    }
  }, [taskConfig, autoSaveTaskConfig])

  // 保存配置（手动保存）
  const saveConfig = async () => {
    try {
      setSaving(true)
      
      // 先取消自动保存定时器
      if (modelsAutoSaveTimerRef.current) {
        clearTimeout(modelsAutoSaveTimerRef.current)
      }
      if (taskConfigAutoSaveTimerRef.current) {
        clearTimeout(taskConfigAutoSaveTimerRef.current)
      }

      const config = await getModelConfig()
      config.models = models
      config.model_task_config = taskConfig
      await updateModelConfig(config)
      setHasUnsavedChanges(false)
      toast({
        title: '保存成功',
        description: '模型配置已保存',
      })
      await loadConfig() // 重新加载以更新模型名称列表
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
  const openEditDialog = (model: ModelInfo | null, index: number | null) => {
    setEditingModel(
      model || {
        model_identifier: '',
        name: '',
        api_provider: providers[0] || '',
        price_in: 0,
        price_out: 0,
        force_stream_mode: false,
        extra_params: {},
      }
    )
    setEditingIndex(index)
    setEditDialogOpen(true)
  }

  // 保存编辑
  const handleSaveEdit = () => {
    if (!editingModel) return

    // 填充空值的默认值
    const modelToSave = {
      ...editingModel,
      price_in: editingModel.price_in ?? 0,
      price_out: editingModel.price_out ?? 0,
    }

    let newModels: ModelInfo[]
    if (editingIndex !== null) {
      newModels = [...models]
      newModels[editingIndex] = modelToSave
    } else {
      newModels = [...models, modelToSave]
    }
    
    setModels(newModels)
    // 立即更新模型名称列表
    setModelNames(newModels.map((m) => m.name))

    setEditDialogOpen(false)
    setEditingModel(null)
    setEditingIndex(null)
  }

  // 处理编辑对话框关闭
  const handleEditDialogClose = (open: boolean) => {
    if (!open && editingModel) {
      // 关闭时填充默认值
      const updatedModel = {
        ...editingModel,
        price_in: editingModel.price_in ?? 0,
        price_out: editingModel.price_out ?? 0,
      }
      setEditingModel(updatedModel)
    }
    setEditDialogOpen(open)
  }

  // 打开删除确认对话框
  const openDeleteDialog = (index: number) => {
    setDeletingIndex(index)
    setDeleteDialogOpen(true)
  }

  // 确认删除模型
  const handleConfirmDelete = () => {
    if (deletingIndex !== null) {
      const newModels = models.filter((_, i) => i !== deletingIndex)
      setModels(newModels)
      // 立即更新模型名称列表
      setModelNames(newModels.map((m) => m.name))
      toast({
        title: '删除成功',
        description: '模型已从列表中移除',
      })
    }
    setDeleteDialogOpen(false)
    setDeletingIndex(null)
  }

  // 切换单个模型选择
  const toggleModelSelection = (index: number) => {
    const newSelected = new Set(selectedModels)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedModels(newSelected)
  }

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedModels.size === filteredModels.length) {
      setSelectedModels(new Set())
    } else {
      const allIndices = filteredModels.map((_, idx) => 
        models.findIndex(m => m === filteredModels[idx])
      )
      setSelectedModels(new Set(allIndices))
    }
  }

  // 打开批量删除确认对话框
  const openBatchDeleteDialog = () => {
    if (selectedModels.size === 0) {
      toast({
        title: '提示',
        description: '请先选择要删除的模型',
        variant: 'default',
      })
      return
    }
    setBatchDeleteDialogOpen(true)
  }

  // 确认批量删除
  const handleConfirmBatchDelete = () => {
    const newModels = models.filter((_, index) => !selectedModels.has(index))
    setModels(newModels)
    // 立即更新模型名称列表
    setModelNames(newModels.map((m) => m.name))
    setSelectedModels(new Set())
    setBatchDeleteDialogOpen(false)
    toast({
      title: '批量删除成功',
      description: `已删除 ${selectedModels.size} 个模型`,
    })
  }

  // 更新任务配置
  const updateTaskConfig = (
    taskName: keyof ModelTaskConfig,
    field: keyof TaskConfig,
    value: string[] | number
  ) => {
    if (!taskConfig) return
    setTaskConfig({
      ...taskConfig,
      [taskName]: {
        ...taskConfig[taskName],
        [field]: value,
      },
    })
  }

  // 过滤模型列表
  const filteredModels = models.filter((model) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      model.name.toLowerCase().includes(query) ||
      model.model_identifier.toLowerCase().includes(query) ||
      model.api_provider.toLowerCase().includes(query)
    )
  })

  // 分页逻辑
  const totalPages = Math.ceil(filteredModels.length / pageSize)
  const paginatedModels = filteredModels.slice(
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

  // 检查模型是否被任务使用
  const isModelUsed = (modelName: string): boolean => {
    if (!taskConfig) return false
    
    const allTaskLists = [
      taskConfig.utils?.model_list || [],
      taskConfig.utils_small?.model_list || [],
      taskConfig.tool_use?.model_list || [],
      taskConfig.replyer?.model_list || [],
      taskConfig.planner?.model_list || [],
      taskConfig.vlm?.model_list || [],
      taskConfig.voice?.model_list || [],
      taskConfig.embedding?.model_list || [],
      taskConfig.lpmm_entity_extract?.model_list || [],
      taskConfig.lpmm_rdf_build?.model_list || [],
      taskConfig.lpmm_qa?.model_list || [],
    ]
    
    return allTaskLists.some(list => list.includes(modelName))
  }

  if (loading) {
    return (
      <ScrollArea className="h-full">
        <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">加载中...</p>
          </div>
        </div>
      </ScrollArea>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        {/* 页面标题 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">模型管理与分配</h1>
            <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">添加模型并为模型分配功能</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              onClick={saveConfig} 
              disabled={saving || autoSaving || !hasUnsavedChanges || restarting} 
              size="sm"
              variant="outline"
              className="flex-1 sm:flex-none"
            >
              <Save className="mr-2 h-4 w-4" strokeWidth={2} fill="none" />
              {saving ? '保存中...' : autoSaving ? '自动保存中...' : hasUnsavedChanges ? '保存配置' : '已保存'}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  disabled={saving || autoSaving || restarting}
                  size="sm"
                  className="flex-1 sm:flex-none"
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
                                      <li>在"进程"或"详细信息"标签页中找到 <code className="px-1 py-0.5 bg-muted rounded">python.exe</code></li>
                                      <li>右键点击并选择"结束任务"</li>
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
                                      <li>按 <code className="px-1 py-0.5 bg-muted rounded">Cmd + Space</code> 打开 Spotlight，搜索"活动监视器"</li>
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

        {/* 标签页 */}
        <Tabs defaultValue="models" className="w-full">
          <TabsList className="grid w-full max-w-full sm:max-w-md grid-cols-2">
            <TabsTrigger value="models">添加模型</TabsTrigger>
            <TabsTrigger value="tasks">为模型分配功能</TabsTrigger>
          </TabsList>
          {/* 模型配置标签页 */}
          <TabsContent value="models" className="space-y-4 mt-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <p className="text-sm text-muted-foreground">
                配置可用的模型列表
              </p>
              <div className="flex gap-2 w-full sm:w-auto">
                {selectedModels.size > 0 && (
                  <Button 
                    onClick={openBatchDeleteDialog} 
                    size="sm" 
                    variant="destructive" 
                    className="w-full sm:w-auto"
                  >
                    <Trash2 className="mr-2 h-4 w-4" strokeWidth={2} fill="none" />
                    批量删除 ({selectedModels.size})
                  </Button>
                )}
                <Button onClick={() => openEditDialog(null, null)} size="sm" variant="outline" className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" strokeWidth={2} fill="none" />
                  添加模型
                </Button>
              </div>
            </div>

          {/* 搜索框 */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="relative w-full sm:flex-1 sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索模型名称、标识符或提供商..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {searchQuery && (
              <p className="text-sm text-muted-foreground whitespace-nowrap">
                找到 {filteredModels.length} 个结果
              </p>
            )}
          </div>

          {/* 模型列表 - 移动端卡片视图 */}
          <div className="md:hidden space-y-3">
            {paginatedModels.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 rounded-lg border bg-card">
                {searchQuery ? '未找到匹配的模型' : '暂无模型配置'}
              </div>
            ) : (
              paginatedModels.map((model, displayIndex) => {
                const actualIndex = models.findIndex(m => m === model)
                const used = isModelUsed(model.name)
                return (
                  <div key={displayIndex} className="rounded-lg border bg-card p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-base">{model.name}</h3>
                          <Badge 
                            variant={used ? "default" : "secondary"}
                            className={used ? "bg-green-600 hover:bg-green-700" : ""}
                          >
                            {used ? '已使用' : '未使用'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground break-all" title={model.model_identifier}>
                          {model.model_identifier}
                        </p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => openEditDialog(model, actualIndex)}
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
                        <span className="text-muted-foreground text-xs">提供商</span>
                        <p className="font-medium">{model.api_provider}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">强制流式</span>
                        <p className="font-medium">{model.force_stream_mode ? '是' : '否'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">输入价格</span>
                        <p className="font-medium">¥{model.price_in}/M</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">输出价格</span>
                        <p className="font-medium">¥{model.price_out}/M</p>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* 模型列表 - 桌面端表格视图 */}
          <div className="hidden md:block rounded-lg border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedModels.size === filteredModels.length && filteredModels.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="w-24">使用状态</TableHead>
                    <TableHead>模型名称</TableHead>
                    <TableHead>模型标识符</TableHead>
                    <TableHead>提供商</TableHead>
                    <TableHead className="text-right">输入价格</TableHead>
                    <TableHead className="text-right">输出价格</TableHead>
                    <TableHead className="text-center">强制流式</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                {paginatedModels.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      {searchQuery ? '未找到匹配的模型' : '暂无模型配置'}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedModels.map((model, displayIndex) => {
                    const actualIndex = models.findIndex(m => m === model)
                    const used = isModelUsed(model.name)
                    return (
                      <TableRow key={displayIndex}>
                        <TableCell>
                          <Checkbox
                            checked={selectedModels.has(actualIndex)}
                            onCheckedChange={() => toggleModelSelection(actualIndex)}
                          />
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={used ? "default" : "secondary"}
                            className={used ? "bg-green-600 hover:bg-green-700" : ""}
                          >
                            {used ? '已使用' : '未使用'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{model.name}</TableCell>
                        <TableCell className="max-w-xs truncate" title={model.model_identifier}>
                          {model.model_identifier}
                        </TableCell>
                        <TableCell>{model.api_provider}</TableCell>
                        <TableCell className="text-right">¥{model.price_in}/M</TableCell>
                        <TableCell className="text-right">¥{model.price_out}/M</TableCell>
                        <TableCell className="text-center">
                          {model.force_stream_mode ? '是' : '否'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => openEditDialog(model, actualIndex)}
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
          {filteredModels.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="page-size-model" className="text-sm whitespace-nowrap">每页显示</Label>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => {
                    setPageSize(parseInt(value))
                    setPage(1)
                    setSelectedModels(new Set())
                  }}
                >
                  <SelectTrigger id="page-size-model" className="w-20">
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
                  {Math.min(page * pageSize, filteredModels.length)} 条，共 {filteredModels.length} 条
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
        </TabsContent>

        {/* 模型任务配置标签页 */}
        <TabsContent value="tasks" className="space-y-6 mt-0">
          <p className="text-sm text-muted-foreground">
            为不同的任务配置使用的模型和参数
          </p>

          {taskConfig && (
            <div className="grid gap-4 sm:gap-6">
              {/* Utils 任务 */}
              <TaskConfigCard
                title="组件模型 (utils)"
                description="用于表情包、取名、关系、情绪变化等组件"
                taskConfig={taskConfig.utils}
                modelNames={modelNames}
                onChange={(field, value) => updateTaskConfig('utils', field, value)}
              />

              {/* Utils Small 任务 */}
              <TaskConfigCard
                title="组件小模型 (utils_small)"
                description="消耗量较大的组件，建议使用速度较快的小模型"
                taskConfig={taskConfig.utils_small}
                modelNames={modelNames}
                onChange={(field, value) => updateTaskConfig('utils_small', field, value)}
              />

              {/* Tool Use 任务 */}
              <TaskConfigCard
                title="工具调用模型 (tool_use)"
                description="需要使用支持工具调用的模型"
                taskConfig={taskConfig.tool_use}
                modelNames={modelNames}
                onChange={(field, value) => updateTaskConfig('tool_use', field, value)}
              />

              {/* Replyer 任务 */}
              <TaskConfigCard
                title="首要回复模型 (replyer)"
                description="用于表达器和表达方式学习"
                taskConfig={taskConfig.replyer}
                modelNames={modelNames}
                onChange={(field, value) => updateTaskConfig('replyer', field, value)}
              />

              {/* Planner 任务 */}
              <TaskConfigCard
                title="决策模型 (planner)"
                description="负责决定麦麦该什么时候回复"
                taskConfig={taskConfig.planner}
                modelNames={modelNames}
                onChange={(field, value) => updateTaskConfig('planner', field, value)}
              />

              {/* VLM 任务 */}
              <TaskConfigCard
                title="图像识别模型 (vlm)"
                description="视觉语言模型"
                taskConfig={taskConfig.vlm}
                modelNames={modelNames}
                onChange={(field, value) => updateTaskConfig('vlm', field, value)}
                hideTemperature
              />

              {/* Voice 任务 */}
              <TaskConfigCard
                title="语音识别模型 (voice)"
                description="语音转文字"
                taskConfig={taskConfig.voice}
                modelNames={modelNames}
                onChange={(field, value) => updateTaskConfig('voice', field, value)}
                hideTemperature
                hideMaxTokens
              />

              {/* Embedding 任务 */}
              <TaskConfigCard
                title="嵌入模型 (embedding)"
                description="用于向量化"
                taskConfig={taskConfig.embedding}
                modelNames={modelNames}
                onChange={(field, value) => updateTaskConfig('embedding', field, value)}
                hideTemperature
                hideMaxTokens
              />

              {/* LPMM 相关任务 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">LPMM 知识库模型</h3>
                
                <TaskConfigCard
                  title="实体提取模型 (lpmm_entity_extract)"
                  description="从文本中提取实体"
                  taskConfig={taskConfig.lpmm_entity_extract}
                  modelNames={modelNames}
                  onChange={(field, value) =>
                    updateTaskConfig('lpmm_entity_extract', field, value)
                  }
                />

                <TaskConfigCard
                  title="RDF 构建模型 (lpmm_rdf_build)"
                  description="构建知识图谱"
                  taskConfig={taskConfig.lpmm_rdf_build}
                  modelNames={modelNames}
                  onChange={(field, value) =>
                    updateTaskConfig('lpmm_rdf_build', field, value)
                  }
                />

                <TaskConfigCard
                  title="问答模型 (lpmm_qa)"
                  description="知识库问答"
                  taskConfig={taskConfig.lpmm_qa}
                  modelNames={modelNames}
                  onChange={(field, value) => updateTaskConfig('lpmm_qa', field, value)}
                />
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 编辑模型对话框 */}
      <Dialog open={editDialogOpen} onOpenChange={handleEditDialogClose}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null ? '编辑模型' : '添加模型'}
            </DialogTitle>
            <DialogDescription>配置模型的基本信息和参数</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="model_name">模型名称 *</Label>
              <Input
                id="model_name"
                value={editingModel?.name || ''}
                onChange={(e) =>
                  setEditingModel((prev) =>
                    prev ? { ...prev, name: e.target.value } : null
                  )
                }
                placeholder="例如: qwen3-30b"
              />
              <p className="text-xs text-muted-foreground">
                用于在任务配置中引用此模型
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="model_identifier">模型标识符 *</Label>
              <Input
                id="model_identifier"
                value={editingModel?.model_identifier || ''}
                onChange={(e) =>
                  setEditingModel((prev) =>
                    prev ? { ...prev, model_identifier: e.target.value } : null
                  )
                }
                placeholder="Qwen/Qwen3-30B-A3B-Instruct-2507"
              />
              <p className="text-xs text-muted-foreground">
                API 提供商提供的模型 ID
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="api_provider">API 提供商 *</Label>
              <Select
                value={editingModel?.api_provider || ''}
                onValueChange={(value) =>
                  setEditingModel((prev) =>
                    prev ? { ...prev, api_provider: value } : null
                  )
                }
              >
                <SelectTrigger id="api_provider">
                  <SelectValue placeholder="选择提供商" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((provider) => (
                    <SelectItem key={provider} value={provider}>
                      {provider}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price_in">输入价格 (¥/M token)</Label>
                <Input
                  id="price_in"
                  type="number"
                  step="0.1"
                  min="0"
                  value={editingModel?.price_in ?? ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? null : parseFloat(e.target.value)
                    setEditingModel((prev) =>
                      prev
                        ? { ...prev, price_in: val }
                        : null
                    )
                  }}
                  placeholder="默认: 0"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="price_out">输出价格 (¥/M token)</Label>
                <Input
                  id="price_out"
                  type="number"
                  step="0.1"
                  min="0"
                  value={editingModel?.price_out ?? ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? null : parseFloat(e.target.value)
                    setEditingModel((prev) =>
                      prev
                        ? { ...prev, price_out: val }
                        : null
                    )
                  }}
                  placeholder="默认: 0"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="force_stream_mode"
                checked={editingModel?.force_stream_mode || false}
                onCheckedChange={(checked) =>
                  setEditingModel((prev) =>
                    prev ? { ...prev, force_stream_mode: checked } : null
                  )
                }
              />
              <Label htmlFor="force_stream_mode" className="cursor-pointer">
                强制流式输出模式
              </Label>
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
              确定要删除模型 "{deletingIndex !== null ? models[deletingIndex]?.name : ''}" 吗？
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
              确定要删除选中的 {selectedModels.size} 个模型吗？
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
    </ScrollArea>
  )
}

// 任务配置卡片组件
interface TaskConfigCardProps {
  title: string
  description: string
  taskConfig: TaskConfig
  modelNames: string[]
  onChange: (field: keyof TaskConfig, value: string[] | number) => void
  hideTemperature?: boolean
  hideMaxTokens?: boolean
}

function TaskConfigCard({
  title,
  description,
  taskConfig,
  modelNames,
  onChange,
  hideTemperature = false,
  hideMaxTokens = false,
}: TaskConfigCardProps) {
  const handleModelChange = (values: string[]) => {
    onChange('model_list', values)
  }

  return (
    <div className="rounded-lg border bg-card p-4 sm:p-6 space-y-4">
      <div>
        <h4 className="font-semibold text-base sm:text-lg">{title}</h4>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">{description}</p>
      </div>

      <div className="grid gap-4">
        {/* 模型列表 */}
        <div className="grid gap-2">
          <Label>模型列表</Label>
          <MultiSelect
            options={modelNames.map((name) => ({ label: name, value: name }))}
            selected={taskConfig.model_list || []}
            onChange={handleModelChange}
            placeholder="选择模型..."
            emptyText="暂无可用模型"
          />
        </div>

        {/* 温度和最大 Token */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {!hideTemperature && (
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <Label>温度</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={taskConfig.temperature ?? 0.3}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value)
                    if (!isNaN(value) && value >= 0 && value <= 1) {
                      onChange('temperature', value)
                    }
                  }}
                  className="w-20 h-8 text-sm"
                />
              </div>
              <Slider
                value={[taskConfig.temperature ?? 0.3]}
                onValueChange={(values) => onChange('temperature', values[0])}
                min={0}
                max={1}
                step={0.1}
                className="w-full"
              />
            </div>
          )}

          {!hideMaxTokens && (
            <div className="grid gap-2">
              <Label>最大 Token</Label>
              <Input
                type="number"
                step="1"
                min="1"
                value={taskConfig.max_tokens ?? 1024}
                onChange={(e) => onChange('max_tokens', parseInt(e.target.value))}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
