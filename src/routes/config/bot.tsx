import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Save, Plus, Trash2, Eye, Clock, FileSearch, Power, Code2, Layout, HelpCircle } from 'lucide-react'
import { getBotConfig, updateBotConfig, updateBotConfigSection, getBotConfigRaw, updateBotConfigRaw } from '@/lib/config-api'
import { restartMaiBot } from '@/lib/system-api'
import { useToast } from '@/hooks/use-toast'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info } from 'lucide-react'
import { RestartingOverlay } from '@/components/RestartingOverlay'
import { CodeEditor } from '@/components'

interface BotConfig {
  platform: string
  qq_account: string | number
  nickname: string
  platforms: string[]
  alias_names: string[]
}

interface PersonalityConfig {
  personality: string
  reply_style: string
  interest: string
  plan_style: string
  visual_style: string
  private_plan_style: string
  states: string[]
  state_probability: number
}

interface ChatConfig {
  talk_value: number
  mentioned_bot_reply: boolean
  max_context_size: number
  planner_smooth: number
  enable_talk_value_rules: boolean
  talk_value_rules: Array<{
    target: string
    time: string
    value: number
  }>
  include_planner_reasoning: boolean
}

interface ExpressionConfig {
  learning_list: Array<[string, string, string, string]>
  expression_groups: Array<string[]>
  reflect: boolean
  reflect_operator_id: string
  allow_reflect: string[]
}

interface EmojiConfig {
  emoji_chance: number
  max_reg_num: number
  do_replace: boolean
  check_interval: number
  steal_emoji: boolean
  content_filtration: boolean
  filtration_prompt: string
}

interface MemoryConfig {
  max_agent_iterations: number
}

interface ToolConfig {
  enable_tool: boolean
}

interface MoodConfig {
  enable_mood: boolean
  mood_update_threshold: number
  emotion_style: string
}

interface VoiceConfig {
  enable_asr: boolean
}

interface LPMMKnowledgeConfig {
  enable: boolean
  lpmm_mode: string
  rag_synonym_search_top_k: number
  rag_synonym_threshold: number
  info_extraction_workers: number
  qa_relation_search_top_k: number
  qa_relation_threshold: number
  qa_paragraph_search_top_k: number
  qa_paragraph_node_weight: number
  qa_ent_filter_top_k: number
  qa_ppr_damping: number
  qa_res_top_k: number
  embedding_dimension: number
}

interface KeywordRule {
  keywords?: string[]
  regex?: string[]
  reaction: string
}

interface KeywordReactionConfig {
  keyword_rules: KeywordRule[]
  regex_rules: KeywordRule[]
}

interface ResponsePostProcessConfig {
  enable_response_post_process: boolean
}

interface ChineseTypoConfig {
  enable: boolean
  error_rate: number
  min_freq: number
  tone_error_rate: number
  word_replace_rate: number
}

interface ResponseSplitterConfig {
  enable: boolean
  max_length: number
  max_sentence_num: number
  enable_kaomoji_protection: boolean
  enable_overflow_return_all: boolean
}

interface LogConfig {
  date_style: string
  log_level_style: string
  color_text: string
  log_level: string
  console_log_level: string
  file_log_level: string
  suppress_libraries: string[]
  library_log_levels: Record<string, string>
}

interface DebugConfig {
  show_prompt: boolean
  show_replyer_prompt: boolean
  show_replyer_reasoning: boolean
  show_jargon_prompt: boolean
  show_memory_prompt: boolean
  show_planner_prompt: boolean
  show_lpmm_paragraph: boolean
}

interface MaimMessageConfig {
  auth_token: string[]
  use_custom: boolean
  host: string
  port: number
  mode: string
  use_wss: boolean
  cert_file: string
  key_file: string
}

interface TelemetryConfig {
  enable: boolean
}

export function BotConfigPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [restarting, setRestarting] = useState(false)
  const [showRestartOverlay, setShowRestartOverlay] = useState(false)
  const [editMode, setEditMode] = useState<'visual' | 'source'>('visual')
  const [sourceCode, setSourceCode] = useState<string>('')
  const [hasTomlError, setHasTomlError] = useState(false)
  const { toast } = useToast()

  // 配置状态
  const [botConfig, setBotConfig] = useState<BotConfig | null>(null)
  const [personalityConfig, setPersonalityConfig] = useState<PersonalityConfig | null>(null)
  const [chatConfig, setChatConfig] = useState<ChatConfig | null>(null)
  const [expressionConfig, setExpressionConfig] = useState<ExpressionConfig | null>(null)
  const [emojiConfig, setEmojiConfig] = useState<EmojiConfig | null>(null)
  const [memoryConfig, setMemoryConfig] = useState<MemoryConfig | null>(null)
  const [toolConfig, setToolConfig] = useState<ToolConfig | null>(null)
  const [moodConfig, setMoodConfig] = useState<MoodConfig | null>(null)
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig | null>(null)
  const [lpmmConfig, setLpmmConfig] = useState<LPMMKnowledgeConfig | null>(null)
  const [keywordReactionConfig, setKeywordReactionConfig] = useState<KeywordReactionConfig | null>(null)
  const [responsePostProcessConfig, setResponsePostProcessConfig] = useState<ResponsePostProcessConfig | null>(null)
  const [chineseTypoConfig, setChineseTypoConfig] = useState<ChineseTypoConfig | null>(null)
  const [responseSplitterConfig, setResponseSplitterConfig] = useState<ResponseSplitterConfig | null>(null)
  const [logConfig, setLogConfig] = useState<LogConfig | null>(null)
  const [debugConfig, setDebugConfig] = useState<DebugConfig | null>(null)
  const [maimMessageConfig, setMaimMessageConfig] = useState<MaimMessageConfig | null>(null)
  const [telemetryConfig, setTelemetryConfig] = useState<TelemetryConfig | null>(null)

  // 用于防抖的定时器
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialLoadRef = useRef(true)
  const configRef = useRef<Record<string, unknown>>({})

  // 加载源代码
  const loadSourceCode = useCallback(async () => {
    try {
      const raw = await getBotConfigRaw()
      setSourceCode(raw)
      setHasTomlError(false)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '加载失败',
        description: error instanceof Error ? error.message : '加载源代码失败',
      })
    }
  }, [toast])

  // 加载配置
  const loadConfig = useCallback(async () => {
    try {
      setLoading(true)
      const config = await getBotConfig()
      configRef.current = config

      setBotConfig(config.bot as BotConfig)
      setPersonalityConfig(config.personality as PersonalityConfig)
      
      // 确保 talk_value_rules 有默认值
      const chatConfigData = config.chat as ChatConfig
      if (!chatConfigData.talk_value_rules) {
        chatConfigData.talk_value_rules = []
      }
      setChatConfig(chatConfigData)
      
      setExpressionConfig(config.expression as ExpressionConfig)
      setEmojiConfig(config.emoji as EmojiConfig)
      setMemoryConfig(config.memory as MemoryConfig)
      setToolConfig(config.tool as ToolConfig)
      setMoodConfig(config.mood as MoodConfig)
      setVoiceConfig(config.voice as VoiceConfig)
      setLpmmConfig(config.lpmm_knowledge as LPMMKnowledgeConfig)
      setKeywordReactionConfig(config.keyword_reaction as KeywordReactionConfig)
      setResponsePostProcessConfig(config.response_post_process as ResponsePostProcessConfig)
      setChineseTypoConfig(config.chinese_typo as ChineseTypoConfig)
      setResponseSplitterConfig(config.response_splitter as ResponseSplitterConfig)
      setLogConfig(config.log as LogConfig)
      setDebugConfig(config.debug as DebugConfig)
      setMaimMessageConfig(config.maim_message as MaimMessageConfig)
      setTelemetryConfig(config.telemetry as TelemetryConfig)

      setHasUnsavedChanges(false)
      initialLoadRef.current = false
      
      // 同时加载源代码
      await loadSourceCode()
    } catch (error) {
      console.error('加载配置失败:', error)
      toast({
        title: '加载失败',
        description: '无法加载配置文件',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast, loadSourceCode])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  // 自动保存某个配置节
  const autoSaveSection = useCallback(async (sectionName: string, sectionData: unknown) => {
    if (initialLoadRef.current) return

    try {
      setAutoSaving(true)
      await updateBotConfigSection(sectionName, sectionData)
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error(`自动保存 ${sectionName} 失败:`, error)
      setHasUnsavedChanges(true)
    } finally {
      setAutoSaving(false)
    }
  }, [])

  // 触发自动保存
  const triggerAutoSave = useCallback(
    (sectionName: string, sectionData: unknown) => {
      if (initialLoadRef.current) return

      setHasUnsavedChanges(true)

      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }

      autoSaveTimerRef.current = setTimeout(() => {
        autoSaveSection(sectionName, sectionData)
      }, 2000)
    },
    [autoSaveSection]
  )

  // 监听配置变化
  useEffect(() => {
    if (botConfig && !initialLoadRef.current) {
      triggerAutoSave('bot', botConfig)
    }
  }, [botConfig, triggerAutoSave])

  useEffect(() => {
    if (personalityConfig && !initialLoadRef.current) {
      triggerAutoSave('personality', personalityConfig)
    }
  }, [personalityConfig, triggerAutoSave])

  useEffect(() => {
    if (chatConfig && !initialLoadRef.current) {
      triggerAutoSave('chat', chatConfig)
    }
  }, [chatConfig, triggerAutoSave])

  useEffect(() => {
    if (expressionConfig && !initialLoadRef.current) {
      triggerAutoSave('expression', expressionConfig)
    }
  }, [expressionConfig, triggerAutoSave])

  useEffect(() => {
    if (emojiConfig && !initialLoadRef.current) {
      triggerAutoSave('emoji', emojiConfig)
    }
  }, [emojiConfig, triggerAutoSave])

  useEffect(() => {
    if (memoryConfig && !initialLoadRef.current) {
      triggerAutoSave('memory', memoryConfig)
    }
  }, [memoryConfig, triggerAutoSave])

  useEffect(() => {
    if (toolConfig && !initialLoadRef.current) {
      triggerAutoSave('tool', toolConfig)
    }
  }, [toolConfig, triggerAutoSave])

  useEffect(() => {
    if (moodConfig && !initialLoadRef.current) {
      triggerAutoSave('mood', moodConfig)
    }
  }, [moodConfig, triggerAutoSave])

  useEffect(() => {
    if (voiceConfig && !initialLoadRef.current) {
      triggerAutoSave('voice', voiceConfig)
    }
  }, [voiceConfig, triggerAutoSave])

  useEffect(() => {
    if (lpmmConfig && !initialLoadRef.current) {
      triggerAutoSave('lpmm_knowledge', lpmmConfig)
    }
  }, [lpmmConfig, triggerAutoSave])

  useEffect(() => {
    if (keywordReactionConfig && !initialLoadRef.current) {
      triggerAutoSave('keyword_reaction', keywordReactionConfig)
    }
  }, [keywordReactionConfig, triggerAutoSave])

  useEffect(() => {
    if (responsePostProcessConfig && !initialLoadRef.current) {
      triggerAutoSave('response_post_process', responsePostProcessConfig)
    }
  }, [responsePostProcessConfig, triggerAutoSave])

  useEffect(() => {
    if (chineseTypoConfig && !initialLoadRef.current) {
      triggerAutoSave('chinese_typo', chineseTypoConfig)
    }
  }, [chineseTypoConfig, triggerAutoSave])

  useEffect(() => {
    if (responseSplitterConfig && !initialLoadRef.current) {
      triggerAutoSave('response_splitter', responseSplitterConfig)
    }
  }, [responseSplitterConfig, triggerAutoSave])

  useEffect(() => {
    if (logConfig && !initialLoadRef.current) {
      triggerAutoSave('log', logConfig)
    }
  }, [logConfig, triggerAutoSave])

  useEffect(() => {
    if (debugConfig && !initialLoadRef.current) {
      triggerAutoSave('debug', debugConfig)
    }
  }, [debugConfig, triggerAutoSave])

  useEffect(() => {
    if (maimMessageConfig && !initialLoadRef.current) {
      triggerAutoSave('maim_message', maimMessageConfig)
    }
  }, [maimMessageConfig, triggerAutoSave])

  useEffect(() => {
    if (telemetryConfig && !initialLoadRef.current) {
      triggerAutoSave('telemetry', telemetryConfig)
    }
  }, [telemetryConfig, triggerAutoSave])

  // 保存源代码
  const saveSourceCode = async () => {
    try {
      setSaving(true)
      await updateBotConfigRaw(sourceCode)
      setHasUnsavedChanges(false)
      setHasTomlError(false)
      toast({
        title: '保存成功',
        description: '配置已保存',
      })
      // 重新加载可视化配置
      await loadConfig()
    } catch (error) {
      setHasTomlError(true)
      toast({
        variant: 'destructive',
        title: '保存失败',
        description: error instanceof Error ? error.message : '保存配置失败',
      })
    } finally {
      setSaving(false)
    }
  }

  // 处理模式切换
  const handleModeChange = async (mode: 'visual' | 'source') => {
    if (hasUnsavedChanges) {
      toast({
        variant: 'destructive',
        title: '切换失败',
        description: '请先保存当前更改',
      })
      return
    }

    setEditMode(mode)
    if (mode === 'source') {
      await loadSourceCode()
    } else {
      // 切换回可视化时,直接重新加载配置但不显示全局 loading
      try {
        const config = await getBotConfig()
        configRef.current = config

        setBotConfig(config.bot as BotConfig)
        setPersonalityConfig(config.personality as PersonalityConfig)
        
        // 确保 talk_value_rules 有默认值
        const chatConfigData = config.chat as ChatConfig
        if (!chatConfigData.talk_value_rules) {
          chatConfigData.talk_value_rules = []
        }
        setChatConfig(chatConfigData)
        
        setExpressionConfig(config.expression as ExpressionConfig)
        setEmojiConfig(config.emoji as EmojiConfig)
        setMemoryConfig(config.memory as MemoryConfig)
        setToolConfig(config.tool as ToolConfig)
        setMoodConfig(config.mood as MoodConfig)
        setVoiceConfig(config.voice as VoiceConfig)
        setLpmmConfig(config.lpmm_knowledge as LPMMKnowledgeConfig)
        setKeywordReactionConfig(config.keyword_reaction as KeywordReactionConfig)
        setResponsePostProcessConfig(config.response_post_process as ResponsePostProcessConfig)
        setChineseTypoConfig(config.chinese_typo as ChineseTypoConfig)
        setResponseSplitterConfig(config.response_splitter as ResponseSplitterConfig)
        setLogConfig(config.log as LogConfig)
        setDebugConfig(config.debug as DebugConfig)
        setMaimMessageConfig(config.maim_message as MaimMessageConfig)
        setTelemetryConfig(config.telemetry as TelemetryConfig)

        setHasUnsavedChanges(false)
      } catch (error) {
        console.error('加载配置失败:', error)
        toast({
          title: '加载失败',
          description: '无法加载配置文件',
          variant: 'destructive',
        })
      }
    }
  }

  // 手动保存
  const saveConfig = async () => {
    try {
      setSaving(true)

      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }

    const fullConfig = {
      ...configRef.current,
      bot: botConfig,
      personality: personalityConfig,
      chat: chatConfig,
      expression: expressionConfig,
      emoji: emojiConfig,
      memory: memoryConfig,
      tool: toolConfig,
      mood: moodConfig,
      voice: voiceConfig,
      lpmm_knowledge: lpmmConfig,
      keyword_reaction: keywordReactionConfig,
      response_post_process: responsePostProcessConfig,
      chinese_typo: chineseTypoConfig,
      response_splitter: responseSplitterConfig,
      log: logConfig,
      debug: debugConfig,
      maim_message: maimMessageConfig,
      telemetry: telemetryConfig,
    }
    
    await updateBotConfig(fullConfig)
      setHasUnsavedChanges(false)
      toast({
        title: '保存成功',
        description: '麦麦主程序配置已保存',
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
      const fullConfig = {
        ...configRef.current,
        bot: botConfig,
        personality: personalityConfig,
        chat: chatConfig,
        expression: expressionConfig,
        emoji: emojiConfig,
        memory: memoryConfig,
        tool: toolConfig,
        mood: moodConfig,
        voice: voiceConfig,
        lpmm_knowledge: lpmmConfig,
        keyword_reaction: keywordReactionConfig,
        response_post_process: responsePostProcessConfig,
        chinese_typo: chineseTypoConfig,
        response_splitter: responseSplitterConfig,
        log: logConfig,
        debug: debugConfig,
        maim_message: maimMessageConfig,
        telemetry: telemetryConfig,
      }
      await updateBotConfig(fullConfig)
      setHasUnsavedChanges(false)
      toast({
        title: '保存成功',
        description: '配置已保存，即将重启麦麦...',
      })
      // 等待一下让用户看到保存成功的提示
      await new Promise(resolve => setTimeout(resolve, 500))
      await handleRestart()
    } catch (error) {
      console.error('保存失败:', error)
      toast({
        title: '保存失败',
        description: (error as Error).message,
        variant: 'destructive',
      })
    } finally {
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
      title: '重启失败',
      description: '服务器未能在预期时间内恢复，请手动检查',
      variant: 'destructive',
    })
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
            <h1 className="text-2xl sm:text-3xl font-bold">麦麦主程序配置</h1>
            <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">管理麦麦的核心功能和行为设置</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto items-center">
            {/* 模式切换 */}
            <Tabs value={editMode} onValueChange={(v) => handleModeChange(v as 'visual' | 'source')} className="w-auto">
              <TabsList className="h-9">
                <TabsTrigger value="visual" className="text-xs sm:text-sm px-2 sm:px-3">
                  <Layout className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  可视化
                </TabsTrigger>
                <TabsTrigger value="source" className="text-xs sm:text-sm px-2 sm:px-3">
                  <Code2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  源代码
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Button
              onClick={editMode === 'visual' ? saveConfig : saveSourceCode}
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

        {/* 源代码模式 */}
        {editMode === 'source' && (
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>源代码模式（高级功能）：</strong>直接编辑 TOML 配置文件。此功能仅适用于熟悉 TOML 语法的高级用户。保存时会在后端验证格式，只有格式完全正确才能保存。
                {hasTomlError && (
                  <span className="text-destructive font-semibold ml-2">⚠️ 上次保存失败，请检查 TOML 格式</span>
                )}
              </AlertDescription>
            </Alert>
            
            <CodeEditor
              value={sourceCode}
              onChange={(value) => {
                setSourceCode(value)
                setHasUnsavedChanges(true)
                // 清除之前的错误状态
                if (hasTomlError) {
                  setHasTomlError(false)
                }
              }}
              language="toml"
              theme="dark"
              height="calc(100vh - 280px)"
              minHeight="500px"
              placeholder="TOML 配置内容"
            />
          </div>
        )}

        {/* 可视化模式 */}
        {editMode === 'visual' && (
          <>
        {/* 标签页 */}
        <Tabs defaultValue="bot" className="w-full">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:grid-cols-5 lg:grid-cols-10">
              <TabsTrigger value="bot" className="flex-shrink-0">基本信息</TabsTrigger>
              <TabsTrigger value="personality" className="flex-shrink-0">人格</TabsTrigger>
              <TabsTrigger value="chat" className="flex-shrink-0">聊天</TabsTrigger>
              <TabsTrigger value="expression" className="flex-shrink-0">表达</TabsTrigger>
              <TabsTrigger value="features" className="flex-shrink-0">功能</TabsTrigger>
              <TabsTrigger value="processing" className="flex-shrink-0">处理</TabsTrigger>
              <TabsTrigger value="mood" className="flex-shrink-0">情绪</TabsTrigger>
              <TabsTrigger value="voice" className="flex-shrink-0">语音</TabsTrigger>
              <TabsTrigger value="lpmm" className="flex-shrink-0">知识库</TabsTrigger>
              <TabsTrigger value="other" className="flex-shrink-0">其他</TabsTrigger>
            </TabsList>
          </div>
          {/* 基本信息 */}
          <TabsContent value="bot" className="space-y-4">
            {botConfig && <BotInfoSection config={botConfig} onChange={setBotConfig} />}
          </TabsContent>

        {/* 人格配置 */}
        <TabsContent value="personality" className="space-y-4">
          {personalityConfig && (
            <PersonalitySection config={personalityConfig} onChange={setPersonalityConfig} />
          )}
        </TabsContent>

        {/* 聊天配置 */}
        <TabsContent value="chat" className="space-y-4">
          {chatConfig && <ChatSection config={chatConfig} onChange={setChatConfig} />}
        </TabsContent>

        {/* 表达配置 */}
        <TabsContent value="expression" className="space-y-4">
          {expressionConfig && (
            <ExpressionSection config={expressionConfig} onChange={setExpressionConfig} />
          )}
        </TabsContent>

        {/* 功能配置（合并表情、记忆、工具） */}
        <TabsContent value="features" className="space-y-4">
          {emojiConfig && memoryConfig && toolConfig && (
            <FeaturesSection
              emojiConfig={emojiConfig}
              memoryConfig={memoryConfig}
              toolConfig={toolConfig}
              onEmojiChange={setEmojiConfig}
              onMemoryChange={setMemoryConfig}
              onToolChange={setToolConfig}
            />
          )}
        </TabsContent>

        {/* 处理配置（关键词反应和回复后处理） */}
        <TabsContent value="processing" className="space-y-4">
          {keywordReactionConfig && responsePostProcessConfig && chineseTypoConfig && responseSplitterConfig && (
            <ProcessingSection
              keywordReactionConfig={keywordReactionConfig}
              responsePostProcessConfig={responsePostProcessConfig}
              chineseTypoConfig={chineseTypoConfig}
              responseSplitterConfig={responseSplitterConfig}
              onKeywordReactionChange={setKeywordReactionConfig}
              onResponsePostProcessChange={setResponsePostProcessConfig}
              onChineseTypoChange={setChineseTypoConfig}
              onResponseSplitterChange={setResponseSplitterConfig}
            />
          )}
        </TabsContent>

        {/* 情绪配置 */}
        <TabsContent value="mood" className="space-y-4">
          {moodConfig && <MoodSection config={moodConfig} onChange={setMoodConfig} />}
        </TabsContent>

        {/* 语音配置 */}
        <TabsContent value="voice" className="space-y-4">
          {voiceConfig && <VoiceSection config={voiceConfig} onChange={setVoiceConfig} />}
        </TabsContent>

        {/* 知识库配置 */}
        <TabsContent value="lpmm" className="space-y-4">
          {lpmmConfig && <LPMMSection config={lpmmConfig} onChange={setLpmmConfig} />}
        </TabsContent>

        {/* 其他配置 */}
        <TabsContent value="other" className="space-y-4">
          {logConfig && <LogSection config={logConfig} onChange={setLogConfig} />}
          {debugConfig && <DebugSection config={debugConfig} onChange={setDebugConfig} />}
          {maimMessageConfig && <MaimMessageSection config={maimMessageConfig} onChange={setMaimMessageConfig} />}
          {telemetryConfig && <TelemetrySection config={telemetryConfig} onChange={setTelemetryConfig} />}
        </TabsContent>
      </Tabs>
          </>
        )}

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

// 基本信息组件
function BotInfoSection({
  config,
  onChange,
}: {
  config: BotConfig
  onChange: (config: BotConfig) => void
}) {
  const addPlatform = () => {
    onChange({ ...config, platforms: [...config.platforms, ''] })
  }

  const removePlatform = (index: number) => {
    onChange({
      ...config,
      platforms: config.platforms.filter((_, i) => i !== index),
    })
  }

  const updatePlatform = (index: number, value: string) => {
    const newPlatforms = [...config.platforms]
    newPlatforms[index] = value
    onChange({ ...config, platforms: newPlatforms })
  }

  const addAlias = () => {
    onChange({ ...config, alias_names: [...config.alias_names, ''] })
  }

  const removeAlias = (index: number) => {
    onChange({
      ...config,
      alias_names: config.alias_names.filter((_, i) => i !== index),
    })
  }

  const updateAlias = (index: number, value: string) => {
    const newAliases = [...config.alias_names]
    newAliases[index] = value
    onChange({ ...config, alias_names: newAliases })
  }

  return (
    <div className="rounded-lg border bg-card p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">基本信息</h3>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="platform">平台</Label>
            <Input
              id="platform"
              value={config.platform}
              onChange={(e) => onChange({ ...config, platform: e.target.value })}
              placeholder="qq"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="qq_account">QQ账号</Label>
            <Input
              id="qq_account"
              value={config.qq_account}
              onChange={(e) => onChange({ ...config, qq_account: e.target.value })}
              placeholder="123456789"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="nickname">昵称</Label>
            <Input
              id="nickname"
              value={config.nickname}
              onChange={(e) => onChange({ ...config, nickname: e.target.value })}
              placeholder="麦麦"
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>其他平台账号</Label>
              <Button onClick={addPlatform} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                添加
              </Button>
            </div>
            <div className="space-y-2">
              {config.platforms.map((platform, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={platform}
                    onChange={(e) => updatePlatform(index, e.target.value)}
                    placeholder="wx:114514"
                  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="outline">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>确认删除</AlertDialogTitle>
                        <AlertDialogDescription>
                          确定要删除平台账号 "{platform || '(空)'}" 吗？此操作无法撤销。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={() => removePlatform(index)}>
                          删除
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
              {config.platforms.length === 0 && (
                <p className="text-sm text-muted-foreground">暂无其他平台账号</p>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>别名</Label>
              <Button onClick={addAlias} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                添加
              </Button>
            </div>
            <div className="space-y-2">
              {config.alias_names.map((alias, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={alias}
                    onChange={(e) => updateAlias(index, e.target.value)}
                    placeholder="小麦"
                  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="outline">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>确认删除</AlertDialogTitle>
                        <AlertDialogDescription>
                          确定要删除别名 "{alias || '(空)'}" 吗？此操作无法撤销。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={() => removeAlias(index)}>
                          删除
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
              {config.alias_names.length === 0 && (
                <p className="text-sm text-muted-foreground">暂无别名</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 人格配置组件
function PersonalitySection({
  config,
  onChange,
}: {
  config: PersonalityConfig
  onChange: (config: PersonalityConfig) => void
}) {
  const addState = () => {
    onChange({ ...config, states: [...config.states, ''] })
  }

  const removeState = (index: number) => {
    onChange({
      ...config,
      states: config.states.filter((_, i) => i !== index),
    })
  }

  const updateState = (index: number, value: string) => {
    const newStates = [...config.states]
    newStates[index] = value
    onChange({ ...config, states: newStates })
  }

  return (
    <div className="rounded-lg border bg-card p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">人格设置</h3>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="personality">人格特质</Label>
            <Textarea
              id="personality"
              value={config.personality}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange({ ...config, personality: e.target.value })}
              placeholder="描述人格特质和身份特征（建议120字以内）"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              建议120字以内，描述人格特质和身份特征
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="reply_style">表达风格</Label>
            <Textarea
              id="reply_style"
              value={config.reply_style}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange({ ...config, reply_style: e.target.value })}
              placeholder="描述说话的表达风格和习惯"
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="interest">兴趣</Label>
            <Textarea
              id="interest"
              value={config.interest}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange({ ...config, interest: e.target.value })}
              placeholder="会影响麦麦对什么话题进行回复"
              rows={2}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="plan_style">说话规则与行为风格</Label>
            <Textarea
              id="plan_style"
              value={config.plan_style}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange({ ...config, plan_style: e.target.value })}
              placeholder="麦麦的说话规则和行为风格"
              rows={5}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="visual_style">识图规则</Label>
            <Textarea
              id="visual_style"
              value={config.visual_style}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange({ ...config, visual_style: e.target.value })}
              placeholder="识图时的处理规则"
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="private_plan_style">私聊规则</Label>
            <Textarea
              id="private_plan_style"
              value={config.private_plan_style}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange({ ...config, private_plan_style: e.target.value })}
              placeholder="私聊的说话规则和行为风格"
              rows={4}
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>状态列表（人格多样性）</Label>
              <Button onClick={addState} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                添加状态
              </Button>
            </div>
            <div className="space-y-2">
              {config.states.map((state, index) => (
                <div key={index} className="flex gap-2">
                  <Textarea
                    value={state}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateState(index, e.target.value)}
                    placeholder="描述一个人格状态"
                    rows={2}
                  />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="icon" variant="outline">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>确认删除</AlertDialogTitle>
                        <AlertDialogDescription>
                          确定要删除这个人格状态吗？此操作无法撤销。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={() => removeState(index)}>
                          删除
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="state_probability">状态替换概率</Label>
            <Input
              id="state_probability"
              type="number"
              step="0.1"
              min="0"
              max="1"
              value={config.state_probability}
              onChange={(e) =>
                onChange({ ...config, state_probability: parseFloat(e.target.value) })
              }
            />
            <p className="text-xs text-muted-foreground">
              每次构建人格时替换 personality 的概率（0.0-1.0）
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// 聊天配置组件
function ChatSection({
  config,
  onChange,
}: {
  config: ChatConfig
  onChange: (config: ChatConfig) => void
}) {
  // 添加发言频率规则
  const addTalkValueRule = () => {
    onChange({
      ...config,
      talk_value_rules: [
        ...config.talk_value_rules,
        { target: '', time: '00:00-23:59', value: 1.0 },
      ],
    })
  }

  // 删除发言频率规则
  const removeTalkValueRule = (index: number) => {
    onChange({
      ...config,
      talk_value_rules: config.talk_value_rules.filter((_, i) => i !== index),
    })
  }

  // 更新发言频率规则
  const updateTalkValueRule = (
    index: number,
    field: 'target' | 'time' | 'value',
    value: string | number
  ) => {
    const newRules = [...config.talk_value_rules]
    newRules[index] = {
      ...newRules[index],
      [field]: value,
    }
    onChange({
      ...config,
      talk_value_rules: newRules,
    })
  }

  // 时间选择组件
  const TimeRangePicker = ({
    value,
    onChange,
  }: {
    value: string
    onChange: (value: string) => void
  }) => {
    const [startHour, setStartHour] = useState('00')
    const [startMinute, setStartMinute] = useState('00')
    const [endHour, setEndHour] = useState('23')
    const [endMinute, setEndMinute] = useState('59')

    useEffect(() => {
      const parts = value.split('-')
      if (parts.length === 2) {
        const [start, end] = parts
        const [sh, sm] = start.split(':')
        const [eh, em] = end.split(':')
        if (sh) setStartHour(sh.padStart(2, '0'))
        if (sm) setStartMinute(sm.padStart(2, '0'))
        if (eh) setEndHour(eh.padStart(2, '0'))
        if (em) setEndMinute(em.padStart(2, '0'))
      }
    }, [value])

    const updateTime = (
      newStartHour: string,
      newStartMinute: string,
      newEndHour: string,
      newEndMinute: string
    ) => {
      const newValue = `${newStartHour}:${newStartMinute}-${newEndHour}:${newEndMinute}`
      onChange(newValue)
    }

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start font-mono text-sm">
            <Clock className="h-4 w-4 mr-2" />
            {value || '选择时间段'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-3">开始时间</h4>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div>
                  <Label className="text-xs">小时</Label>
                  <Select
                    value={startHour}
                    onValueChange={(v) => {
                      setStartHour(v)
                      updateTime(v, startMinute, endHour, endMinute)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                        <SelectItem key={h} value={h.toString().padStart(2, '0')}>
                          {h.toString().padStart(2, '0')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">分钟</Label>
                  <Select
                    value={startMinute}
                    onValueChange={(v) => {
                      setStartMinute(v)
                      updateTime(startHour, v, endHour, endMinute)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                        <SelectItem key={m} value={m.toString().padStart(2, '0')}>
                          {m.toString().padStart(2, '0')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-sm mb-3">结束时间</h4>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div>
                  <Label className="text-xs">小时</Label>
                  <Select
                    value={endHour}
                    onValueChange={(v) => {
                      setEndHour(v)
                      updateTime(startHour, startMinute, v, endMinute)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                        <SelectItem key={h} value={h.toString().padStart(2, '0')}>
                          {h.toString().padStart(2, '0')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">分钟</Label>
                  <Select
                    value={endMinute}
                    onValueChange={(v) => {
                      setEndMinute(v)
                      updateTime(startHour, startMinute, endHour, v)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                        <SelectItem key={m} value={m.toString().padStart(2, '0')}>
                          {m.toString().padStart(2, '0')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  // 预览窗口组件
  const RulePreview = ({ rule }: { rule: { target: string; time: string; value: number } }) => {
    const previewText = `{ target = "${rule.target}", time = "${rule.time}", value = ${rule.value.toFixed(1)} }`
    
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-1" />
            预览
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">配置预览</h4>
            <div className="rounded-md bg-muted p-3 font-mono text-xs break-all">
              {previewText}
            </div>
            <p className="text-xs text-muted-foreground">
              这是保存到 bot_config.toml 文件中的格式
            </p>
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <div className="rounded-lg border bg-card p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">聊天设置</h3>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="talk_value">聊天频率（基础值）</Label>
            <Input
              id="talk_value"
              type="number"
              step="0.1"
              min="0"
              max="1"
              value={config.talk_value}
              onChange={(e) => onChange({ ...config, talk_value: parseFloat(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">越小越沉默，范围 0-1</p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="mentioned_bot_reply"
              checked={config.mentioned_bot_reply}
              onCheckedChange={(checked) =>
                onChange({ ...config, mentioned_bot_reply: checked })
              }
            />
            <Label htmlFor="mentioned_bot_reply" className="cursor-pointer">
              启用提及必回复
            </Label>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="max_context_size">上下文长度</Label>
            <Input
              id="max_context_size"
              type="number"
              min="1"
              value={config.max_context_size}
              onChange={(e) =>
                onChange({ ...config, max_context_size: parseInt(e.target.value) })
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="planner_smooth">规划器平滑</Label>
            <Input
              id="planner_smooth"
              type="number"
              step="1"
              min="0"
              value={config.planner_smooth}
              onChange={(e) =>
                onChange({ ...config, planner_smooth: parseFloat(e.target.value) })
              }
            />
            <p className="text-xs text-muted-foreground">
              增大数值会减小 planner 负荷，推荐 1-5，0 为关闭
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="enable_talk_value_rules"
              checked={config.enable_talk_value_rules}
              onCheckedChange={(checked) =>
                onChange({ ...config, enable_talk_value_rules: checked })
              }
            />
            <Label htmlFor="enable_talk_value_rules" className="cursor-pointer">
              启用动态发言频率规则
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="include_planner_reasoning"
              checked={config.include_planner_reasoning}
              onCheckedChange={(checked) =>
                onChange({ ...config, include_planner_reasoning: checked })
              }
            />
            <Label htmlFor="include_planner_reasoning" className="cursor-pointer">
              将 planner 推理加入 replyer
            </Label>
          </div>
        </div>
      </div>

      {/* 动态发言频率规则配置 */}
      {config.enable_talk_value_rules && (
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-base font-semibold">动态发言频率规则</h4>
              <p className="text-xs text-muted-foreground mt-1">
                按时段或聊天流ID调整发言频率，优先匹配具体聊天，再匹配全局规则
              </p>
            </div>
            <Button onClick={addTalkValueRule} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              添加规则
            </Button>
          </div>

          {config.talk_value_rules && config.talk_value_rules.length > 0 ? (
            <div className="space-y-4">
              {config.talk_value_rules.map((rule, index) => (
                <div key={index} className="rounded-lg border p-4 bg-muted/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">
                      规则 #{index + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <RulePreview rule={rule} />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认删除</AlertDialogTitle>
                            <AlertDialogDescription>
                              确定要删除规则 #{index + 1} 吗？此操作无法撤销。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction onClick={() => removeTalkValueRule(index)}>
                              删除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* 配置类型选择 */}
                    <div className="grid gap-2">
                      <Label className="text-xs font-medium">配置类型</Label>
                      <Select
                        value={rule.target === '' ? 'global' : 'specific'}
                        onValueChange={(value) => {
                          if (value === 'global') {
                            updateTalkValueRule(index, 'target', '')
                          } else {
                            // 切换到详细配置时，设置默认值
                            updateTalkValueRule(index, 'target', 'qq::group')
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="global">全局配置</SelectItem>
                          <SelectItem value="specific">详细配置</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* 详细配置选项 - 只在非全局时显示 */}
                    {rule.target !== '' && (() => {
                      // 解析聊天流 ID（格式：platform:id:type）
                      const parts = rule.target.split(':')
                      const platform = parts[0] || 'qq'
                      const chatId = parts[1] || ''
                      const chatType = parts[2] || 'group'
                      
                      return (
                        <div className="grid gap-4 p-4 rounded-lg bg-muted/50">
                          <div className="grid grid-cols-3 gap-3">
                            {/* 平台选择 */}
                            <div className="grid gap-2">
                              <Label className="text-xs font-medium">平台</Label>
                              <Select
                                value={platform}
                                onValueChange={(value) => {
                                  updateTalkValueRule(index, 'target', `${value}:${chatId}:${chatType}`)
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="qq">QQ</SelectItem>
                                  <SelectItem value="wx">微信</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* 群 ID 输入 */}
                            <div className="grid gap-2">
                              <Label className="text-xs font-medium">群 ID</Label>
                              <Input
                                value={chatId}
                                onChange={(e) => {
                                  updateTalkValueRule(index, 'target', `${platform}:${e.target.value}:${chatType}`)
                                }}
                                placeholder="输入群 ID"
                                className="font-mono text-sm"
                              />
                            </div>

                            {/* 类型选择 */}
                            <div className="grid gap-2">
                              <Label className="text-xs font-medium">类型</Label>
                              <Select
                                value={chatType}
                                onValueChange={(value) => {
                                  updateTalkValueRule(index, 'target', `${platform}:${chatId}:${value}`)
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="group">群组（group）</SelectItem>
                                  <SelectItem value="private">私聊（private）</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            当前聊天流 ID：{rule.target || '（未设置）'}
                          </p>
                        </div>
                      )
                    })()}

                    {/* 时间段选择器 */}
                    <div className="grid gap-2">
                      <Label className="text-xs font-medium">时间段 (Time)</Label>
                      <TimeRangePicker
                        value={rule.time}
                        onChange={(v) => updateTalkValueRule(index, 'time', v)}
                      />
                      <p className="text-xs text-muted-foreground">
                        支持跨夜区间，例如 23:00-02:00
                      </p>
                    </div>

                    {/* 发言频率滑块 */}
                    <div className="grid gap-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`rule-value-${index}`} className="text-xs font-medium">
                          发言频率值 (Value)
                        </Label>
                        <Input
                          id={`rule-value-${index}`}
                          type="number"
                          step="0.01"
                          min="0.01"
                          max="1"
                          value={rule.value}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value)
                            if (!isNaN(val)) {
                              updateTalkValueRule(index, 'value', Math.max(0.01, Math.min(1, val)))
                            }
                          }}
                          className="w-20 h-8 text-xs"
                        />
                      </div>
                      <Slider
                        value={[rule.value]}
                        onValueChange={(values) =>
                          updateTalkValueRule(index, 'value', values[0])
                        }
                        min={0.01}
                        max={1}
                        step={0.01}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0.01 (极少发言)</span>
                        <span>0.5</span>
                        <span>1.0 (正常)</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">暂无规则，点击"添加规则"按钮创建</p>
            </div>
          )}

          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h5 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
              📝 规则说明
            </h5>
            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <li>• <strong>Target 为空</strong>：全局规则，对所有聊天生效</li>
              <li>• <strong>Target 指定</strong>：仅对特定聊天流生效（格式：platform:id:type）</li>
              <li>• <strong>优先级</strong>：先匹配具体聊天流规则，再匹配全局规则</li>
              <li>• <strong>时间支持跨夜</strong>：例如 23:00-02:00 表示晚上11点到次日凌晨2点</li>
              <li>• <strong>数值范围</strong>：建议 0-1，0 表示完全沉默，1 表示正常发言</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

// 表达共享组成员输入组件（独立定义避免重新创建）
function ExpressionGroupMemberInput({
  member,
  groupIndex,
  memberIndex,
  availableChatIds,
  onUpdate,
  onRemove,
}: {
  member: string
  groupIndex: number
  memberIndex: number
  availableChatIds: string[]
  onUpdate: (groupIndex: number, memberIndex: number, value: string) => void
  onRemove: (groupIndex: number, memberIndex: number) => void
}) {
  // 判断当前成员是否在可选列表中
  const isFromList = availableChatIds.includes(member) || member === '*'
  const [inputMode, setInputMode] = useState(!isFromList)
  
  return (
    <div className="flex gap-2">
      {/* 输入模式切换 */}
      <div className="flex-1 flex gap-2">
        {inputMode ? (
          // 手动输入模式
          <>
            <Input
              value={member}
              onChange={(e) => onUpdate(groupIndex, memberIndex, e.target.value)}
              placeholder='输入 "*" 或 "qq:123456:group"'
              className="flex-1"
            />
            {availableChatIds.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setInputMode(false)}
                title="切换到下拉选择"
              >
                下拉
              </Button>
            )}
          </>
        ) : (
          // 下拉选择模式
          <>
            <Select
              value={member}
              onValueChange={(value) => onUpdate(groupIndex, memberIndex, value)}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="选择聊天流" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="*">* (全局共享)</SelectItem>
                {availableChatIds.map((chatId, idx) => (
                  <SelectItem key={idx} value={chatId}>
                    {chatId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setInputMode(true)}
              title="切换到手动输入"
            >
              输入
            </Button>
          </>
        )}
      </div>
      
      {/* 删除按钮 */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="icon" variant="outline">
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除组成员 "{member || '(空)'}" 吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => onRemove(groupIndex, memberIndex)}>
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// 表达配置组件
function ExpressionSection({
  config,
  onChange,
}: {
  config: ExpressionConfig
  onChange: (config: ExpressionConfig) => void
}) {
  // 添加学习规则
  const addLearningRule = () => {
    onChange({
      ...config,
      learning_list: [...config.learning_list, ['', 'enable', 'enable', '1.0']],
    })
  }

  // 删除学习规则
  const removeLearningRule = (index: number) => {
    onChange({
      ...config,
      learning_list: config.learning_list.filter((_, i) => i !== index),
    })
  }

  // 更新学习规则
  const updateLearningRule = (
    index: number,
    field: 0 | 1 | 2 | 3,
    value: string
  ) => {
    const newList = [...config.learning_list]
    newList[index][field] = value
    onChange({
      ...config,
      learning_list: newList,
    })
  }

  // 预览组件
  const LearningRulePreview = ({ rule }: { rule: [string, string, string, string] }) => {
    const previewText = `["${rule[0]}", "${rule[1]}", "${rule[2]}", "${rule[3]}"]`
    
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-1" />
            预览
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">配置预览</h4>
            <div className="rounded-md bg-muted p-3 font-mono text-xs break-all">
              {previewText}
            </div>
            <p className="text-xs text-muted-foreground">
              这是保存到 bot_config.toml 文件中的格式
            </p>
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  // 添加表达组
  const addExpressionGroup = () => {
    onChange({
      ...config,
      expression_groups: [...config.expression_groups, []],
    })
  }

  // 删除表达组
  const removeExpressionGroup = (index: number) => {
    onChange({
      ...config,
      expression_groups: config.expression_groups.filter((_, i) => i !== index),
    })
  }

  // 添加组成员
  const addGroupMember = (groupIndex: number) => {
    const newGroups = [...config.expression_groups]
    newGroups[groupIndex] = [...newGroups[groupIndex], '']
    onChange({
      ...config,
      expression_groups: newGroups,
    })
  }

  // 删除组成员
  const removeGroupMember = (groupIndex: number, memberIndex: number) => {
    const newGroups = [...config.expression_groups]
    newGroups[groupIndex] = newGroups[groupIndex].filter((_, i) => i !== memberIndex)
    onChange({
      ...config,
      expression_groups: newGroups,
    })
  }

  // 更新组成员
  const updateGroupMember = (groupIndex: number, memberIndex: number, value: string) => {
    const newGroups = [...config.expression_groups]
    newGroups[groupIndex][memberIndex] = value
    onChange({
      ...config,
      expression_groups: newGroups,
    })
  }

  return (
    <div className="space-y-6">
      {/* 表达学习配置 */}
      <div className="rounded-lg border bg-card p-6 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">表达学习配置</h3>
              <p className="text-sm text-muted-foreground mt-1">
                配置麦麦如何学习和使用表达方式
              </p>
            </div>
            <Button onClick={addLearningRule} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              添加规则
            </Button>
          </div>

          <div className="space-y-4">
            {config.learning_list.map((rule, index) => {
              // 检查是否已有全局配置（rule[0] === ''）
              const hasGlobalConfig = config.learning_list.some((r, i) => i !== index && r[0] === '')
              const isGlobal = rule[0] === ''
              
              // 解析聊天流 ID（格式：platform:id:type）
              const parts = rule[0].split(':')
              const platform = parts[0] || 'qq'
              const chatId = parts[1] || ''
              const chatType = parts[2] || 'group'
              
              return (
                <div key={index} className="rounded-lg border p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      规则 {index + 1} {isGlobal && '（全局配置）'}
                    </span>
                    <div className="flex items-center gap-2">
                      <LearningRulePreview rule={rule} />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认删除</AlertDialogTitle>
                            <AlertDialogDescription>
                              确定要删除学习规则 {index + 1} 吗？此操作无法撤销。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction onClick={() => removeLearningRule(index)}>
                              删除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* 配置类型选择 */}
                    <div className="grid gap-2">
                      <Label className="text-xs font-medium">配置类型</Label>
                      <Select
                        value={isGlobal ? 'global' : 'specific'}
                        onValueChange={(value) => {
                          if (value === 'global') {
                            updateLearningRule(index, 0, '')
                          } else {
                            // 切换到详细配置时，设置默认值
                            updateLearningRule(index, 0, 'qq::group')
                          }
                        }}
                        disabled={hasGlobalConfig && !isGlobal}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="global">全局配置</SelectItem>
                          <SelectItem value="specific" disabled={hasGlobalConfig && !isGlobal}>
                            详细配置
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {hasGlobalConfig && !isGlobal && (
                        <p className="text-xs text-amber-600">
                          已存在全局配置，无法创建新的全局配置
                        </p>
                      )}
                    </div>

                    {/* 详细配置选项 - 只在非全局时显示 */}
                    {!isGlobal && (
                      <div className="grid gap-4 p-4 rounded-lg bg-muted/50">
                        <div className="grid grid-cols-3 gap-3">
                          {/* 平台选择 */}
                          <div className="grid gap-2">
                            <Label className="text-xs font-medium">平台</Label>
                            <Select
                              value={platform}
                              onValueChange={(value) => {
                                updateLearningRule(index, 0, `${value}:${chatId}:${chatType}`)
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="qq">QQ</SelectItem>
                                <SelectItem value="wx">微信</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* 群 ID 输入 */}
                          <div className="grid gap-2">
                            <Label className="text-xs font-medium">群 ID</Label>
                            <Input
                              value={chatId}
                              onChange={(e) => {
                                updateLearningRule(index, 0, `${platform}:${e.target.value}:${chatType}`)
                              }}
                              placeholder="输入群 ID"
                              className="font-mono text-sm"
                            />
                          </div>

                          {/* 类型选择 */}
                          <div className="grid gap-2">
                            <Label className="text-xs font-medium">类型</Label>
                            <Select
                              value={chatType}
                              onValueChange={(value) => {
                                updateLearningRule(index, 0, `${platform}:${chatId}:${value}`)
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="group">群组（group）</SelectItem>
                                <SelectItem value="private">私聊（private）</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          当前聊天流 ID：{rule[0] || '（未设置）'}
                        </p>
                      </div>
                    )}

                  {/* 使用学到的表达 - 改为开关 */}
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-xs font-medium">使用学到的表达</Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          允许麦麦使用从聊天中学到的表达方式
                        </p>
                      </div>
                      <Switch
                        checked={rule[1] === 'enable'}
                        onCheckedChange={(checked) =>
                          updateLearningRule(index, 1, checked ? 'enable' : 'disable')
                        }
                      />
                    </div>
                  </div>

                  {/* 学习表达 - 改为开关 */}
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-xs font-medium">学习表达</Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          允许麦麦从聊天中学习新的表达方式
                        </p>
                      </div>
                      <Switch
                        checked={rule[2] === 'enable'}
                        onCheckedChange={(checked) =>
                          updateLearningRule(index, 2, checked ? 'enable' : 'disable')
                        }
                      />
                    </div>
                  </div>

                  {/* 学习强度 - 改为滑块+输入框 */}
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium">学习强度</Label>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        value={rule[3]}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value)
                          if (!isNaN(val)) {
                            updateLearningRule(index, 3, Math.max(0, Math.min(5, val)).toFixed(1))
                          }
                        }}
                        className="w-20 h-8 text-xs"
                      />
                    </div>
                    <Slider
                      value={[parseFloat(rule[3]) || 1.0]}
                      onValueChange={(values) =>
                        updateLearningRule(index, 3, values[0].toFixed(1))
                      }
                      min={0}
                      max={5}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0 (不学习)</span>
                      <span>2.5</span>
                      <span>5.0 (快速学习)</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      影响学习频率，最短学习间隔 = 300/学习强度（秒）
                    </p>
                  </div>
                </div>
              </div>
              )
            })}

            {config.learning_list.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                暂无学习规则，点击"添加规则"开始配置
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 表达反思配置 */}
      <div className="rounded-lg border bg-card p-6 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">表达反思配置</h3>
              <p className="text-sm text-muted-foreground mt-1">
                配置麦麦主动向管理员询问表达方式是否合适的功能
              </p>
            </div>
            <Switch
              checked={config.reflect}
              onCheckedChange={(checked) =>
                onChange({ ...config, reflect: checked })
              }
            />
          </div>

          {config.reflect && (
            <div className="space-y-4">
              {/* 表达反思操作员 ID */}
              <div className="rounded-lg border p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">反思操作员</span>
                </div>
                
                <div className="space-y-4">
                  {(() => {
                    const operatorId = config.reflect_operator_id || ''
                    const parts = operatorId.split(':')
                    const platform = parts[0] || 'qq'
                    const chatId = parts[1] || ''
                    const chatType = parts[2] || 'private'
                    
                    return (
                      <div className="grid gap-4 p-4 rounded-lg bg-muted/50">
                        <div className="grid grid-cols-3 gap-3">
                          {/* 平台选择 */}
                          <div className="grid gap-2">
                            <Label className="text-xs font-medium">平台</Label>
                            <Select
                              value={platform}
                              onValueChange={(value) => {
                                onChange({ ...config, reflect_operator_id: `${value}:${chatId}:${chatType}` })
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="qq">QQ</SelectItem>
                                <SelectItem value="wx">微信</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* ID 输入 */}
                          <div className="grid gap-2">
                            <Label className="text-xs font-medium">用户/群 ID</Label>
                            <Input
                              value={chatId}
                              onChange={(e) => {
                                onChange({ ...config, reflect_operator_id: `${platform}:${e.target.value}:${chatType}` })
                              }}
                              placeholder="输入 ID"
                              className="font-mono text-sm"
                            />
                          </div>

                          {/* 类型选择 */}
                          <div className="grid gap-2">
                            <Label className="text-xs font-medium">类型</Label>
                            <Select
                              value={chatType}
                              onValueChange={(value) => {
                                onChange({ ...config, reflect_operator_id: `${platform}:${chatId}:${value}` })
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="private">私聊（private）</SelectItem>
                                <SelectItem value="group">群组（group）</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          当前操作员 ID：{config.reflect_operator_id || '（未设置）'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          麦麦会向此操作员询问表达方式是否合适
                        </p>
                      </div>
                    )
                  })()}
                </div>
              </div>

              {/* 允许反思的聊天流列表 */}
              <div className="rounded-lg border p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">允许反思的聊天流</span>
                    <p className="text-xs text-muted-foreground mt-1">
                      只有在此列表中的聊天流才会提出问题并跟踪。如果列表为空，则所有聊天流都可以进行表达反思
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      onChange({
                        ...config,
                        allow_reflect: [...(config.allow_reflect || []), 'qq::group'],
                      })
                    }}
                    size="sm"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    添加聊天流
                  </Button>
                </div>

                <div className="space-y-2">
                  {(config.allow_reflect || []).map((chatId, index) => {
                    const parts = chatId.split(':')
                    const platform = parts[0] || 'qq'
                    const id = parts[1] || ''
                    const chatType = parts[2] || 'group'
                    
                    return (
                      <div key={index} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                        <Select
                          value={platform}
                          onValueChange={(value) => {
                            const newList = [...config.allow_reflect]
                            newList[index] = `${value}:${id}:${chatType}`
                            onChange({ ...config, allow_reflect: newList })
                          }}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="qq">QQ</SelectItem>
                            <SelectItem value="wx">微信</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Input
                          value={id}
                          onChange={(e) => {
                            const newList = [...config.allow_reflect]
                            newList[index] = `${platform}:${e.target.value}:${chatType}`
                            onChange({ ...config, allow_reflect: newList })
                          }}
                          placeholder="ID"
                          className="flex-1 font-mono text-sm"
                        />
                        
                        <Select
                          value={chatType}
                          onValueChange={(value) => {
                            const newList = [...config.allow_reflect]
                            newList[index] = `${platform}:${id}:${value}`
                            onChange({ ...config, allow_reflect: newList })
                          }}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="group">群组</SelectItem>
                            <SelectItem value="private">私聊</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button
                          onClick={() => {
                            onChange({
                              ...config,
                              allow_reflect: config.allow_reflect.filter((_, i) => i !== index),
                            })
                          }}
                          size="sm"
                          variant="ghost"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  })}

                  {(!config.allow_reflect || config.allow_reflect.length === 0) && (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      列表为空，所有聊天流都可以进行表达反思
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 表达共享组配置 */}
      <div className="rounded-lg border bg-card p-6 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">表达共享组配置</h3>
              <p className="text-sm text-muted-foreground mt-1">
                配置不同聊天流之间如何共享学到的表达方式
              </p>
            </div>
            <Button onClick={addExpressionGroup} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              添加共享组
            </Button>
          </div>

          <div className="space-y-4">
            {config.expression_groups.map((group, groupIndex) => {
              // 获取所有已配置的聊天流 ID（用于下拉框选项）
              const availableChatIds = config.learning_list
                .map(rule => rule[0])
                .filter(id => id !== '') // 过滤掉全局配置
              
              return (
                <div key={groupIndex} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      共享组 {groupIndex + 1}
                      {group.length === 1 && group[0] === '*' && '（全局共享）'}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => addGroupMember(groupIndex)}
                        size="sm"
                        variant="outline"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认删除</AlertDialogTitle>
                            <AlertDialogDescription>
                              确定要删除共享组 {groupIndex + 1} 吗？此操作无法撤销。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction onClick={() => removeExpressionGroup(groupIndex)}>
                              删除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {group.map((member, memberIndex) => (
                      <ExpressionGroupMemberInput
                        key={`${groupIndex}-${memberIndex}`}
                        member={member}
                        groupIndex={groupIndex}
                        memberIndex={memberIndex}
                        availableChatIds={availableChatIds}
                        onUpdate={updateGroupMember}
                        onRemove={removeGroupMember}
                      />
                    ))}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    提示：可以从下拉框选择已配置的聊天流，或手动输入。输入 "*" 启用全局共享
                  </p>
                </div>
              )
            })}

            {config.expression_groups.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                暂无共享组，点击"添加共享组"开始配置
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// 表情配置组件
// 功能配置组件（合并表情、记忆、工具）
function FeaturesSection({
  emojiConfig,
  memoryConfig,
  toolConfig,
  onEmojiChange,
  onMemoryChange,
  onToolChange,
}: {
  emojiConfig: EmojiConfig
  memoryConfig: MemoryConfig
  toolConfig: ToolConfig
  onEmojiChange: (config: EmojiConfig) => void
  onMemoryChange: (config: MemoryConfig) => void
  onToolChange: (config: ToolConfig) => void
}) {
  return (
    <div className="space-y-6">
      {/* 工具设置 */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-4">工具设置</h3>
          <div className="flex items-center space-x-2">
            <Switch
              id="enable_tool"
              checked={toolConfig.enable_tool}
              onCheckedChange={(checked) => onToolChange({ ...toolConfig, enable_tool: checked })}
            />
            <Label htmlFor="enable_tool" className="cursor-pointer">
              启用工具系统
            </Label>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            允许麦麦使用各种工具来增强功能
          </p>
        </div>
      </div>

      {/* 记忆设置 */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-4">记忆设置</h3>
          <div className="grid gap-2">
            <Label htmlFor="max_agent_iterations">记忆思考深度</Label>
            <Input
              id="max_agent_iterations"
              type="number"
              min="1"
              value={memoryConfig.max_agent_iterations}
              onChange={(e) =>
                onMemoryChange({ ...memoryConfig, max_agent_iterations: parseInt(e.target.value) })
              }
            />
            <p className="text-xs text-muted-foreground">最低为 1（不深入思考）</p>
          </div>
        </div>
      </div>

      {/* 表情包设置 */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-4">表情包设置</h3>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="emoji_chance">表情包激活概率</Label>
              <Input
                id="emoji_chance"
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={emojiConfig.emoji_chance}
                onChange={(e) =>
                  onEmojiChange({ ...emojiConfig, emoji_chance: parseFloat(e.target.value) })
                }
              />
              <p className="text-xs text-muted-foreground">范围 0-1，越大越容易发送表情包</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="max_reg_num">最大注册数量</Label>
              <Input
                id="max_reg_num"
                type="number"
                min="1"
                value={emojiConfig.max_reg_num}
                onChange={(e) =>
                  onEmojiChange({ ...emojiConfig, max_reg_num: parseInt(e.target.value) })
                }
              />
              <p className="text-xs text-muted-foreground">麦麦最多可以注册的表情包数量</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="check_interval">检查间隔（分钟）</Label>
              <Input
                id="check_interval"
                type="number"
                min="1"
                value={emojiConfig.check_interval}
                onChange={(e) =>
                  onEmojiChange({ ...emojiConfig, check_interval: parseInt(e.target.value) })
                }
              />
              <p className="text-xs text-muted-foreground">
                检查表情包（注册、破损、删除）的时间间隔
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="do_replace"
                checked={emojiConfig.do_replace}
                onCheckedChange={(checked) =>
                  onEmojiChange({ ...emojiConfig, do_replace: checked })
                }
              />
              <Label htmlFor="do_replace" className="cursor-pointer">
                达到最大数量时替换表情包
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="steal_emoji"
                checked={emojiConfig.steal_emoji}
                onCheckedChange={(checked) =>
                  onEmojiChange({ ...emojiConfig, steal_emoji: checked })
                }
              />
              <Label htmlFor="steal_emoji" className="cursor-pointer">
                偷取表情包
              </Label>
            </div>
            <p className="text-xs text-muted-foreground -mt-2">
              允许麦麦将看到的表情包据为己有
            </p>

            <div className="flex items-center space-x-2">
              <Switch
                id="content_filtration"
                checked={emojiConfig.content_filtration}
                onCheckedChange={(checked) =>
                  onEmojiChange({ ...emojiConfig, content_filtration: checked })
                }
              />
              <Label htmlFor="content_filtration" className="cursor-pointer">
                启用表情包过滤
              </Label>
            </div>

            {emojiConfig.content_filtration && (
              <div className="grid gap-2 pl-6 border-l-2 border-primary/20">
                <Label htmlFor="filtration_prompt">过滤要求</Label>
                <Input
                  id="filtration_prompt"
                  value={emojiConfig.filtration_prompt}
                  onChange={(e) =>
                    onEmojiChange({ ...emojiConfig, filtration_prompt: e.target.value })
                  }
                  placeholder="符合公序良俗"
                />
                <p className="text-xs text-muted-foreground">
                  只有符合此要求的表情包才会被保存
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// 处理配置组件（关键词反应和回复后处理）
function ProcessingSection({
  keywordReactionConfig,
  responsePostProcessConfig,
  chineseTypoConfig,
  responseSplitterConfig,
  onKeywordReactionChange,
  onResponsePostProcessChange,
  onChineseTypoChange,
  onResponseSplitterChange,
}: {
  keywordReactionConfig: KeywordReactionConfig
  responsePostProcessConfig: ResponsePostProcessConfig
  chineseTypoConfig: ChineseTypoConfig
  responseSplitterConfig: ResponseSplitterConfig
  onKeywordReactionChange: (config: KeywordReactionConfig) => void
  onResponsePostProcessChange: (config: ResponsePostProcessConfig) => void
  onChineseTypoChange: (config: ChineseTypoConfig) => void
  onResponseSplitterChange: (config: ResponseSplitterConfig) => void
}) {
  // ===== 关键词反应相关函数 =====
  // 添加正则规则
  const addRegexRule = () => {
    onKeywordReactionChange({
      ...keywordReactionConfig,
      regex_rules: [
        ...keywordReactionConfig.regex_rules,
        { regex: [''], reaction: '' },
      ],
    })
  }

  // 删除正则规则
  const removeRegexRule = (index: number) => {
    onKeywordReactionChange({
      ...keywordReactionConfig,
      regex_rules: keywordReactionConfig.regex_rules.filter((_, i) => i !== index),
    })
  }

  // 更新正则规则
  const updateRegexRule = (index: number, field: 'regex' | 'reaction', value: string | string[]) => {
    const newRules = [...keywordReactionConfig.regex_rules]
    if (field === 'regex' && typeof value === 'string') {
      newRules[index] = { ...newRules[index], regex: [value] }
    } else if (field === 'reaction' && typeof value === 'string') {
      newRules[index] = { ...newRules[index], reaction: value }
    }
    onKeywordReactionChange({
      ...keywordReactionConfig,
      regex_rules: newRules,
    })
  }

  // 正则表达式编辑器（构建器+测试器合并）
  const RegexEditor = ({ 
    regex, 
    reaction,
    onRegexChange,
    onReactionChange,
  }: { 
    regex: string
    reaction: string
    onRegexChange: (value: string) => void
    onReactionChange: (value: string) => void
  }) => {
    const [open, setOpen] = useState(false)
    const [testText, setTestText] = useState('')
    const [matches, setMatches] = useState<RegExpMatchArray | null>(null)
    const [error, setError] = useState<string>('')
    const [captureGroups, setCaptureGroups] = useState<Record<string, string>>({})
    const [replacedReaction, setReplacedReaction] = useState<string>('')
    const inputRef = useRef<HTMLInputElement>(null)
    const [activeTab, setActiveTab] = useState<'build' | 'test'>('build')

    // 将 Python 风格的命名捕获组转换为 JavaScript 风格
    const convertPythonRegexToJS = (pythonRegex: string): string => {
      return pythonRegex.replace(/\(\?P<([^>]+)>/g, '(?<$1>')
    }

    // 插入文本到光标位置
    const insertAtCursor = (text: string, moveCursor: number = 0) => {
      const input = inputRef.current
      if (!input) return

      const start = input.selectionStart || 0
      const end = input.selectionEnd || 0
      const newValue = regex.substring(0, start) + text + regex.substring(end)
      
      onRegexChange(newValue)
      
      setTimeout(() => {
        const newPosition = start + text.length + moveCursor
        input.setSelectionRange(newPosition, newPosition)
        input.focus()
      }, 0)
    }

    // 测试正则表达式
    useEffect(() => {
      if (!regex || !testText) {
        setMatches(null)
        setCaptureGroups({})
        setReplacedReaction(reaction)
        setError('')
        return
      }

      try {
        const jsRegex = convertPythonRegexToJS(regex)
        const regexObj = new RegExp(jsRegex, 'g')
        const matchResult = testText.match(regexObj)
        setMatches(matchResult)
        setError('')

        const execRegex = new RegExp(jsRegex)
        const execResult = execRegex.exec(testText)
        
        if (execResult && execResult.groups) {
          setCaptureGroups(execResult.groups)
          
          let replaced = reaction
          Object.entries(execResult.groups).forEach(([key, value]) => {
            replaced = replaced.replace(new RegExp(`\\[${key}\\]`, 'g'), value || '')
          })
          setReplacedReaction(replaced)
        } else {
          setCaptureGroups({})
          setReplacedReaction(reaction)
        }
      } catch (err) {
        setError((err as Error).message)
        setMatches(null)
        setCaptureGroups({})
        setReplacedReaction(reaction)
      }
    }, [regex, testText, reaction])

    // 高亮显示匹配的文本
    const renderHighlightedText = () => {
      if (!testText || !matches || matches.length === 0) {
        return <span className="text-muted-foreground">{testText || '请输入测试文本'}</span>
      }

      try {
        const jsRegex = convertPythonRegexToJS(regex)
        const regexObj = new RegExp(jsRegex, 'g')
        let lastIndex = 0
        const parts: React.ReactElement[] = []
        let match: RegExpExecArray | null

        while ((match = regexObj.exec(testText)) !== null) {
          if (match.index > lastIndex) {
            parts.push(
              <span key={`text-${lastIndex}`}>
                {testText.substring(lastIndex, match.index)}
              </span>
            )
          }

          parts.push(
            <span key={`match-${match.index}`} className="bg-yellow-200 dark:bg-yellow-900 font-semibold">
              {match[0]}
            </span>
          )

          lastIndex = match.index + match[0].length
        }

        if (lastIndex < testText.length) {
          parts.push(
            <span key={`text-${lastIndex}`}>
              {testText.substring(lastIndex)}
            </span>
          )
        }

        return <>{parts}</>
      } catch {
        return <span>{testText}</span>
      }
    }

    // 常用正则模式
    const patterns = [
      {
        category: '基础匹配',
        items: [
          { label: '任意字符', pattern: '.', desc: '匹配除换行符外的任意字符' },
          { label: '数字', pattern: '\\d', desc: '匹配 0-9' },
          { label: '非数字', pattern: '\\D', desc: '匹配非数字字符' },
          { label: '字母数字', pattern: '\\w', desc: '匹配字母、数字、下划线' },
          { label: '非字母数字', pattern: '\\W', desc: '匹配非字母数字字符' },
          { label: '空白符', pattern: '\\s', desc: '匹配空格、制表符等' },
          { label: '非空白符', pattern: '\\S', desc: '匹配非空白字符' },
        ],
      },
      {
        category: '位置锚点',
        items: [
          { label: '行首', pattern: '^', desc: '匹配行的开始' },
          { label: '行尾', pattern: '$', desc: '匹配行的结束' },
          { label: '单词边界', pattern: '\\b', desc: '匹配单词边界' },
        ],
      },
      {
        category: '重复次数',
        items: [
          { label: '0或多次', pattern: '*', desc: '匹配前面的元素0次或多次' },
          { label: '1或多次', pattern: '+', desc: '匹配前面的元素1次或多次' },
          { label: '0或1次', pattern: '?', desc: '匹配前面的元素0次或1次' },
          { label: '指定次数', pattern: '{n}', desc: '匹配n次，将n替换为数字' },
          { label: '次数范围', pattern: '{m,n}', desc: '匹配m到n次' },
        ],
      },
      {
        category: '分组和捕获',
        items: [
          { label: '普通分组', pattern: '()', desc: '分组但不捕获', moveCursor: -1 },
          { label: '命名捕获', pattern: '(?P<name>)', desc: 'Python风格命名捕获组', moveCursor: -1 },
          { label: '非捕获组', pattern: '(?:)', desc: '分组但不保存匹配结果', moveCursor: -1 },
        ],
      },
      {
        category: '字符类',
        items: [
          { label: '字符集', pattern: '[]', desc: '匹配括号内的任意字符', moveCursor: -1 },
          { label: '排除字符', pattern: '[^]', desc: '匹配不在括号内的字符', moveCursor: -1 },
          { label: '范围', pattern: '[a-z]', desc: '匹配a到z的字符' },
          { label: '中文字符', pattern: '[\\u4e00-\\u9fa5]', desc: '匹配中文汉字' },
        ],
      },
      {
        category: '常用模板',
        items: [
          { label: '捕获词语', pattern: '(?P<word>\\S+)', desc: '捕获一个词语' },
          { label: '捕获句子', pattern: '(?P<sentence>.+)', desc: '捕获整个句子' },
          { label: '捕获数字', pattern: '(?P<num>\\d+)', desc: '捕获一个或多个数字' },
          { label: '可选词语', pattern: '(?:词语1|词语2)', desc: '匹配多个可选项之一' },
        ],
      },
    ]

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <FileSearch className="h-4 w-4 mr-1" />
            正则编辑器
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-[95vw] sm:max-w-[900px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>正则表达式编辑器</DialogTitle>
            <DialogDescription className="text-sm">
              使用可视化工具构建正则表达式，并实时测试效果
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-120px)]">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'build' | 'test')} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="build">🔧 构建器</TabsTrigger>
                <TabsTrigger value="test">🧪 测试器</TabsTrigger>
              </TabsList>

            {/* 构建器标签页 */}
            <TabsContent value="build" className="space-y-4 mt-4">
              {/* 正则表达式编辑 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">正则表达式</Label>
                <Input
                  ref={inputRef}
                  value={regex}
                  onChange={(e) => onRegexChange(e.target.value)}
                  className="font-mono text-sm"
                  placeholder="点击下方按钮构建正则表达式..."
                />
              </div>

              {/* Reaction 编辑 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Reaction 内容</Label>
                <Textarea
                  value={reaction}
                  onChange={(e) => onReactionChange(e.target.value)}
                  placeholder="使用 [捕获组名] 引用捕获的内容..."
                  rows={3}
                  className="text-sm"
                />
              </div>

              {/* 快捷按钮 */}
              <div className="space-y-4 border-t pt-4">
                {patterns.map((category) => (
                  <div key={category.category} className="space-y-2">
                    <h5 className="text-xs font-semibold text-primary">{category.category}</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {category.items.map((item) => (
                        <Button
                          key={item.label}
                          variant="outline"
                          size="sm"
                          className="justify-start h-auto py-2 px-3"
                          onClick={() => insertAtCursor(item.pattern, item.moveCursor || 0)}
                        >
                          <div className="flex flex-col items-start w-full">
                            <div className="flex items-center gap-2 w-full">
                              <span className="text-xs font-medium">{item.label}</span>
                              <code className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                                {item.pattern}
                              </code>
                            </div>
                            <span className="text-xs text-muted-foreground mt-0.5">
                              {item.desc}
                            </span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}

                {/* 完整示例 */}
                <div className="space-y-2 border-t pt-4">
                  <h5 className="text-xs font-semibold text-primary">完整示例模板</h5>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start h-auto py-2 px-3"
                      onClick={() => onRegexChange('^(?P<n>\\S{1,20})是这样的$')}
                    >
                      <div className="flex flex-col items-start w-full">
                        <code className="text-xs font-mono bg-muted px-2 py-1 rounded w-full overflow-x-auto">
                          ^(?P&lt;n&gt;\S{'{1,20}'})是这样的$
                        </code>
                        <span className="text-xs text-muted-foreground mt-1">
                          匹配「某事物是这样的」并捕获事物名称
                        </span>
                      </div>
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start h-auto py-2 px-3"
                      onClick={() => onRegexChange('(?:[^，。.\\s]+，\\s*)?我(?:也)?[没沒]要求你\\s*(?P<action>.+?)[.。,，]?$')}
                    >
                      <div className="flex flex-col items-start w-full">
                        <code className="text-xs font-mono bg-muted px-2 py-1 rounded w-full overflow-x-auto">
                          (?:[^，。.\s]+，\s*)?我(?:也)?[没沒]要求你\s*(?P&lt;action&gt;.+?)[.。,，]?$
                        </code>
                        <span className="text-xs text-muted-foreground mt-1">
                          匹配「我没要求你做某事」并捕获具体行为
                        </span>
                      </div>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start h-auto py-2 px-3"
                      onClick={() => onRegexChange('(?P<subject>.+?)(?:是|为什么|怎么)')}
                    >
                      <div className="flex flex-col items-start w-full">
                        <code className="text-xs font-mono bg-muted px-2 py-1 rounded w-full overflow-x-auto">
                          (?P&lt;subject&gt;.+?)(?:是|为什么|怎么)
                        </code>
                        <span className="text-xs text-muted-foreground mt-1">
                          捕获问题主题词
                        </span>
                      </div>
                    </Button>
                  </div>
                </div>
              </div>

              {/* 帮助信息 */}
              <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3 space-y-1">
                <p className="text-xs font-medium text-blue-900 dark:text-blue-100">💡 使用提示</p>
                <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                  <li>点击输入框设置光标位置，然后点击按钮插入模式</li>
                  <li>命名捕获组格式：<code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">(?P&lt;名称&gt;模式)</code></li>
                  <li>在 reaction 中使用 <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">[名称]</code> 引用捕获的内容</li>
                  <li>切换到测试器标签页验证正则表达式效果</li>
                </ul>
              </div>
            </TabsContent>

            {/* 测试器标签页 */}
            <TabsContent value="test" className="space-y-4 mt-4">
              {/* 当前正则显示 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">当前正则表达式</Label>
                <div className="rounded-md bg-muted p-3 font-mono text-xs break-all">
                  {regex || '(未设置)'}
                </div>
              </div>

              {/* 测试文本输入 */}
              <div className="space-y-2">
                <Label htmlFor="test-text" className="text-sm font-medium">测试文本</Label>
                <Textarea
                  id="test-text"
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  placeholder="在此输入要测试的文本...&#10;例如：打游戏是这样的"
                  className="min-h-[100px] text-sm"
                />
              </div>

              {/* 错误提示 */}
              {error && (
                <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
                  <p className="text-sm text-destructive font-medium">正则表达式错误</p>
                  <p className="text-xs text-destructive/80 mt-1">{error}</p>
                </div>
              )}

              {/* 匹配结果 */}
              {!error && testText && (
                <div className="space-y-3">
                  {/* 匹配状态 */}
                  <div className="flex items-center gap-2">
                    {matches && matches.length > 0 ? (
                      <>
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">
                          匹配成功 ({matches.length} 处)
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                        <span className="text-sm font-medium text-muted-foreground">
                          无匹配
                        </span>
                      </>
                    )}
                  </div>

                  {/* 高亮显示 */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">匹配高亮</Label>
                    <ScrollArea className="h-40 rounded-md bg-muted p-3">
                      <div className="text-sm break-words">
                        {renderHighlightedText()}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* 捕获组 */}
                  {Object.keys(captureGroups).length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">命名捕获组</Label>
                      <ScrollArea className="h-32 rounded-md border p-3">
                        <div className="space-y-2">
                          {Object.entries(captureGroups).map(([name, value]) => (
                            <div key={name} className="flex items-start gap-2 text-sm">
                              <span className="font-mono font-semibold text-primary min-w-[80px]">[{name}]</span>
                              <span className="text-muted-foreground">=</span>
                              <span className="font-mono bg-muted px-2 py-0.5 rounded">{value}</span>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  {/* 替换预览 */}
                  {Object.keys(captureGroups).length > 0 && reaction && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Reaction 替换预览</Label>
                      <ScrollArea className="h-48 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3">
                        <div className="text-sm break-words">
                          {replacedReaction}
                        </div>
                      </ScrollArea>
                      <p className="text-xs text-muted-foreground">
                        reaction 中的 [name] 已被替换为对应的捕获组值
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 帮助信息 */}
              <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3 space-y-1">
                <p className="text-xs font-medium text-blue-900 dark:text-blue-100">💡 测试说明</p>
                <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                  <li>匹配的文本会以黄色背景高亮显示</li>
                  <li>命名捕获组的值会显示在下方列表中</li>
                  <li>Reaction 替换预览显示最终生成的反应内容</li>
                  <li>如需修改正则，切换回构建器标签页</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    )
  }

  // 添加关键词规则
  const addKeywordRule = () => {
    onKeywordReactionChange({
      ...keywordReactionConfig,
      keyword_rules: [
        ...keywordReactionConfig.keyword_rules,
        { keywords: [], reaction: '' },
      ],
    })
  }

  // 删除关键词规则
  const removeKeywordRule = (index: number) => {
    onKeywordReactionChange({
      ...keywordReactionConfig,
      keyword_rules: keywordReactionConfig.keyword_rules.filter((_, i) => i !== index),
    })
  }

  // 更新关键词规则
  const updateKeywordRule = (index: number, field: 'keywords' | 'reaction', value: string | string[]) => {
    const newRules = [...keywordReactionConfig.keyword_rules]
    if (field === 'keywords' && Array.isArray(value)) {
      newRules[index] = { ...newRules[index], keywords: value }
    } else if (field === 'reaction' && typeof value === 'string') {
      newRules[index] = { ...newRules[index], reaction: value }
    }
    onKeywordReactionChange({
      ...keywordReactionConfig,
      keyword_rules: newRules,
    })
  }

  // 添加/删除关键词
  const addKeyword = (ruleIndex: number) => {
    const newRules = [...keywordReactionConfig.keyword_rules]
    newRules[ruleIndex] = {
      ...newRules[ruleIndex],
      keywords: [...(newRules[ruleIndex].keywords || []), ''],
    }
    onKeywordReactionChange({
      ...keywordReactionConfig,
      keyword_rules: newRules,
    })
  }

  const removeKeyword = (ruleIndex: number, keywordIndex: number) => {
    const newRules = [...keywordReactionConfig.keyword_rules]
    newRules[ruleIndex] = {
      ...newRules[ruleIndex],
      keywords: (newRules[ruleIndex].keywords || []).filter((_, i) => i !== keywordIndex),
    }
    onKeywordReactionChange({
      ...keywordReactionConfig,
      keyword_rules: newRules,
    })
  }

  const updateKeyword = (ruleIndex: number, keywordIndex: number, value: string) => {
    const newRules = [...keywordReactionConfig.keyword_rules]
    const keywords = [...(newRules[ruleIndex].keywords || [])]
    keywords[keywordIndex] = value
    newRules[ruleIndex] = { ...newRules[ruleIndex], keywords }
    onKeywordReactionChange({
      ...keywordReactionConfig,
      keyword_rules: newRules,
    })
  }

  // 预览组件
  const RegexRulePreview = ({ rule }: { rule: KeywordRule }) => {
    const previewText = `{ regex = [${(rule.regex || []).map(r => `"${r}"`).join(', ')}], reaction = "${rule.reaction}" }`
    
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-1" />
            预览
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[95vw] sm:w-[500px]">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">配置预览</h4>
            <ScrollArea className="h-60 rounded-md bg-muted p-3">
              <pre className="font-mono text-xs break-all">
                {previewText}
              </pre>
            </ScrollArea>
            <p className="text-xs text-muted-foreground">
              这是保存到 bot_config.toml 文件中的格式
            </p>
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  const KeywordRulePreview = ({ rule }: { rule: KeywordRule }) => {
    const previewText = `[[keyword_reaction.keyword_rules]]\nkeywords = [${(rule.keywords || []).map(k => `"${k}"`).join(', ')}]\nreaction = "${rule.reaction}"`
    
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-1" />
            预览
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[95vw] sm:w-[500px]">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">配置预览</h4>
            <ScrollArea className="h-60 rounded-md bg-muted p-3">
              <pre className="font-mono text-xs whitespace-pre-wrap break-all">
                {previewText}
              </pre>
            </ScrollArea>
            <p className="text-xs text-muted-foreground">
              这是保存到 bot_config.toml 文件中的格式
            </p>
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <div className="space-y-6">
      {/* 关键词反应配置 */}
      <div className="rounded-lg border bg-card p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">关键词反应配置</h3>
          <p className="text-sm text-muted-foreground">
            配置触发特定反应的关键词和正则表达式规则
          </p>
        </div>

        {/* 正则规则 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-semibold">正则表达式规则</h4>
              <p className="text-xs text-muted-foreground mt-1">
                使用正则表达式匹配消息内容
              </p>
            </div>
            <Button onClick={addRegexRule} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              添加正则规则
            </Button>
          </div>

          <div className="space-y-3">
            {keywordReactionConfig.regex_rules.map((rule, index) => (
              <div key={index} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">正则规则 {index + 1}</span>
                  <div className="flex items-center gap-2">
                    <RegexEditor
                      regex={(rule.regex && rule.regex[0]) || ''}
                      reaction={rule.reaction}
                      onRegexChange={(value) => updateRegexRule(index, 'regex', value)}
                      onReactionChange={(value) => updateRegexRule(index, 'reaction', value)}
                    />
                    <RegexRulePreview rule={rule} />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>确认删除</AlertDialogTitle>
                          <AlertDialogDescription>
                            确定要删除正则规则 {index + 1} 吗？此操作无法撤销。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction onClick={() => removeRegexRule(index)}>
                            删除
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid gap-2">
                    <Label className="text-xs font-medium">正则表达式（Python 语法）</Label>
                    <Input
                      value={(rule.regex && rule.regex[0]) || ''}
                      onChange={(e) => updateRegexRule(index, 'regex', e.target.value)}
                      placeholder="例如：^(?P<n>\\S{1,20})是这样的$ （点击正则编辑器按钮可视化构建）"
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      支持命名捕获组 (?P&lt;name&gt;pattern)，可在 reaction 中使用 [name] 引用。点击"正则编辑器"可视化构建和测试！
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label className="text-xs font-medium">反应内容</Label>
                    <Textarea
                      value={rule.reaction}
                      onChange={(e) => updateRegexRule(index, 'reaction', e.target.value)}
                      placeholder="触发后麦麦的反应...&#10;可以使用 [捕获组名] 来引用正则表达式中的内容"
                      rows={3}
                      className="text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      使用 [捕获组名] 引用正则表达式中的命名捕获组，例如 [n] 会被替换为捕获的内容
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {keywordReactionConfig.regex_rules.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                暂无正则规则，点击"添加正则规则"开始配置
              </div>
            )}
          </div>
        </div>

        {/* 关键词规则 */}
        <div className="space-y-4 border-t pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-semibold">关键词规则</h4>
              <p className="text-xs text-muted-foreground mt-1">
                使用关键词列表匹配消息内容
              </p>
            </div>
            <Button onClick={addKeywordRule} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              添加关键词规则
            </Button>
          </div>

          <div className="space-y-3">
            {keywordReactionConfig.keyword_rules.map((rule, ruleIndex) => (
              <div key={ruleIndex} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">关键词规则 {ruleIndex + 1}</span>
                  <div className="flex items-center gap-2">
                    <KeywordRulePreview rule={rule} />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>确认删除</AlertDialogTitle>
                          <AlertDialogDescription>
                            确定要删除关键词规则 {ruleIndex + 1} 吗？此操作无法撤销。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction onClick={() => removeKeywordRule(ruleIndex)}>
                            删除
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium">关键词列表</Label>
                      <Button
                        onClick={() => addKeyword(ruleIndex)}
                        size="sm"
                        variant="ghost"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        添加关键词
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {(rule.keywords || []).map((keyword, keywordIndex) => (
                        <div key={keywordIndex} className="flex items-center gap-2">
                          <Input
                            value={keyword}
                            onChange={(e) =>
                              updateKeyword(ruleIndex, keywordIndex, e.target.value)
                            }
                            placeholder="关键词"
                            className="flex-1"
                          />
                          <Button
                            onClick={() => removeKeyword(ruleIndex, keywordIndex)}
                            size="sm"
                            variant="ghost"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}

                      {(!rule.keywords || rule.keywords.length === 0) && (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          暂无关键词，点击"添加关键词"开始配置
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label className="text-xs font-medium">反应内容</Label>
                    <Textarea
                      value={rule.reaction}
                      onChange={(e) => updateKeywordRule(ruleIndex, 'reaction', e.target.value)}
                      placeholder="触发后麦麦的反应..."
                      rows={3}
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}

            {keywordReactionConfig.keyword_rules.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                暂无关键词规则，点击"添加关键词规则"开始配置
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 回复后处理配置 */}
      <div className="rounded-lg border bg-card p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">回复后处理配置</h3>
          <div className="flex items-center space-x-2">
            <Switch
              id="enable_response_post_process"
              checked={responsePostProcessConfig.enable_response_post_process}
              onCheckedChange={(checked) =>
                onResponsePostProcessChange({
                  ...responsePostProcessConfig,
                  enable_response_post_process: checked,
                })
              }
            />
            <Label htmlFor="enable_response_post_process" className="cursor-pointer">
              启用回复后处理
            </Label>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            包括错别字生成器和回复分割器
          </p>
        </div>

        {/* 错别字生成器 */}
        {responsePostProcessConfig.enable_response_post_process && (
          <>
            <div className="border-t pt-6 space-y-4">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Switch
                    id="enable_chinese_typo"
                    checked={chineseTypoConfig.enable}
                    onCheckedChange={(checked) =>
                      onChineseTypoChange({ ...chineseTypoConfig, enable: checked })
                    }
                  />
                  <Label htmlFor="enable_chinese_typo" className="cursor-pointer font-semibold">
                    中文错别字生成器
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  为回复添加随机错别字，让麦麦的回复更自然
                </p>

                {chineseTypoConfig.enable && (
                  <div className="grid gap-4 pl-6 border-l-2 border-primary/20">
                    <div className="grid gap-2">
                      <Label htmlFor="error_rate" className="text-xs font-medium">
                        单字替换概率
                      </Label>
                      <Input
                        id="error_rate"
                        type="number"
                        step="0.001"
                        min="0"
                        max="1"
                        value={chineseTypoConfig.error_rate}
                        onChange={(e) =>
                          onChineseTypoChange({
                            ...chineseTypoConfig,
                            error_rate: parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="min_freq" className="text-xs font-medium">
                        最小字频阈值
                      </Label>
                      <Input
                        id="min_freq"
                        type="number"
                        min="0"
                        value={chineseTypoConfig.min_freq}
                        onChange={(e) =>
                          onChineseTypoChange({
                            ...chineseTypoConfig,
                            min_freq: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="tone_error_rate" className="text-xs font-medium">
                        声调错误概率
                      </Label>
                      <Input
                        id="tone_error_rate"
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={chineseTypoConfig.tone_error_rate}
                        onChange={(e) =>
                          onChineseTypoChange({
                            ...chineseTypoConfig,
                            tone_error_rate: parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="word_replace_rate" className="text-xs font-medium">
                        整词替换概率
                      </Label>
                      <Input
                        id="word_replace_rate"
                        type="number"
                        step="0.001"
                        min="0"
                        max="1"
                        value={chineseTypoConfig.word_replace_rate}
                        onChange={(e) =>
                          onChineseTypoChange({
                            ...chineseTypoConfig,
                            word_replace_rate: parseFloat(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 回复分割器 */}
            <div className="border-t pt-6 space-y-4">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Switch
                    id="enable_response_splitter"
                    checked={responseSplitterConfig.enable}
                    onCheckedChange={(checked) =>
                      onResponseSplitterChange({ ...responseSplitterConfig, enable: checked })
                    }
                  />
                  <Label htmlFor="enable_response_splitter" className="cursor-pointer font-semibold">
                    回复分割器
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  控制回复的长度和句子数量
                </p>

                {responseSplitterConfig.enable && (
                  <div className="grid gap-4 pl-6 border-l-2 border-primary/20">
                    <div className="grid gap-2">
                      <Label htmlFor="max_length" className="text-xs font-medium">
                        最大长度
                      </Label>
                      <Input
                        id="max_length"
                        type="number"
                        min="1"
                        value={responseSplitterConfig.max_length}
                        onChange={(e) =>
                          onResponseSplitterChange({
                            ...responseSplitterConfig,
                            max_length: parseInt(e.target.value),
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground">回复允许的最大字符数</p>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="max_sentence_num" className="text-xs font-medium">
                        最大句子数
                      </Label>
                      <Input
                        id="max_sentence_num"
                        type="number"
                        min="1"
                        value={responseSplitterConfig.max_sentence_num}
                        onChange={(e) =>
                          onResponseSplitterChange({
                            ...responseSplitterConfig,
                            max_sentence_num: parseInt(e.target.value),
                          })
                        }
                      />
                      <p className="text-xs text-muted-foreground">回复允许的最大句子数量</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="enable_kaomoji_protection"
                        checked={responseSplitterConfig.enable_kaomoji_protection}
                        onCheckedChange={(checked) =>
                          onResponseSplitterChange({
                            ...responseSplitterConfig,
                            enable_kaomoji_protection: checked,
                          })
                        }
                      />
                      <Label htmlFor="enable_kaomoji_protection" className="cursor-pointer">
                        启用颜文字保护
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="enable_overflow_return_all"
                        checked={responseSplitterConfig.enable_overflow_return_all}
                        onCheckedChange={(checked) =>
                          onResponseSplitterChange({
                            ...responseSplitterConfig,
                            enable_overflow_return_all: checked,
                          })
                        }
                      />
                      <Label htmlFor="enable_overflow_return_all" className="cursor-pointer">
                        超出时一次性返回全部
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground -mt-2">
                      当句子数量超出限制时，合并后一次性返回所有内容
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function MoodSection({
  config,
  onChange,
}: {
  config: MoodConfig
  onChange: (config: MoodConfig) => void
}) {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <h3 className="text-lg font-semibold">情绪设置</h3>
      <div className="grid gap-4">
        <div className="flex items-center space-x-2">
          <Switch
            checked={config.enable_mood}
            onCheckedChange={(checked) => onChange({ ...config, enable_mood: checked })}
          />
          <Label className="cursor-pointer">启用情绪系统</Label>
        </div>
        {config.enable_mood && (
          <>
            <div className="grid gap-2">
              <Label>情绪更新阈值</Label>
              <Input
                type="number"
                min="1"
                value={config.mood_update_threshold}
                onChange={(e) =>
                  onChange({ ...config, mood_update_threshold: parseInt(e.target.value) })
                }
              />
              <p className="text-xs text-muted-foreground">越高，更新越慢</p>
            </div>
            <div className="grid gap-2">
              <Label>情感特征</Label>
              <Textarea
                value={config.emotion_style}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange({ ...config, emotion_style: e.target.value })}
                placeholder="影响情绪的变化情况"
                rows={2}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function VoiceSection({
  config,
  onChange,
}: {
  config: VoiceConfig
  onChange: (config: VoiceConfig) => void
}) {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <h3 className="text-lg font-semibold">语音设置</h3>
      <div className="flex items-center space-x-2">
        <Switch
          checked={config.enable_asr}
          onCheckedChange={(checked) => onChange({ ...config, enable_asr: checked })}
        />
        <Label className="cursor-pointer">启用语音识别</Label>
      </div>
      <p className="text-xs text-muted-foreground">
        启用后麦麦可以识别语音消息，需要配置语音识别模型
      </p>
    </div>
  )
}

function LPMMSection({
  config,
  onChange,
}: {
  config: LPMMKnowledgeConfig
  onChange: (config: LPMMKnowledgeConfig) => void
}) {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <h3 className="text-lg font-semibold">LPMM 知识库设置</h3>
      <div className="grid gap-4">
        <div className="flex items-center space-x-2">
          <Switch
            checked={config.enable}
            onCheckedChange={(checked) => onChange({ ...config, enable: checked })}
          />
          <Label className="cursor-pointer">启用 LPMM 知识库</Label>
        </div>

        {config.enable && (
          <>
            <div className="grid gap-2">
              <Label>LPMM 模式</Label>
              <Select
                value={config.lpmm_mode}
                onValueChange={(value) => onChange({ ...config, lpmm_mode: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择 LPMM 模式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="classic">经典模式</SelectItem>
                  <SelectItem value="agent">Agent 模式</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>同义词搜索 TopK</Label>
                <Input
                  type="number"
                  min="1"
                  value={config.rag_synonym_search_top_k}
                  onChange={(e) =>
                    onChange({ ...config, rag_synonym_search_top_k: parseInt(e.target.value) })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label>同义词阈值</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  value={config.rag_synonym_threshold}
                  onChange={(e) =>
                    onChange({ ...config, rag_synonym_threshold: parseFloat(e.target.value) })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label>实体提取线程数</Label>
                <Input
                  type="number"
                  min="1"
                  value={config.info_extraction_workers}
                  onChange={(e) =>
                    onChange({ ...config, info_extraction_workers: parseInt(e.target.value) })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label>嵌入向量维度</Label>
                <Input
                  type="number"
                  min="1"
                  value={config.embedding_dimension}
                  onChange={(e) =>
                    onChange({ ...config, embedding_dimension: parseInt(e.target.value) })
                  }
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// 日志配置组件
function LogSection({
  config,
  onChange,
}: {
  config: LogConfig
  onChange: (config: LogConfig) => void
}) {
  const [newLibrary, setNewLibrary] = useState('')
  const [newLogLevel, setNewLogLevel] = useState('WARNING')

  const addSuppressedLibrary = () => {
    if (newLibrary && !config.suppress_libraries.includes(newLibrary)) {
      onChange({
        ...config,
        suppress_libraries: [...config.suppress_libraries, newLibrary],
      })
      setNewLibrary('')
    }
  }

  const removeSuppressedLibrary = (library: string) => {
    onChange({
      ...config,
      suppress_libraries: config.suppress_libraries.filter((l) => l !== library),
    })
  }

  const addLibraryLogLevel = () => {
    if (newLibrary && !config.library_log_levels[newLibrary]) {
      onChange({
        ...config,
        library_log_levels: { ...config.library_log_levels, [newLibrary]: newLogLevel },
      })
      setNewLibrary('')
      setNewLogLevel('WARNING')
    }
  }

  const removeLibraryLogLevel = (library: string) => {
    const newLevels = { ...config.library_log_levels }
    delete newLevels[library]
    onChange({ ...config, library_log_levels: newLevels })
  }

  const logLevels = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']
  const logLevelStyles = ['FULL', 'compact', 'lite']
  const colorTextOptions = ['none', 'title', 'full']

  return (
    <div className="rounded-lg border bg-card p-4 sm:p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">日志配置</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label>日期格式</Label>
            <Input
              value={config.date_style}
              onChange={(e) => onChange({ ...config, date_style: e.target.value })}
              placeholder="例如: m-d H:i:s"
            />
            <p className="text-xs text-muted-foreground">m=月, d=日, H=时, i=分, s=秒</p>
          </div>

          <div className="grid gap-2">
            <Label>日志级别样式</Label>
            <Select
              value={config.log_level_style}
              onValueChange={(value) => onChange({ ...config, log_level_style: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {logLevelStyles.map((style) => (
                  <SelectItem key={style} value={style}>
                    {style}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>日志文本颜色</Label>
            <Select
              value={config.color_text}
              onValueChange={(value) => onChange({ ...config, color_text: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {colorTextOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>全局日志级别</Label>
            <Select
              value={config.log_level}
              onValueChange={(value) => onChange({ ...config, log_level: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {logLevels.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>控制台日志级别</Label>
            <Select
              value={config.console_log_level}
              onValueChange={(value) => onChange({ ...config, console_log_level: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {logLevels.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>文件日志级别</Label>
            <Select
              value={config.file_log_level}
              onValueChange={(value) => onChange({ ...config, file_log_level: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {logLevels.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 屏蔽的库 */}
      <div>
        <Label className="mb-2 block">完全屏蔽的库</Label>
        <div className="flex gap-2 mb-2">
          <Input
            value={newLibrary}
            onChange={(e) => setNewLibrary(e.target.value)}
            placeholder="输入库名"
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addSuppressedLibrary()
              }
            }}
          />
          <Button onClick={addSuppressedLibrary} size="sm" className="flex-shrink-0">
            <Plus className="h-4 w-4" strokeWidth={2} fill="none" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {config.suppress_libraries.map((library) => (
            <div
              key={library}
              className="flex items-center gap-1 bg-secondary px-3 py-1 rounded-md"
            >
              <span className="text-sm">{library}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0"
                onClick={() => removeSuppressedLibrary(library)}
              >
                <Trash2 className="h-3 w-3" strokeWidth={2} fill="none" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* 特定库日志级别 */}
      <div>
        <Label className="mb-2 block">特定库的日志级别</Label>
        <div className="flex gap-2 mb-2">
          <Input
            value={newLibrary}
            onChange={(e) => setNewLibrary(e.target.value)}
            placeholder="输入库名"
            className="flex-1"
          />
          <Select value={newLogLevel} onValueChange={setNewLogLevel}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {logLevels.map((level) => (
                <SelectItem key={level} value={level}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={addLibraryLogLevel} size="sm">
            <Plus className="h-4 w-4" strokeWidth={2} fill="none" />
          </Button>
        </div>
        <div className="space-y-2">
          {Object.entries(config.library_log_levels).map(([library, level]) => (
            <div
              key={library}
              className="flex items-center justify-between bg-secondary px-3 py-2 rounded-md"
            >
              <span className="text-sm font-medium">{library}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{level}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => removeLibraryLogLevel(library)}
                >
                  <Trash2 className="h-3 w-3" strokeWidth={2} fill="none" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// 调试配置组件
function DebugSection({
  config,
  onChange,
}: {
  config: DebugConfig
  onChange: (config: DebugConfig) => void
}) {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <h3 className="text-lg font-semibold">调试配置</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>显示 Prompt</Label>
            <p className="text-sm text-muted-foreground">是否在日志中显示提示词</p>
          </div>
          <Switch
            checked={config.show_prompt}
            onCheckedChange={(checked) => onChange({ ...config, show_prompt: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>显示回复器 Prompt</Label>
            <p className="text-sm text-muted-foreground">是否显示回复器的提示词</p>
          </div>
          <Switch
            checked={config.show_replyer_prompt}
            onCheckedChange={(checked) => onChange({ ...config, show_replyer_prompt: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>显示回复器推理</Label>
            <p className="text-sm text-muted-foreground">是否显示回复器的推理过程</p>
          </div>
          <Switch
            checked={config.show_replyer_reasoning}
            onCheckedChange={(checked) =>
              onChange({ ...config, show_replyer_reasoning: checked })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>显示 Jargon Prompt</Label>
            <p className="text-sm text-muted-foreground">是否显示术语相关的提示词</p>
          </div>
          <Switch
            checked={config.show_jargon_prompt}
            onCheckedChange={(checked) => onChange({ ...config, show_jargon_prompt: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>显示记忆检索 Prompt</Label>
            <p className="text-sm text-muted-foreground">是否显示记忆检索相关的提示词</p>
          </div>
          <Switch
            checked={config.show_memory_prompt}
            onCheckedChange={(checked) => onChange({ ...config, show_memory_prompt: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>显示 Planner Prompt</Label>
            <p className="text-sm text-muted-foreground">是否显示 Planner 的提示词和原始返回结果</p>
          </div>
          <Switch
            checked={config.show_planner_prompt}
            onCheckedChange={(checked) => onChange({ ...config, show_planner_prompt: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>显示 LPMM 相关文段</Label>
            <p className="text-sm text-muted-foreground">是否显示 LPMM 知识库找到的相关文段日志</p>
          </div>
          <Switch
            checked={config.show_lpmm_paragraph}
            onCheckedChange={(checked) => onChange({ ...config, show_lpmm_paragraph: checked })}
          />
        </div>
      </div>
    </div>
  )
}

// MaimMessage 配置组件
function MaimMessageSection({
  config,
  onChange,
}: {
  config: MaimMessageConfig
  onChange: (config: MaimMessageConfig) => void
}) {
  const [newToken, setNewToken] = useState('')

  const addToken = () => {
    if (newToken && !config.auth_token.includes(newToken)) {
      onChange({ ...config, auth_token: [...config.auth_token, newToken] })
      setNewToken('')
    }
  }

  const removeToken = (index: number) => {
    onChange({
      ...config,
      auth_token: config.auth_token.filter((_, i) => i !== index),
    })
  }

  return (
    <div className="rounded-lg border bg-card p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">MaimMessage 服务配置</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>启用自定义服务器</Label>
              <p className="text-sm text-muted-foreground">
                是否使用自定义的 MaimMessage 服务器
              </p>
            </div>
            <Switch
              checked={config.use_custom}
              onCheckedChange={(checked) => onChange({ ...config, use_custom: checked })}
            />
          </div>

          {config.use_custom && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>主机地址</Label>
                  <Input
                    value={config.host}
                    onChange={(e) => onChange({ ...config, host: e.target.value })}
                    placeholder="127.0.0.1"
                  />
                </div>

                <div className="grid gap-2">
                  <Label>端口号</Label>
                  <Input
                    type="number"
                    value={config.port}
                    onChange={(e) => onChange({ ...config, port: parseInt(e.target.value) })}
                    placeholder="8090"
                  />
                </div>

                <div className="grid gap-2">
                  <Label>连接模式</Label>
                  <Select
                    value={config.mode}
                    onValueChange={(value) => onChange({ ...config, mode: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ws">WebSocket (ws)</SelectItem>
                      <SelectItem value="tcp">TCP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.use_wss}
                    onCheckedChange={(checked) => onChange({ ...config, use_wss: checked })}
                    disabled={config.mode !== 'ws'}
                  />
                  <Label>使用 WSS 安全连接</Label>
                </div>
              </div>

              {config.use_wss && config.mode === 'ws' && (
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>SSL 证书文件路径</Label>
                    <Input
                      value={config.cert_file}
                      onChange={(e) => onChange({ ...config, cert_file: e.target.value })}
                      placeholder="cert.pem"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>SSL 密钥文件路径</Label>
                    <Input
                      value={config.key_file}
                      onChange={(e) => onChange({ ...config, key_file: e.target.value })}
                      placeholder="key.pem"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 认证令牌 */}
      <div>
        <Label className="mb-2 block">认证令牌</Label>
        <p className="text-sm text-muted-foreground mb-2">用于 API 验证，为空则不启用验证</p>
        <div className="flex gap-2 mb-2">
          <Input
            value={newToken}
            onChange={(e) => setNewToken(e.target.value)}
            placeholder="输入认证令牌"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addToken()
              }
            }}
          />
          <Button onClick={addToken} size="sm">
            <Plus className="h-4 w-4" strokeWidth={2} fill="none" />
          </Button>
        </div>
        <div className="space-y-2">
          {config.auth_token.map((token, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-secondary px-3 py-2 rounded-md"
            >
              <span className="text-sm font-mono">{token}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => removeToken(index)}
              >
                <Trash2 className="h-3 w-3" strokeWidth={2} fill="none" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// 统计信息配置组件
function TelemetrySection({
  config,
  onChange,
}: {
  config: TelemetryConfig
  onChange: (config: TelemetryConfig) => void
}) {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <h3 className="text-lg font-semibold">统计信息</h3>
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>启用统计信息发送</Label>
          <p className="text-sm text-muted-foreground">
            发送匿名统计信息，帮助我们了解全球有多少只麦麦在运行
          </p>
        </div>
        <Switch
          checked={config.enable}
          onCheckedChange={(checked) => onChange({ ...config, enable: checked })}
        />
      </div>
    </div>
  )
}

