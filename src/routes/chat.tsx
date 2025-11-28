import { useState, useRef, useEffect, useCallback } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
// Card 组件已移除，改用更简洁的全屏布局
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Send, Bot, User, Loader2, WifiOff, Wifi, RefreshCw, Edit2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

// 生成唯一用户 ID
function generateUserId(): string {
  return 'webui_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36)
}

// 从 localStorage 获取或生成用户 ID
function getOrCreateUserId(): string {
  const storageKey = 'maibot_webui_user_id'
  let userId = localStorage.getItem(storageKey)
  if (!userId) {
    userId = generateUserId()
    localStorage.setItem(storageKey, userId)
  }
  return userId
}

// 从 localStorage 获取用户昵称
function getStoredUserName(): string {
  return localStorage.getItem('maibot_webui_user_name') || 'WebUI用户'
}

// 保存用户昵称到 localStorage
function saveUserName(name: string): void {
  localStorage.setItem('maibot_webui_user_name', name)
}

// 消息类型
interface ChatMessage {
  id: string
  type: 'user' | 'bot' | 'system' | 'error'
  content: string
  timestamp: number
  sender?: {
    name: string
    user_id?: string
    is_bot?: boolean
  }
}

// WebSocket 消息类型
interface WsMessage {
  type: string
  content?: string
  message_id?: string
  timestamp?: number
  is_typing?: boolean
  session_id?: string
  user_id?: string
  user_name?: string
  bot_name?: string
  sender?: {
    name: string
    user_id?: string
    is_bot?: boolean
  }
}

export function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [userName, setUserName] = useState(getStoredUserName())
  const [isEditingName, setIsEditingName] = useState(false)
  const [tempUserName, setTempUserName] = useState('')
  const [sessionInfo, setSessionInfo] = useState<{
    session_id?: string
    user_id?: string
    user_name?: string
    bot_name?: string
  }>({})
  
  // 持久化用户 ID
  const userIdRef = useRef(getOrCreateUserId())
  
  const wsRef = useRef<WebSocket | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const reconnectTimeoutRef = useRef<number | null>(null)
  const messageIdCounterRef = useRef(0)  // 用于生成唯一 ID
  const processedMessagesRef = useRef<Set<string>>(new Set())  // 用于去重
  const { toast } = useToast()

  // 生成唯一消息 ID
  const generateMessageId = (prefix: string) => {
    messageIdCounterRef.current += 1
    return `${prefix}-${Date.now()}-${messageIdCounterRef.current}-${Math.random().toString(36).substr(2, 9)}`
  }

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // 自动滚动
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // 加载聊天历史
  const loadChatHistory = useCallback(async () => {
    setIsLoadingHistory(true)
    try {
      // 使用相对路径，由 Vite 代理转发到后端
      const url = `/api/chat/history?user_id=${userIdRef.current}&limit=50`
      console.log('[Chat] 正在加载历史消息:', url)
      
      const response = await fetch(url)
      console.log('[Chat] 历史消息响应状态:', response.status, response.statusText)
      console.log('[Chat] 响应 Content-Type:', response.headers.get('content-type'))
      
      if (response.ok) {
        const text = await response.text()
        console.log('[Chat] 响应内容前100字符:', text.substring(0, 100))
        
        try {
          const data = JSON.parse(text)
          console.log('[Chat] 解析后的数据:', data)
          
          if (data.messages && data.messages.length > 0) {
            // 将历史消息转换为前端格式
            const historyMessages: ChatMessage[] = data.messages.map((msg: {
              id: string
              type: string
              content: string
              timestamp: number
              sender_name?: string
              user_id?: string
              is_bot?: boolean
            }) => ({
              id: msg.id,
              type: msg.type as 'user' | 'bot' | 'system' | 'error',
              content: msg.content,
              timestamp: msg.timestamp,
              sender: {
                name: msg.sender_name || (msg.is_bot ? '麦麦' : 'WebUI用户'),
                user_id: msg.user_id,
                is_bot: msg.is_bot
              }
            }))
            setMessages(historyMessages)
            console.log('[Chat] 已加载历史消息数量:', historyMessages.length)
            // 将历史消息添加到去重缓存
            historyMessages.forEach(msg => {
              if (msg.type === 'bot') {
                const contentHash = `bot-${msg.content}-${Math.floor(msg.timestamp * 1000)}`
                processedMessagesRef.current.add(contentHash)
              }
            })
          } else {
            console.log('[Chat] 没有历史消息')
          }
        } catch (parseError) {
          console.error('[Chat] JSON 解析失败:', parseError)
          console.error('[Chat] 原始响应内容:', text)
        }
      } else {
        console.error('[Chat] 响应失败:', response.status)
        const errorText = await response.text()
        console.error('[Chat] 错误响应内容:', errorText.substring(0, 200))
      }
    } catch (e) {
      console.error('[Chat] 加载历史消息失败:', e)
    } finally {
      setIsLoadingHistory(false)
    }
  }, [])

  // 连接 WebSocket
  const connectWebSocket = useCallback(() => {
    // 如果已经有连接或正在连接，不要重复创建
    if (wsRef.current?.readyState === WebSocket.OPEN || 
        wsRef.current?.readyState === WebSocket.CONNECTING) {
      console.log('WebSocket 已存在，跳过连接')
      return
    }

    setIsConnecting(true)

    // 构建 WebSocket URL
    // 使用当前页面的 host，开发模式下 Vite 会代理 /api 路径
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/api/chat/ws?user_id=${encodeURIComponent(userIdRef.current)}&user_name=${encodeURIComponent(userName)}`

    console.log('正在连接 WebSocket:', wsUrl)

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        setIsConnected(true)
        setIsConnecting(false)
        console.log('WebSocket 已连接')
      }

      ws.onmessage = (event) => {
        try {
          const data: WsMessage = JSON.parse(event.data)
          // 内联处理消息
          switch (data.type) {
            case 'session_info':
              setSessionInfo({
                session_id: data.session_id,
                user_id: data.user_id,
                user_name: data.user_name,
                bot_name: data.bot_name,
              })
              break

            case 'system':
              setMessages((prev) => [
                ...prev,
                {
                  id: generateMessageId('sys'),
                  type: 'system',
                  content: data.content || '',
                  timestamp: data.timestamp || Date.now() / 1000,
                },
              ])
              break

            case 'user_message':
              setMessages((prev) => [
                ...prev,
                {
                  id: data.message_id || generateMessageId('user'),
                  type: 'user',
                  content: data.content || '',
                  timestamp: data.timestamp || Date.now() / 1000,
                  sender: data.sender,
                },
              ])
              break

            case 'bot_message': {
              setIsTyping(false)
              // 使用内容哈希去重
              const contentHash = `bot-${data.content}-${Math.floor((data.timestamp || 0) * 1000)}`
              if (processedMessagesRef.current.has(contentHash)) {
                console.log('跳过重复的机器人消息')
                break
              }
              processedMessagesRef.current.add(contentHash)
              // 限制去重缓存大小
              if (processedMessagesRef.current.size > 100) {
                const firstKey = processedMessagesRef.current.values().next().value
                if (firstKey) processedMessagesRef.current.delete(firstKey)
              }
              
              setMessages((prev) => [
                ...prev,
                {
                  id: generateMessageId('bot'),
                  type: 'bot',
                  content: data.content || '',
                  timestamp: data.timestamp || Date.now() / 1000,
                  sender: data.sender,
                },
              ])
              break
            }

            case 'typing':
              setIsTyping(data.is_typing || false)
              break

            case 'error':
              setMessages((prev) => [
                ...prev,
                {
                  id: generateMessageId('error'),
                  type: 'error',
                  content: data.content || '发生错误',
                  timestamp: data.timestamp || Date.now() / 1000,
                },
              ])
              toast({
                title: '错误',
                description: data.content,
                variant: 'destructive',
              })
              break

            case 'pong':
              // 心跳响应，不需要处理
              break

            default:
              console.log('未知消息类型:', data.type)
          }
        } catch (e) {
          console.error('解析消息失败:', e)
        }
      }

      ws.onclose = () => {
        setIsConnected(false)
        setIsConnecting(false)
        wsRef.current = null
        console.log('WebSocket 已断开')

        // 只有当组件还挂载时才尝试重连（通过检查 isConnectingRef）
        // 5 秒后尝试重连
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
        }
        reconnectTimeoutRef.current = window.setTimeout(() => {
          // 检查是否应该重连（组件未卸载）
          if (!isUnmountedRef.current) {
            connectWebSocket()
          }
        }, 5000)
      }

      ws.onerror = (error) => {
        console.error('WebSocket 错误:', error)
        setIsConnecting(false)
      }
    } catch (e) {
      console.error('创建 WebSocket 失败:', e)
      setIsConnecting(false)
    }
  }, [toast, userName])

  // 用于追踪组件是否已卸载
  const isUnmountedRef = useRef(false)

  // 初始化连接
  useEffect(() => {
    isUnmountedRef.current = false
    
    // 首先加载历史消息
    loadChatHistory()
    
    // 延迟一点连接，避免 Strict Mode 的双重调用问题
    const connectTimer = setTimeout(() => {
      if (!isUnmountedRef.current) {
        connectWebSocket()
      }
    }, 100)

    // 心跳定时器
    const heartbeat = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }))
      }
    }, 30000)

    return () => {
      isUnmountedRef.current = true
      clearTimeout(connectTimer)
      clearInterval(heartbeat)
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [connectWebSocket, loadChatHistory])

  // 发送消息
  const sendMessage = useCallback(() => {
    if (!inputValue.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return
    }

    wsRef.current.send(
      JSON.stringify({
        type: 'message',
        content: inputValue.trim(),
        user_name: userName,
      })
    )

    setInputValue('')
  }, [inputValue, userName])

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // 处理昵称编辑
  const startEditingName = () => {
    setTempUserName(userName)
    setIsEditingName(true)
  }

  const saveEditedName = () => {
    const newName = tempUserName.trim() || 'WebUI用户'
    setUserName(newName)
    saveUserName(newName)
    setIsEditingName(false)
    // 通知后端昵称变更
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'update_nickname',
        user_name: newName
      }))
    }
  }

  const cancelEditingName = () => {
    setTempUserName('')
    setIsEditingName(false)
  }

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // 重新连接
  const handleReconnect = () => {
    if (wsRef.current) {
      wsRef.current.close()
    }
    connectWebSocket()
  }

  return (
    <div className="h-full flex flex-col">
      {/* 移动端：简化的头部 */}
      <div className="shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="p-3 sm:p-4 max-w-4xl mx-auto">
          {/* 标题行 */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Avatar className="h-8 w-8 sm:h-10 sm:w-10 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary">
                  <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-semibold truncate">
                  {sessionInfo.bot_name || '麦麦'}
                </h1>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {isConnected ? (
                    <>
                      <Wifi className="h-3 w-3 text-green-500" />
                      <span className="text-green-600 dark:text-green-400">已连接</span>
                    </>
                  ) : isConnecting ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>连接中...</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="h-3 w-3 text-red-500" />
                      <span className="text-red-600 dark:text-red-400">未连接</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* 右侧操作按钮 */}
            <div className="flex items-center gap-1 shrink-0">
              {isLoadingHistory && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleReconnect}
                disabled={isConnecting}
                title="重新连接"
              >
                <RefreshCw className={cn('h-4 w-4', isConnecting && 'animate-spin')} />
              </Button>
            </div>
          </div>
          
          {/* 用户身份（桌面端显示更多信息） */}
          <div className="hidden sm:flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <User className="h-3 w-3" />
            <span>当前身份：</span>
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={tempUserName}
                  onChange={(e) => setTempUserName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEditedName()
                    if (e.key === 'Escape') cancelEditingName()
                  }}
                  className="h-7 w-32"
                  placeholder="输入昵称"
                  autoFocus
                />
                <Button size="sm" variant="ghost" className="h-7 px-2" onClick={saveEditedName}>
                  保存
                </Button>
                <Button size="sm" variant="ghost" className="h-7 px-2" onClick={cancelEditingName}>
                  取消
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <span className="font-medium text-foreground">{userName}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={startEditingName}
                  title="修改昵称"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 消息列表区域 */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-3 sm:p-4 max-w-4xl mx-auto space-y-3 sm:space-y-4">
            {messages.length === 0 && !isLoadingHistory && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Bot className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-sm">开始与 {sessionInfo.bot_name || '麦麦'} 对话吧！</p>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-2 sm:gap-3',
                  message.type === 'user' && 'flex-row-reverse',
                  message.type === 'system' && 'justify-center',
                  message.type === 'error' && 'justify-center'
                )}
              >
                {/* 系统消息 */}
                {message.type === 'system' && (
                  <div className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full max-w-[90%]">
                    {message.content}
                  </div>
                )}

                {/* 错误消息 */}
                {message.type === 'error' && (
                  <div className="text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-3 py-1 rounded-full max-w-[90%]">
                    {message.content}
                  </div>
                )}

                {/* 用户/机器人消息 */}
                {(message.type === 'user' || message.type === 'bot') && (
                  <>
                    <Avatar className="h-7 w-7 sm:h-8 sm:w-8 shrink-0">
                      <AvatarFallback
                        className={cn(
                          'text-xs',
                          message.type === 'bot'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-secondary text-secondary-foreground'
                        )}
                      >
                        {message.type === 'bot' ? (
                          <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        ) : (
                          <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={cn(
                        'flex flex-col gap-1 max-w-[75%] sm:max-w-[70%]',
                        message.type === 'user' && 'items-end'
                      )}
                    >
                      <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground">
                        <span className="hidden sm:inline">{message.sender?.name || (message.type === 'bot' ? sessionInfo.bot_name : userName)}</span>
                        <span>{formatTime(message.timestamp)}</span>
                      </div>
                      <div
                        className={cn(
                          'rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words',
                          message.type === 'bot'
                            ? 'bg-muted rounded-tl-sm'
                            : 'bg-primary text-primary-foreground rounded-tr-sm'
                        )}
                      >
                        {message.content}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}

            {/* 正在输入指示器 */}
            {isTyping && (
              <div className="flex gap-2 sm:gap-3">
                <Avatar className="h-7 w-7 sm:h-8 sm:w-8 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* 输入区域 - 固定在底部 */}
      <div className="shrink-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="p-3 sm:p-4 max-w-4xl mx-auto">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isConnected ? '输入消息...' : '等待连接...'}
              disabled={!isConnected}
              className="flex-1 h-10 sm:h-10"
            />
            <Button
              onClick={sendMessage}
              disabled={!isConnected || !inputValue.trim()}
              size="icon"
              className="h-10 w-10 shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
