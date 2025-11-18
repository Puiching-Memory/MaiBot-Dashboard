import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
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
import { Search, Download, Star, ExternalLink } from 'lucide-react'

interface Plugin {
  id: string
  name: string
  description: string
  author: string
  version: string
  downloads: number
  rating: number
  category: string
  tags: string[]
  detailedDescription: string
  homepage?: string
  repository?: string
}

export function PluginsPage() {
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  // 关闭对话框
  const closeDialog = () => {
    setSelectedPlugin(null)
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-6 p-6">
        {/* 标题 */}
        <div>
          <h1 className="text-3xl font-bold">插件市场</h1>
          <p className="text-muted-foreground mt-2">浏览和管理麦麦的插件</p>
        </div>

        {/* 搜索和筛选栏 */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* 搜索框 */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索插件..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* 分类筛选 */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部分类</SelectItem>
                <SelectItem value="utility">工具</SelectItem>
                <SelectItem value="entertainment">娱乐</SelectItem>
                <SelectItem value="integration">集成</SelectItem>
                <SelectItem value="ai">AI 增强</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* 插件卡片网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 插件卡片占位 */}
          {[1, 2, 3, 4, 5, 6].map((index) => (
            <Card
              key={index}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => {
                // 点击时设置选中的插件（这里使用占位数据）
                setSelectedPlugin({
                  id: `plugin-${index}`,
                  name: '',
                  description: '',
                  author: '',
                  version: '',
                  downloads: 0,
                  rating: 0,
                  category: '',
                  tags: [],
                  detailedDescription: '',
                })
              }}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-xl">插件名称</CardTitle>
                  <Badge variant="secondary">分类</Badge>
                </div>
                <CardDescription>插件简短描述</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Download className="h-4 w-4" />
                      <span>0</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4" />
                      <span>0.0</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">标签1</Badge>
                    <Badge variant="outline">标签2</Badge>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" size="sm">
                  查看详情
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* 插件详情对话框 */}
        <Dialog open={selectedPlugin !== null} onOpenChange={closeDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <DialogTitle className="text-2xl">插件名称</DialogTitle>
                  <DialogDescription>作者: 插件作者</DialogDescription>
                </div>
                <Badge variant="secondary">分类</Badge>
              </div>
            </DialogHeader>

            <div className="space-y-6">
              {/* 基本信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">版本</p>
                  <p className="text-sm text-muted-foreground">v0.0.0</p>
                </div>
                <div>
                  <p className="text-sm font-medium">下载量</p>
                  <p className="text-sm text-muted-foreground">0</p>
                </div>
                <div>
                  <p className="text-sm font-medium">评分</p>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm text-muted-foreground">0.0</span>
                  </div>
                </div>
              </div>

              {/* 标签 */}
              <div>
                <p className="text-sm font-medium mb-2">标签</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">标签1</Badge>
                  <Badge variant="outline">标签2</Badge>
                  <Badge variant="outline">标签3</Badge>
                </div>
              </div>

              {/* 详细描述 */}
              <div>
                <p className="text-sm font-medium mb-2">详细说明</p>
                <p className="text-sm text-muted-foreground">
                  插件的详细描述内容...
                </p>
              </div>

              {/* 链接 */}
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                  <ExternalLink className="h-4 w-4" />
                  访问主页
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                  <ExternalLink className="h-4 w-4" />
                  查看仓库
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>
                取消
              </Button>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                安装插件
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ScrollArea>
  )
}

