/**
 * 全局日志 WebSocket 管理器
 * 确保整个应用只有一个 WebSocket 连接
 */

import { getSetting } from './settings-manager'

export interface LogEntry {
  id: string
  timestamp: string
  level: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
  module: string
  message: string
}

type LogCallback = (log: LogEntry) => void
type ConnectionCallback = (connected: boolean) => void

class LogWebSocketManager {
  private ws: WebSocket | null = null
  private reconnectTimeout: number | null = null
  private reconnectAttempts = 0
  private heartbeatInterval: number | null = null
  
  // 订阅者
  private logCallbacks: Set<LogCallback> = new Set()
  private connectionCallbacks: Set<ConnectionCallback> = new Set()
  
  private isConnected = false
  
  // 日志缓存 - 保存所有接收到的日志
  private logCache: LogEntry[] = []

  /**
   * 获取最大缓存大小（从设置读取）
   */
  private getMaxCacheSize(): number {
    return getSetting('logCacheSize')
  }

  /**
   * 获取最大重连次数（从设置读取）
   */
  private getMaxReconnectAttempts(): number {
    return getSetting('wsMaxReconnectAttempts')
  }

  /**
   * 获取重连间隔（从设置读取）
   */
  private getReconnectInterval(): number {
    return getSetting('wsReconnectInterval')
  }

  /**
   * 获取 WebSocket URL
   */
  private getWebSocketUrl(): string {
    if (import.meta.env.DEV) {
      // 开发模式：连接到 WebUI 后端服务器
      return 'ws://127.0.0.1:8001/ws/logs'
    } else {
      // 生产模式：使用当前页面的 host
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const host = window.location.host
      return `${protocol}//${host}/ws/logs`
    }
  }

  /**
   * 连接 WebSocket
   */
  connect() {
    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) {
      return
    }

    const wsUrl = this.getWebSocketUrl()

    try {
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        this.isConnected = true
        this.reconnectAttempts = 0
        this.notifyConnection(true)
        this.startHeartbeat()
      }

      this.ws.onmessage = (event) => {
        try {
          // 忽略心跳响应
          if (event.data === 'pong') {
            return
          }
          
          const log: LogEntry = JSON.parse(event.data)
          this.notifyLog(log)
        } catch (error) {
          console.error('解析日志消息失败:', error)
        }
      }

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket 错误:', error)
        this.isConnected = false
        this.notifyConnection(false)
      }

      this.ws.onclose = () => {
        this.isConnected = false
        this.notifyConnection(false)
        this.stopHeartbeat()
        this.attemptReconnect()
      }
    } catch (error) {
      console.error('创建 WebSocket 连接失败:', error)
      this.attemptReconnect()
    }
  }

  /**
   * 尝试重连
   */
  private attemptReconnect() {
    const maxAttempts = this.getMaxReconnectAttempts()
    if (this.reconnectAttempts >= maxAttempts) {
      return
    }

    this.reconnectAttempts += 1
    const baseInterval = this.getReconnectInterval()
    const delay = Math.min(baseInterval * this.reconnectAttempts, 30000)

    this.reconnectTimeout = window.setTimeout(() => {
      this.connect()
    }, delay)
  }

  /**
   * 启动心跳
   */
  private startHeartbeat() {
    this.heartbeatInterval = window.setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send('ping')
      }
    }, 30000) // 每30秒发送一次心跳
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat() {
    if (this.heartbeatInterval !== null) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  /**
   * 断开连接
   */
  disconnect() {
    if (this.reconnectTimeout !== null) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    this.stopHeartbeat()

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.isConnected = false
    this.reconnectAttempts = 0
  }

  /**
   * 订阅日志消息
   */
  onLog(callback: LogCallback) {
    this.logCallbacks.add(callback)
    return () => this.logCallbacks.delete(callback)
  }

  /**
   * 订阅连接状态
   */
  onConnectionChange(callback: ConnectionCallback) {
    this.connectionCallbacks.add(callback)
    // 立即通知当前状态
    callback(this.isConnected)
    return () => this.connectionCallbacks.delete(callback)
  }

  /**
   * 通知所有订阅者新日志
   */
  private notifyLog(log: LogEntry) {
    // 检查是否已存在（通过 id 去重）
    const exists = this.logCache.some(existingLog => existingLog.id === log.id)
    
    if (!exists) {
      // 添加到缓存
      this.logCache.push(log)
      
      // 限制缓存大小（动态读取配置）
      const maxCacheSize = this.getMaxCacheSize()
      if (this.logCache.length > maxCacheSize) {
        this.logCache = this.logCache.slice(-maxCacheSize)
      }
      
      // 只有新日志才通知订阅者
      this.logCallbacks.forEach(callback => {
        try {
          callback(log)
        } catch (error) {
          console.error('日志回调执行失败:', error)
        }
      })
    }
  }

  /**
   * 通知所有订阅者连接状态变化
   */
  private notifyConnection(connected: boolean) {
    this.connectionCallbacks.forEach(callback => {
      try {
        callback(connected)
      } catch (error) {
        console.error('连接状态回调执行失败:', error)
      }
    })
  }

  /**
   * 获取缓存的所有日志
   */
  getAllLogs(): LogEntry[] {
    return [...this.logCache]
  }

  /**
   * 清空日志缓存
   */
  clearLogs() {
    this.logCache = []
  }

  /**
   * 获取当前连接状态
   */
  getConnectionStatus(): boolean {
    return this.isConnected
  }
}

// 导出单例
export const logWebSocket = new LogWebSocketManager()

// 自动连接（应用启动时）
if (typeof window !== 'undefined') {
  logWebSocket.connect()
}
