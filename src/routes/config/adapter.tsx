import { useState, useRef } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info, Upload, Download, FileText, Trash2 } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

interface AdapterConfig {
  inner: {
    version: string
  }
  nickname: {
    nickname: string
  }
  napcat_server: {
    host: string
    port: number
    token: string
    heartbeat_interval: number
  }
  maibot_server: {
    host: string
    port: number
  }
  chat: {
    group_list_type: 'whitelist' | 'blacklist'
    group_list: number[]
    private_list_type: 'whitelist' | 'blacklist'
    private_list: number[]
    ban_user_id: number[]
    ban_qq_bot: boolean
    enable_poke: boolean
  }
  voice: {
    use_tts: boolean
  }
  debug: {
    level: string
  }
}

const DEFAULT_CONFIG: AdapterConfig = {
  inner: {
    version: '0.1.2',
  },
  nickname: {
    nickname: '',
  },
  napcat_server: {
    host: 'localhost',
    port: 8095,
    token: '',
    heartbeat_interval: 30,
  },
  maibot_server: {
    host: 'localhost',
    port: 8000,
  },
  chat: {
    group_list_type: 'whitelist',
    group_list: [],
    private_list_type: 'whitelist',
    private_list: [],
    ban_user_id: [],
    ban_qq_bot: false,
    enable_poke: true,
  },
  voice: {
    use_tts: false,
  },
  debug: {
    level: 'INFO',
  },
}

export function AdapterConfigPage() {
  const [config, setConfig] = useState<AdapterConfig | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // 解析 TOML 内容为配置对象
  const parseTOML = (content: string): AdapterConfig => {
    const config: AdapterConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG))
    const lines = content.split('\n')
    let currentSection = ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue

      // 检测节
      const sectionMatch = trimmed.match(/^\[(\w+)\]$/)
      if (sectionMatch) {
        currentSection = sectionMatch[1]
        continue
      }

      // 解析键值对
      const kvMatch = trimmed.match(/^(\w+)\s*=\s*(.+)$/)
      if (kvMatch && currentSection) {
        const [, key, value] = kvMatch
        const cleanValue = value.trim()

        // 解析值
        let parsedValue: string | number | boolean | number[]
        if (cleanValue === 'true') {
          parsedValue = true
        } else if (cleanValue === 'false') {
          parsedValue = false
        } else if (cleanValue.startsWith('[') && cleanValue.endsWith(']')) {
          // 解析数组
          const arrayContent = cleanValue.slice(1, -1).trim()
          parsedValue = arrayContent
            ? arrayContent.split(',').map((v) => {
                const trimmedV = v.trim()
                return isNaN(Number(trimmedV)) ? trimmedV.replace(/"/g, '') : Number(trimmedV)
              })
            : []
        } else if (cleanValue.startsWith('"') && cleanValue.endsWith('"')) {
          parsedValue = cleanValue.slice(1, -1)
        } else if (!isNaN(Number(cleanValue))) {
          parsedValue = Number(cleanValue)
        } else {
          parsedValue = cleanValue.replace(/"/g, '')
        }

        // 设置到配置对象
        if (currentSection in config) {
          const section = config[currentSection as keyof AdapterConfig] as Record<string, unknown>
          section[key] = parsedValue
        }
      }
    }

    return config
  }

  // 将配置对象转换为 TOML 格式（空值使用默认值填充）
  const generateTOML = (config: AdapterConfig): string => {
    const lines: string[] = []

    // 填充默认值的辅助函数
    const fillDefaults = (value: string | number, defaultValue: string | number): string | number => {
      if (value === '' || value === null || value === undefined) {
        return defaultValue
      }
      return value
    }

    // Inner section
    lines.push('[inner]')
    lines.push(`version = "${fillDefaults(config.inner.version, DEFAULT_CONFIG.inner.version)}" # 版本号`)
    lines.push('# 请勿修改版本号，除非你知道自己在做什么')
    lines.push('')

    // Nickname section
    lines.push('[nickname] # 现在没用')
    lines.push(`nickname = "${fillDefaults(config.nickname.nickname, DEFAULT_CONFIG.nickname.nickname)}"`)
    lines.push('')

    // Napcat server section
    lines.push('[napcat_server] # Napcat连接的ws服务设置')
    lines.push(`host = "${fillDefaults(config.napcat_server.host, DEFAULT_CONFIG.napcat_server.host)}"      # Napcat设定的主机地址`)
    lines.push(`port = ${fillDefaults(config.napcat_server.port || 0, DEFAULT_CONFIG.napcat_server.port)}             # Napcat设定的端口`)
    lines.push(`token = "${fillDefaults(config.napcat_server.token, DEFAULT_CONFIG.napcat_server.token)}"              # Napcat设定的访问令牌，若无则留空`)
    lines.push(`heartbeat_interval = ${fillDefaults(config.napcat_server.heartbeat_interval || 0, DEFAULT_CONFIG.napcat_server.heartbeat_interval)} # 与Napcat设置的心跳相同（按秒计）`)
    lines.push('')

    // MaiBot server section
    lines.push('[maibot_server] # 连接麦麦的ws服务设置')
    lines.push(`host = "${fillDefaults(config.maibot_server.host, DEFAULT_CONFIG.maibot_server.host)}" # 麦麦在.env文件中设置的主机地址，即HOST字段`)
    lines.push(`port = ${fillDefaults(config.maibot_server.port || 0, DEFAULT_CONFIG.maibot_server.port)}        # 麦麦在.env文件中设置的端口，即PORT字段`)
    lines.push('')

    // Chat section
    lines.push('[chat] # 黑白名单功能')
    lines.push(`group_list_type = "${fillDefaults(config.chat.group_list_type, DEFAULT_CONFIG.chat.group_list_type)}" # 群组名单类型，可选为：whitelist, blacklist`)
    lines.push(`group_list = [${config.chat.group_list.join(', ')}]               # 群组名单`)
    lines.push('# 当group_list_type为whitelist时，只有群组名单中的群组可以聊天')
    lines.push('# 当group_list_type为blacklist时，群组名单中的任何群组无法聊天')
    lines.push(`private_list_type = "${fillDefaults(config.chat.private_list_type, DEFAULT_CONFIG.chat.private_list_type)}" # 私聊名单类型，可选为：whitelist, blacklist`)
    lines.push(`private_list = [${config.chat.private_list.join(', ')}]               # 私聊名单`)
    lines.push('# 当private_list_type为whitelist时，只有私聊名单中的用户可以聊天')
    lines.push('# 当private_list_type为blacklist时，私聊名单中的任何用户无法聊天')
    lines.push(`ban_user_id = [${config.chat.ban_user_id.join(', ')}]   # 全局禁止名单（全局禁止名单中的用户无法进行任何聊天）`)
    lines.push(`ban_qq_bot = ${config.chat.ban_qq_bot} # 是否屏蔽QQ官方机器人`)
    lines.push(`enable_poke = ${config.chat.enable_poke} # 是否启用戳一戳功能`)
    lines.push('')

    // Voice section
    lines.push('[voice] # 发送语音设置')
    lines.push(`use_tts = ${config.voice.use_tts} # 是否使用tts语音（请确保你配置了tts并有对应的adapter）`)
    lines.push('')

    // Debug section
    lines.push('[debug]')
    lines.push(`level = "${fillDefaults(config.debug.level, DEFAULT_CONFIG.debug.level)}" # 日志等级（DEBUG, INFO, WARNING, ERROR, CRITICAL）`)

    return lines.join('\n')
  }

  // 上传文件处理
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const parsedConfig = parseTOML(content)
        setConfig(parsedConfig)
        setFileName(file.name)
        toast({
          title: '上传成功',
          description: `已加载配置文件：${file.name}`,
        })
      } catch (error) {
        console.error('解析配置文件失败:', error)
        toast({
          title: '解析失败',
          description: '配置文件格式错误，请检查文件内容',
          variant: 'destructive',
        })
      }
    }
    reader.readAsText(file)
  }

  // 下载配置文件
  const handleDownload = () => {
    if (!config) return

    const tomlContent = generateTOML(config)
    const blob = new Blob([tomlContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName || 'adapter_config.toml'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: '下载成功',
      description: '配置文件已下载，请手动覆盖并重启适配器',
    })
  }

  // 使用默认配置
  const handleUseDefault = () => {
    setConfig(JSON.parse(JSON.stringify(DEFAULT_CONFIG)))
    setFileName('adapter_config.toml')
    toast({
      title: '已加载默认配置',
      description: '可以开始编辑配置',
    })
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        {/* 页面标题 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">麦麦适配器配置</h1>
            <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
              管理麦麦的 QQ 适配器的配置文件
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {!config && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".toml"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  size="sm"
                  variant="outline"
                  className="flex-1 sm:flex-none"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  上传配置
                </Button>
                <Button onClick={handleUseDefault} size="sm" className="flex-1 sm:flex-none">
                  <FileText className="mr-2 h-4 w-4" />
                  使用默认配置
                </Button>
              </>
            )}
            {config && (
              <Button onClick={handleDownload} size="sm">
                <Download className="mr-2 h-4 w-4" />
                下载配置
              </Button>
            )}
          </div>
        </div>

        {/* 操作提示 */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            适配器独立运行，需要{' '}
            <strong>上传配置文件 → 在线编辑 → 下载文件 → 手动覆盖并重启适配器</strong>。
          </AlertDescription>
        </Alert>

        {/* 配置编辑区域 */}
        {!config ? (
          <div className="rounded-lg border bg-card p-12">
            <div className="text-center space-y-4">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold">尚未加载配置</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  请上传现有配置文件，或使用默认配置开始编辑
                </p>
              </div>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="napcat" className="w-full">
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:grid-cols-5">
                <TabsTrigger value="napcat" className="flex-shrink-0">Napcat 连接</TabsTrigger>
                <TabsTrigger value="maibot" className="flex-shrink-0">麦麦连接</TabsTrigger>
                <TabsTrigger value="chat" className="flex-shrink-0">聊天控制</TabsTrigger>
                <TabsTrigger value="voice" className="flex-shrink-0">语音设置</TabsTrigger>
                <TabsTrigger value="debug" className="flex-shrink-0">调试</TabsTrigger>
              </TabsList>
            </div>

            {/* Napcat 服务器配置 */}
            <TabsContent value="napcat" className="space-y-4">
              <NapcatServerSection config={config} onChange={setConfig} />
            </TabsContent>

            {/* 麦麦服务器配置 */}
            <TabsContent value="maibot" className="space-y-4">
              <MaiBotServerSection config={config} onChange={setConfig} />
            </TabsContent>

            {/* 聊天控制配置 */}
            <TabsContent value="chat" className="space-y-4">
              <ChatControlSection config={config} onChange={setConfig} />
            </TabsContent>

            {/* 语音配置 */}
            <TabsContent value="voice" className="space-y-4">
              <VoiceSection config={config} onChange={setConfig} />
            </TabsContent>

            {/* 调试配置 */}
            <TabsContent value="debug" className="space-y-4">
              <DebugSection config={config} onChange={setConfig} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </ScrollArea>
  )
}

// Napcat 服务器配置组件
function NapcatServerSection({
  config,
  onChange,
}: {
  config: AdapterConfig
  onChange: (config: AdapterConfig) => void
}) {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Napcat WebSocket 服务设置</h3>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="napcat-host">主机地址</Label>
            <Input
              id="napcat-host"
              value={config.napcat_server.host}
              onChange={(e) =>
                onChange({
                  ...config,
                  napcat_server: { ...config.napcat_server, host: e.target.value },
                })
              }
              placeholder="localhost"
            />
            <p className="text-xs text-muted-foreground">Napcat 设定的主机地址</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="napcat-port">端口</Label>
            <Input
              id="napcat-port"
              type="number"
              value={config.napcat_server.port || ''}
              onChange={(e) =>
                onChange({
                  ...config,
                  napcat_server: { ...config.napcat_server, port: e.target.value ? parseInt(e.target.value) : 0 },
                })
              }
              placeholder="8095"
            />
            <p className="text-xs text-muted-foreground">Napcat 设定的端口（留空使用默认值 8095）</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="napcat-token">访问令牌（Token）</Label>
            <Input
              id="napcat-token"
              type="password"
              value={config.napcat_server.token}
              onChange={(e) =>
                onChange({
                  ...config,
                  napcat_server: { ...config.napcat_server, token: e.target.value },
                })
              }
              placeholder="留空表示无需令牌"
            />
            <p className="text-xs text-muted-foreground">Napcat 设定的访问令牌，若无则留空</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="napcat-heartbeat">心跳间隔（秒）</Label>
            <Input
              id="napcat-heartbeat"
              type="number"
              value={config.napcat_server.heartbeat_interval || ''}
              onChange={(e) =>
                onChange({
                  ...config,
                  napcat_server: {
                    ...config.napcat_server,
                    heartbeat_interval: e.target.value ? parseInt(e.target.value) : 0,
                  },
                })
              }
              placeholder="30"
            />
            <p className="text-xs text-muted-foreground">与 Napcat 设置的心跳间隔保持一致（留空使用默认值 30）</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// 麦麦服务器配置组件
function MaiBotServerSection({
  config,
  onChange,
}: {
  config: AdapterConfig
  onChange: (config: AdapterConfig) => void
}) {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">麦麦 WebSocket 服务设置</h3>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="maibot-host">主机地址</Label>
            <Input
              id="maibot-host"
              value={config.maibot_server.host}
              onChange={(e) =>
                onChange({
                  ...config,
                  maibot_server: { ...config.maibot_server, host: e.target.value },
                })
              }
              placeholder="localhost"
            />
            <p className="text-xs text-muted-foreground">麦麦在 .env 文件中设置的 HOST 字段</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="maibot-port">端口</Label>
            <Input
              id="maibot-port"
              type="number"
              value={config.maibot_server.port || ''}
              onChange={(e) =>
                onChange({
                  ...config,
                  maibot_server: { ...config.maibot_server, port: e.target.value ? parseInt(e.target.value) : 0 },
                })
              }
              placeholder="8000"
            />
            <p className="text-xs text-muted-foreground">麦麦在 .env 文件中设置的 PORT 字段（留空使用默认值 8000）</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// 聊天控制配置组件
function ChatControlSection({
  config,
  onChange,
}: {
  config: AdapterConfig
  onChange: (config: AdapterConfig) => void
}) {
  const addToList = (listType: 'group' | 'private' | 'ban') => {
    const newConfig = { ...config }
    if (listType === 'group') {
      newConfig.chat.group_list = [...newConfig.chat.group_list, 0]
    } else if (listType === 'private') {
      newConfig.chat.private_list = [...newConfig.chat.private_list, 0]
    } else {
      newConfig.chat.ban_user_id = [...newConfig.chat.ban_user_id, 0]
    }
    onChange(newConfig)
  }

  const removeFromList = (listType: 'group' | 'private' | 'ban', index: number) => {
    const newConfig = { ...config }
    if (listType === 'group') {
      newConfig.chat.group_list = newConfig.chat.group_list.filter((_, i) => i !== index)
    } else if (listType === 'private') {
      newConfig.chat.private_list = newConfig.chat.private_list.filter((_, i) => i !== index)
    } else {
      newConfig.chat.ban_user_id = newConfig.chat.ban_user_id.filter((_, i) => i !== index)
    }
    onChange(newConfig)
  }

  const updateListItem = (listType: 'group' | 'private' | 'ban', index: number, value: number) => {
    const newConfig = { ...config }
    if (listType === 'group') {
      newConfig.chat.group_list[index] = value
    } else if (listType === 'private') {
      newConfig.chat.private_list[index] = value
    } else {
      newConfig.chat.ban_user_id[index] = value
    }
    onChange(newConfig)
  }

  return (
    <div className="rounded-lg border bg-card p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">聊天黑白名单功能</h3>
        <div className="grid gap-6">
          {/* 群组名单 */}
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>群组名单类型</Label>
              <Select
                value={config.chat.group_list_type}
                onValueChange={(value: 'whitelist' | 'blacklist') =>
                  onChange({
                    ...config,
                    chat: { ...config.chat, group_list_type: value },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whitelist">白名单（仅名单内可聊天）</SelectItem>
                  <SelectItem value="blacklist">黑名单（名单内禁止聊天）</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>群组列表</Label>
                <Button onClick={() => addToList('group')} size="sm" variant="outline">
                  <FileText className="mr-1 h-4 w-4" />
                  添加群号
                </Button>
              </div>
              {config.chat.group_list.map((groupId, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="number"
                    value={groupId}
                    onChange={(e) => updateListItem('group', index, parseInt(e.target.value) || 0)}
                    placeholder="输入群号"
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
                          确定要删除群号 {groupId} 吗？此操作无法撤销。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={() => removeFromList('group', index)}>
                          删除
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
              {config.chat.group_list.length === 0 && (
                <p className="text-sm text-muted-foreground">暂无群组</p>
              )}
            </div>
          </div>

          {/* 私聊名单 */}
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>私聊名单类型</Label>
              <Select
                value={config.chat.private_list_type}
                onValueChange={(value: 'whitelist' | 'blacklist') =>
                  onChange({
                    ...config,
                    chat: { ...config.chat, private_list_type: value },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whitelist">白名单（仅名单内可聊天）</SelectItem>
                  <SelectItem value="blacklist">黑名单（名单内禁止聊天）</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>私聊列表</Label>
                <Button onClick={() => addToList('private')} size="sm" variant="outline">
                  <FileText className="mr-1 h-4 w-4" />
                  添加用户
                </Button>
              </div>
              {config.chat.private_list.map((userId, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="number"
                    value={userId}
                    onChange={(e) => updateListItem('private', index, parseInt(e.target.value) || 0)}
                    placeholder="输入QQ号"
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
                          确定要删除用户 {userId} 吗？此操作无法撤销。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={() => removeFromList('private', index)}>
                          删除
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
              {config.chat.private_list.length === 0 && (
                <p className="text-sm text-muted-foreground">暂无用户</p>
              )}
            </div>
          </div>

          {/* 全局禁止名单 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <Label>全局禁止名单</Label>
                <p className="text-xs text-muted-foreground mt-1">名单中的用户无法进行任何聊天</p>
              </div>
              <Button onClick={() => addToList('ban')} size="sm" variant="outline">
                <FileText className="mr-1 h-4 w-4" />
                添加用户
              </Button>
            </div>
            {config.chat.ban_user_id.map((userId, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  type="number"
                  value={userId}
                  onChange={(e) => updateListItem('ban', index, parseInt(e.target.value) || 0)}
                  placeholder="输入QQ号"
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
                        确定要从全局禁止名单中删除用户 {userId} 吗？此操作无法撤销。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction onClick={() => removeFromList('ban', index)}>
                        删除
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
            {config.chat.ban_user_id.length === 0 && (
              <p className="text-sm text-muted-foreground">暂无禁止用户</p>
            )}
          </div>

          {/* 其他设置 */}
          <div className="flex items-center justify-between">
            <div>
              <Label>屏蔽QQ官方机器人</Label>
              <p className="text-xs text-muted-foreground mt-1">是否屏蔽来自QQ官方机器人的消息</p>
            </div>
            <Switch
              checked={config.chat.ban_qq_bot}
              onCheckedChange={(checked) =>
                onChange({
                  ...config,
                  chat: { ...config.chat, ban_qq_bot: checked },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>启用戳一戳功能</Label>
              <p className="text-xs text-muted-foreground mt-1">是否响应戳一戳消息</p>
            </div>
            <Switch
              checked={config.chat.enable_poke}
              onCheckedChange={(checked) =>
                onChange({
                  ...config,
                  chat: { ...config.chat, enable_poke: checked },
                })
              }
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// 语音配置组件
function VoiceSection({
  config,
  onChange,
}: {
  config: AdapterConfig
  onChange: (config: AdapterConfig) => void
}) {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">发送语音设置</h3>
        <div className="flex items-center justify-between">
          <div>
            <Label>使用 TTS 语音</Label>
            <p className="text-xs text-muted-foreground mt-1">
              请确保已配置 TTS 并有对应的适配器
            </p>
          </div>
          <Switch
            checked={config.voice.use_tts}
            onCheckedChange={(checked) =>
              onChange({
                ...config,
                voice: { use_tts: checked },
              })
            }
          />
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
  config: AdapterConfig
  onChange: (config: AdapterConfig) => void
}) {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">调试设置</h3>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>日志等级</Label>
            <Select
              value={config.debug.level}
              onValueChange={(value) =>
                onChange({
                  ...config,
                  debug: { level: value },
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DEBUG">DEBUG（调试）</SelectItem>
                <SelectItem value="INFO">INFO（信息）</SelectItem>
                <SelectItem value="WARNING">WARNING（警告）</SelectItem>
                <SelectItem value="ERROR">ERROR（错误）</SelectItem>
                <SelectItem value="CRITICAL">CRITICAL（严重）</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">设置适配器的日志输出等级</p>
          </div>
        </div>
      </div>
    </div>
  )
}
