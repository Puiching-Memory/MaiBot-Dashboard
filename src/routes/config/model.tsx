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
import { Switch } from '@/components/ui/switch'
import { Plus, Pencil, Trash2, Save, Search } from 'lucide-react'
import { getModelConfig, updateModelConfig, updateModelConfigSection } from '@/lib/config-api'
import { useToast } from '@/hooks/use-toast'
import { MultiSelect } from '@/components/ui/multi-select'

interface ModelInfo {
  model_identifier: string
  name: string
  api_provider: string
  price_in: number
  price_out: number
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
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingModel, setEditingModel] = useState<ModelInfo | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const { toast } = useToast()

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

    if (editingIndex !== null) {
      const newModels = [...models]
      newModels[editingIndex] = editingModel
      setModels(newModels)
    } else {
      setModels([...models, editingModel])
    }

    setEditDialogOpen(false)
    setEditingModel(null)
    setEditingIndex(null)
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
      toast({
        title: '删除成功',
        description: '模型已从列表中移除',
      })
    }
    setDeleteDialogOpen(false)
    setDeletingIndex(null)
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
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">模型配置</h1>
          <p className="text-muted-foreground mt-2">管理模型和任务配置</p>
        </div>
        <Button onClick={saveConfig} disabled={saving || autoSaving || !hasUnsavedChanges} size="sm">
          <Save className="mr-2 h-4 w-4" strokeWidth={2} fill="none" />
          {saving ? '保存中...' : autoSaving ? '自动保存中...' : hasUnsavedChanges ? '保存配置' : '已保存'}
        </Button>
      </div>

      {/* 标签页 */}
      <Tabs defaultValue="models" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="models">模型配置</TabsTrigger>
          <TabsTrigger value="tasks">模型任务配置</TabsTrigger>
        </TabsList>

        <ScrollArea className="h-[calc(100vh-320px)]">
          {/* 模型配置标签页 */}
          <TabsContent value="models" className="space-y-4 mt-0">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                配置可用的模型列表
              </p>
              <Button onClick={() => openEditDialog(null, null)} size="sm" variant="outline">
                <Plus className="mr-2 h-4 w-4" strokeWidth={2} fill="none" />
                添加模型
              </Button>
            </div>

          {/* 搜索框 */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索模型名称、标识符或提供商..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {searchQuery && (
              <p className="text-sm text-muted-foreground">
                找到 {filteredModels.length} 个结果
              </p>
            )}
          </div>

          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
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
                {filteredModels.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      {searchQuery ? '未找到匹配的模型' : '暂无模型配置'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredModels.map((model, index) => (
                    <TableRow key={index}>
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
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(model, index)}
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
        </TabsContent>

        {/* 模型任务配置标签页 */}
        <TabsContent value="tasks" className="space-y-6">
          <p className="text-sm text-muted-foreground">
            为不同的任务配置使用的模型和参数
          </p>

          {taskConfig && (
            <div className="grid gap-6">
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
        </ScrollArea>
      </Tabs>

      {/* 编辑模型对话框 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
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

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price_in">输入价格 (¥/M token)</Label>
                <Input
                  id="price_in"
                  type="number"
                  step="0.1"
                  min="0"
                  value={editingModel?.price_in || 0}
                  onChange={(e) =>
                    setEditingModel((prev) =>
                      prev
                        ? { ...prev, price_in: parseFloat(e.target.value) }
                        : null
                    )
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="price_out">输出价格 (¥/M token)</Label>
                <Input
                  id="price_out"
                  type="number"
                  step="0.1"
                  min="0"
                  value={editingModel?.price_out || 0}
                  onChange={(e) =>
                    setEditingModel((prev) =>
                      prev
                        ? { ...prev, price_out: parseFloat(e.target.value) }
                        : null
                    )
                  }
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
    </div>
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
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <div>
        <h4 className="font-semibold">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
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
        <div className="grid grid-cols-2 gap-4">
          {!hideTemperature && (
            <div className="grid gap-2">
              <Label>温度</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={taskConfig.temperature || 0.3}
                onChange={(e) =>
                  onChange('temperature', parseFloat(e.target.value))
                }
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
                value={taskConfig.max_tokens || 1024}
                onChange={(e) => onChange('max_tokens', parseInt(e.target.value))}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
