/**
 * 表情包管理 API 客户端
 */

import { fetchWithAuth, getAuthHeaders } from '@/lib/fetch-with-auth'
import type {
  EmojiListResponse,
  EmojiDetailResponse,
  EmojiUpdateRequest,
  EmojiUpdateResponse,
  EmojiDeleteResponse,
  EmojiStatsResponse,
} from '@/types/emoji'

const API_BASE = '/api/webui/emoji'

/**
 * 获取表情包列表
 */
export async function getEmojiList(params: {
  page?: number
  page_size?: number
  search?: string
  is_registered?: boolean
  is_banned?: boolean
  format?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}): Promise<EmojiListResponse> {
  const query = new URLSearchParams()
  if (params.page) query.append('page', params.page.toString())
  if (params.page_size) query.append('page_size', params.page_size.toString())
  if (params.search) query.append('search', params.search)
  if (params.is_registered !== undefined) query.append('is_registered', params.is_registered.toString())
  if (params.is_banned !== undefined) query.append('is_banned', params.is_banned.toString())
  if (params.format) query.append('format', params.format)
  if (params.sort_by) query.append('sort_by', params.sort_by)
  if (params.sort_order) query.append('sort_order', params.sort_order)

  const response = await fetchWithAuth(`${API_BASE}/list?${query}`, {
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error(`获取表情包列表失败: ${response.statusText}`)
  }

  return response.json()
}

/**
 * 获取表情包详情
 */
export async function getEmojiDetail(id: number): Promise<EmojiDetailResponse> {
  const response = await fetchWithAuth(`${API_BASE}/${id}`, {
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error(`获取表情包详情失败: ${response.statusText}`)
  }

  return response.json()
}

/**
 * 更新表情包信息
 */
export async function updateEmoji(
  id: number,
  data: EmojiUpdateRequest
): Promise<EmojiUpdateResponse> {
  const response = await fetchWithAuth(`${API_BASE}/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error(`更新表情包失败: ${response.statusText}`)
  }

  return response.json()
}

/**
 * 删除表情包
 */
export async function deleteEmoji(id: number): Promise<EmojiDeleteResponse> {
  const response = await fetchWithAuth(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error(`删除表情包失败: ${response.statusText}`)
  }

  return response.json()
}

/**
 * 获取表情包统计数据
 */
export async function getEmojiStats(): Promise<EmojiStatsResponse> {
  const response = await fetchWithAuth(`${API_BASE}/stats/summary`, {
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error(`获取统计数据失败: ${response.statusText}`)
  }

  return response.json()
}

/**
 * 注册表情包
 */
export async function registerEmoji(id: number): Promise<EmojiUpdateResponse> {
  const response = await fetchWithAuth(`${API_BASE}/${id}/register`, {
    method: 'POST',
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error(`注册表情包失败: ${response.statusText}`)
  }

  return response.json()
}

/**
 * 封禁表情包
 */
export async function banEmoji(id: number): Promise<EmojiUpdateResponse> {
  const response = await fetchWithAuth(`${API_BASE}/${id}/ban`, {
    method: 'POST',
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    throw new Error(`封禁表情包失败: ${response.statusText}`)
  }

  return response.json()
}

/**
 * 获取表情包缩略图 URL（带 token）
 */
export function getEmojiThumbnailUrl(id: number): string {
  const token = localStorage.getItem('access-token')
  return `${API_BASE}/${id}/thumbnail?token=${encodeURIComponent(token || '')}`
}
