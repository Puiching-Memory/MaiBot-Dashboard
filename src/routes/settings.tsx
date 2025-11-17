import { Settings as  Palette, Info, Bell, Shield, Eye, EyeOff, Copy, RefreshCw, Check, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import { useTheme } from '@/components/use-theme'
import { useAnimation } from '@/hooks/use-animation'
import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { validateToken } from '@/lib/token-validator'
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export function SettingsPage() {
  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">系统设置</h1>
          <p className="text-muted-foreground mt-2">管理您的应用偏好设置</p>
        </div>
      </div>

      {/* 标签页 */}
      <Tabs defaultValue="appearance" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" strokeWidth={2} fill="none" />
            外观
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" strokeWidth={2} fill="none" />
            通知
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" strokeWidth={2} fill="none" />
            安全
          </TabsTrigger>
          <TabsTrigger value="about" className="gap-2">
            <Info className="h-4 w-4" strokeWidth={2} fill="none" />
            关于
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="mt-6">
          <AppearanceTab />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <NotificationsTab />
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <SecurityTab />
        </TabsContent>

        <TabsContent value="about" className="mt-6">
          <AboutTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// 外观设置标签页
function AppearanceTab() {
  const { theme, setTheme } = useTheme()
  const { enableAnimations, setEnableAnimations } = useAnimation()
  const [accentColor, setAccentColor] = useState(() => {
    return localStorage.getItem('accent-color') || 'blue'
  })

  const handleAccentColorChange = (color: string) => {
    setAccentColor(color)
    localStorage.setItem('accent-color', color)
    
    // 更新 CSS 变量
    const root = document.documentElement
    const colors = {
      blue: { hsl: '221.2 83.2% 53.3%', darkHsl: '217.2 91.2% 59.8%' },
      purple: { hsl: '271 91% 65%', darkHsl: '270 95% 75%' },
      green: { hsl: '142 71% 45%', darkHsl: '142 76% 36%' },
      orange: { hsl: '25 95% 53%', darkHsl: '20 90% 48%' },
      pink: { hsl: '330 81% 60%', darkHsl: '330 85% 70%' },
    }

    const selectedColor = colors[color as keyof typeof colors]
    if (selectedColor) {
      root.style.setProperty('--primary', selectedColor.hsl)
      // 如果需要在暗色模式下使用不同的色调，可以在这里处理
    }
  }

  return (
    <div className="space-y-8">
      {/* 主题模式 */}
      <div>
        <h3 className="text-lg font-semibold mb-4">主题模式</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ThemeOption
            value="light"
            current={theme}
            onChange={setTheme}
            label="浅色"
            description="始终使用浅色主题"
          />
          <ThemeOption
            value="dark"
            current={theme}
            onChange={setTheme}
            label="深色"
            description="始终使用深色主题"
          />
          <ThemeOption
            value="system"
            current={theme}
            onChange={setTheme}
            label="跟随系统"
            description="根据系统设置自动切换"
          />
        </div>
      </div>

      {/* 主题色 */}
      <div>
        <h3 className="text-lg font-semibold mb-4">主题色</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <AccentColorOption
            value="blue"
            current={accentColor}
            onChange={handleAccentColorChange}
            label="蓝色"
            colorClass="bg-blue-500"
          />
          <AccentColorOption
            value="purple"
            current={accentColor}
            onChange={handleAccentColorChange}
            label="紫色"
            colorClass="bg-purple-500"
          />
          <AccentColorOption
            value="green"
            current={accentColor}
            onChange={handleAccentColorChange}
            label="绿色"
            colorClass="bg-green-500"
          />
          <AccentColorOption
            value="orange"
            current={accentColor}
            onChange={handleAccentColorChange}
            label="橙色"
            colorClass="bg-orange-500"
          />
          <AccentColorOption
            value="pink"
            current={accentColor}
            onChange={handleAccentColorChange}
            label="粉色"
            colorClass="bg-pink-500"
          />
        </div>
      </div>

      {/* 动效设置 */}
      <div>
        <h3 className="text-lg font-semibold mb-4">动画效果</h3>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 flex-1">
              <Label htmlFor="animations" className="text-base font-medium cursor-pointer">
                启用动画效果
              </Label>
              <p className="text-sm text-muted-foreground">
                关闭后将禁用所有过渡动画和特效,提升性能
              </p>
            </div>
            <Switch
              id="animations"
              checked={enableAnimations}
              onCheckedChange={setEnableAnimations}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// 通知设置标签页
function NotificationsTab() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-2">通知设置</h3>
        <p className="text-muted-foreground">通知功能正在开发中...</p>
      </div>
    </div>
  )
}

// 安全设置标签页
function SecurityTab() {
  const [currentToken, setCurrentToken] = useState('')
  const [newToken, setNewToken] = useState('')
  const [showCurrentToken, setShowCurrentToken] = useState(false)
  const [showNewToken, setShowNewToken] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showTokenDialog, setShowTokenDialog] = useState(false)
  const [generatedToken, setGeneratedToken] = useState('')
  const [tokenCopied, setTokenCopied] = useState(false)
  const { toast } = useToast()

  // 实时验证新 Token
  const tokenValidation = useMemo(() => validateToken(newToken), [newToken])

  // 获取当前 token
  const getCurrentToken = () => {
    return localStorage.getItem('access-token') || ''
  }

  // 复制 token 到剪贴板
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast({
        title: '复制成功',
        description: 'Token 已复制到剪贴板',
      })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({
        title: '复制失败',
        description: '请手动复制 Token',
        variant: 'destructive',
      })
    }
  }

  // 更新 token
  const handleUpdateToken = async () => {
    if (!newToken.trim()) {
      toast({
        title: '输入错误',
        description: '请输入新的 Token',
        variant: 'destructive',
      })
      return
    }

    // 验证 Token 格式
    if (!tokenValidation.isValid) {
      const failedRules = tokenValidation.rules
        .filter((rule) => !rule.passed)
        .map((rule) => rule.label)
        .join(', ')
      
      toast({
        title: '格式错误',
        description: `Token 不符合要求: ${failedRules}`,
        variant: 'destructive',
      })
      return
    }

    setIsUpdating(true)

    try {
      const currentAccessToken = getCurrentToken()
      const response = await fetch('/api/webui/auth/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentAccessToken}`,
        },
        body: JSON.stringify({ new_token: newToken.trim() }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // 更新本地存储
        localStorage.setItem('access-token', newToken.trim())
        
        // 清空输入框
        setNewToken('')
        
        // 如果当前 Token 正在显示,更新为新值
        if (currentToken) {
          setCurrentToken(newToken.trim())
        }
        
        toast({
          title: '更新成功',
          description: 'Access Token 已更新',
        })
      } else {
        toast({
          title: '更新失败',
          description: data.message || '无法更新 Token',
          variant: 'destructive',
        })
      }
    } catch (err) {
      console.error('更新 Token 错误:', err)
      toast({
        title: '更新失败',
        description: '连接服务器失败',
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  // 重新生成 token (实际执行函数)
  const executeRegenerateToken = async () => {
    setIsRegenerating(true)

    try {
      const currentAccessToken = getCurrentToken()
      const response = await fetch('/api/webui/auth/regenerate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentAccessToken}`,
        },
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // 更新本地存储
        localStorage.setItem('access-token', data.token)
        
        // 显示弹窗展示新 Token
        setGeneratedToken(data.token)
        setShowTokenDialog(true)
        setTokenCopied(false)
        
        toast({
          title: '生成成功',
          description: '新的 Access Token 已生成，请及时保存',
        })
      } else {
        toast({
          title: '生成失败',
          description: data.message || '无法生成新 Token',
          variant: 'destructive',
        })
      }
    } catch (err) {
      console.error('生成 Token 错误:', err)
      toast({
        title: '生成失败',
        description: '连接服务器失败',
        variant: 'destructive',
      })
    } finally {
      setIsRegenerating(false)
    }
  }

  // 复制生成的 Token
  const copyGeneratedToken = async () => {
    try {
      await navigator.clipboard.writeText(generatedToken)
      setTokenCopied(true)
      toast({
        title: '复制成功',
        description: 'Token 已复制到剪贴板',
      })
    } catch {
      toast({
        title: '复制失败',
        description: '请手动复制 Token',
        variant: 'destructive',
      })
    }
  }

  // 关闭弹窗
  const handleCloseDialog = () => {
    setShowTokenDialog(false)
    // 延迟清空 token，避免用户看到内容消失
    setTimeout(() => {
      setGeneratedToken('')
      setTokenCopied(false)
    }, 300)
  }

  return (
    <div className="space-y-6">
      {/* Token 生成成功弹窗 */}
      <Dialog open={showTokenDialog} onOpenChange={setShowTokenDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              新的 Access Token
            </DialogTitle>
            <DialogDescription>
              这是您的新 Token，请立即保存。关闭此窗口后将无法再次查看。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Token 显示区域 */}
            <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
              <Label className="text-xs text-muted-foreground mb-2 block">
                您的新 Token (64位安全令牌)
              </Label>
              <div className="font-mono text-sm break-all select-all bg-background p-3 rounded border">
                {generatedToken}
              </div>
            </div>

            {/* 警告提示 */}
            <div className="rounded-lg border border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-950/30 p-3">
              <div className="flex gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800 dark:text-yellow-300 space-y-1">
                  <p className="font-semibold">重要提示</p>
                  <ul className="list-disc list-inside space-y-0.5 text-xs">
                    <li>此 Token 仅显示一次，关闭后无法再查看</li>
                    <li>请立即复制并保存到安全的位置</li>
                    <li>旧的 Token 已失效，请使用新 Token 登录</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={copyGeneratedToken}
              className="gap-2"
            >
              {tokenCopied ? (
                <>
                  <Check className="h-4 w-4 text-green-500" />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  复制 Token
                </>
              )}
            </Button>
            <Button onClick={handleCloseDialog}>
              我已保存，关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 当前 Token */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">当前 Access Token</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-token">您的访问令牌</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="current-token"
                  type={showCurrentToken ? 'text' : 'password'}
                  value={currentToken || getCurrentToken()}
                  readOnly
                  className="pr-10 font-mono text-sm"
                  placeholder="点击查看按钮显示 Token"
                />
                <button
                  onClick={() => {
                    if (!currentToken) {
                      setCurrentToken(getCurrentToken())
                    }
                    setShowCurrentToken(!showCurrentToken)
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-accent rounded"
                  title={showCurrentToken ? '隐藏' : '显示'}
                >
                  {showCurrentToken ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(getCurrentToken())}
                title="复制到剪贴板"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={isRegenerating}
                    className="gap-2"
                  >
                    <RefreshCw className={cn('h-4 w-4', isRegenerating && 'animate-spin')} />
                    重新生成
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>确认重新生成 Token</AlertDialogTitle>
                    <AlertDialogDescription>
                      这将生成一个新的 64 位安全令牌，并使当前 Token 立即失效。
                      您需要使用新 Token 重新登录系统。此操作不可撤销，确定要继续吗？
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction onClick={executeRegenerateToken}>
                      确认生成
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <p className="text-xs text-muted-foreground">
              请妥善保管您的 Access Token，不要泄露给他人
            </p>
          </div>
        </div>
      </div>

      {/* 更新 Token */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">自定义 Access Token</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-token">新的访问令牌</Label>
            <div className="relative">
              <Input
                id="new-token"
                type={showNewToken ? 'text' : 'password'}
                value={newToken}
                onChange={(e) => setNewToken(e.target.value)}
                className="pr-10 font-mono text-sm"
                placeholder="输入自定义 Token"
              />
              <button
                onClick={() => setShowNewToken(!showNewToken)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-accent rounded"
                title={showNewToken ? '隐藏' : '显示'}
              >
                {showNewToken ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
            
            {/* Token 验证规则显示 */}
            {newToken && (
              <div className="mt-3 space-y-2 p-3 rounded-lg bg-muted/50">
                <p className="text-sm font-medium text-foreground">Token 安全要求:</p>
                <div className="space-y-1.5">
                  {tokenValidation.rules.map((rule) => (
                    <div key={rule.id} className="flex items-center gap-2 text-sm">
                      {rule.passed ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <span className={cn(
                        rule.passed ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                      )}>
                        {rule.label}
                      </span>
                    </div>
                  ))}
                </div>
                {tokenValidation.isValid && (
                  <div className="mt-2 pt-2 border-t border-border">
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                      <Check className="h-4 w-4" />
                      <span className="font-medium">Token 格式正确，可以使用</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <Button 
            onClick={handleUpdateToken} 
            disabled={isUpdating || !tokenValidation.isValid || !newToken} 
            className="w-full sm:w-auto"
          >
            {isUpdating ? '更新中...' : '更新自定义 Token'}
          </Button>
        </div>
      </div>

      {/* 安全提示 */}
      <div className="rounded-lg border border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-950/30 p-4">
        <h4 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">安全提示</h4>
        <ul className="text-sm text-yellow-800 dark:text-yellow-300 space-y-1 list-disc list-inside">
          <li>重新生成 Token 会创建系统随机生成的 64 位安全令牌</li>
          <li>自定义 Token 必须满足所有安全要求才能使用</li>
          <li>更新 Token 后，旧的 Token 将立即失效</li>
          <li>请在安全的环境下查看和复制 Token</li>
          <li>如果怀疑 Token 泄露，请立即重新生成或更新</li>
          <li>建议使用系统生成的 Token 以获得最高安全性</li>
        </ul>
      </div>
    </div>
  )
}

// 关于标签页
function AboutTab() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">关于 MaiBot</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>版本: 1.0.0</p>
          <p>基于 React 19 + Vite + TanStack Router</p>
        </div>
      </div>
    </div>
  )
}

type ThemeOptionProps = {
  value: 'light' | 'dark' | 'system'
  current: 'light' | 'dark' | 'system'
  onChange: (theme: 'light' | 'dark' | 'system') => void
  label: string
  description: string
}

function ThemeOption({ value, current, onChange, label, description }: ThemeOptionProps) {
  const isSelected = current === value

  return (
    <button
      onClick={() => onChange(value)}
      className={cn(
        'relative rounded-lg border-2 p-4 text-left transition-all',
        'hover:border-primary/50 hover:bg-accent/50',
        isSelected ? 'border-primary bg-accent' : 'border-border'
      )}
    >
      {/* 选中指示器 */}
      {isSelected && (
        <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-primary" />
      )}

      <div className="space-y-1">
        <div className="font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>

      {/* 主题预览 */}
      <div className="mt-3 flex gap-1">
        {value === 'light' && (
          <>
            <div className="h-2 w-2 rounded-full bg-slate-200" />
            <div className="h-2 w-2 rounded-full bg-slate-300" />
            <div className="h-2 w-2 rounded-full bg-slate-400" />
          </>
        )}
        {value === 'dark' && (
          <>
            <div className="h-2 w-2 rounded-full bg-slate-700" />
            <div className="h-2 w-2 rounded-full bg-slate-800" />
            <div className="h-2 w-2 rounded-full bg-slate-900" />
          </>
        )}
        {value === 'system' && (
          <>
            <div className="h-2 w-2 rounded-full bg-gradient-to-r from-slate-200 to-slate-700" />
            <div className="h-2 w-2 rounded-full bg-gradient-to-r from-slate-300 to-slate-800" />
            <div className="h-2 w-2 rounded-full bg-gradient-to-r from-slate-400 to-slate-900" />
          </>
        )}
      </div>
    </button>
  )
}

type AccentColorOptionProps = {
  value: string
  current: string
  onChange: (color: string) => void
  label: string
  colorClass: string
}

function AccentColorOption({ value, current, onChange, label, colorClass }: AccentColorOptionProps) {
  const isSelected = current === value

  return (
    <button
      onClick={() => onChange(value)}
      className={cn(
        'relative rounded-lg border-2 p-4 text-left transition-all',
        'hover:border-primary/50 hover:bg-accent/50',
        isSelected ? 'border-primary bg-accent' : 'border-border'
      )}
    >
      {/* 选中指示器 */}
      {isSelected && (
        <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
      )}

      <div className="flex flex-col items-center gap-3">
        <div className={cn('h-12 w-12 rounded-full', colorClass)} />
        <div className="text-sm font-medium">{label}</div>
      </div>
    </button>
  )
}
