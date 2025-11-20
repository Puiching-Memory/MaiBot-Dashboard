/**
 * 配置API客户端
 */

import { fetchWithAuth, getAuthHeaders } from '@/lib/fetch-with-auth'
import type {
  ConfigSchema,
  ConfigSchemaResponse,
  ConfigDataResponse,
  ConfigUpdateResponse,
} from '@/types/config-schema'

const API_BASE = '/api/webui/config'

/**
 * 获取麦麦主程序配置架构
 */
export async function getBotConfigSchema(): Promise<ConfigSchema> {
  const response = await fetchWithAuth(`${API_BASE}/schema/bot`)
  const data: ConfigSchemaResponse = await response.json()
  
  if (!data.success) {
    throw new Error('获取配置架构失败')
  }
  
  return data.schema
}

/**
 * 获取模型配置架构
 */
export async function getModelConfigSchema(): Promise<ConfigSchema> {
  const response = await fetchWithAuth(`${API_BASE}/schema/model`)
  const data: ConfigSchemaResponse = await response.json()
  
  if (!data.success) {
    throw new Error('获取模型配置架构失败')
  }
  
  return data.schema
}

/**
 * 获取指定配置节的架构
 */
export async function getConfigSectionSchema(sectionName: string): Promise<ConfigSchema> {
  const response = await fetchWithAuth(`${API_BASE}/schema/section/${sectionName}`)
  const data: ConfigSchemaResponse = await response.json()
  
  if (!data.success) {
    throw new Error(`获取配置节 ${sectionName} 架构失败`)
  }
  
  return data.schema
}

/**
 * 获取麦麦主程序配置数据
 */
export async function getBotConfig(): Promise<Record<string, unknown>> {
  const response = await fetchWithAuth(`${API_BASE}/bot`)
  const data: ConfigDataResponse = await response.json()
  
  if (!data.success) {
    throw new Error('获取配置数据失败')
  }
  
  return data.config
}

/**
 * 获取模型配置数据
 */
export async function getModelConfig(): Promise<Record<string, unknown>> {
  const response = await fetchWithAuth(`${API_BASE}/model`)
  const data: ConfigDataResponse = await response.json()
  
  if (!data.success) {
    throw new Error('获取模型配置数据失败')
  }
  
  return data.config
}

/**
 * 更新麦麦主程序配置
 */
export async function updateBotConfig(config: Record<string, unknown>): Promise<void> {
  const response = await fetchWithAuth(`${API_BASE}/bot`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(config),
  })
  
  const data: ConfigUpdateResponse = await response.json()
  
  if (!data.success) {
    throw new Error(data.message || '保存配置失败')
  }
}

/**
 * 获取麦麦主程序配置的原始 TOML 内容
 */
export async function getBotConfigRaw(): Promise<string> {
  const response = await fetchWithAuth(`${API_BASE}/bot/raw`)
  const data: { success: boolean; content: string } = await response.json()
  
  if (!data.success) {
    throw new Error('获取配置源代码失败')
  }
  
  return data.content
}

/**
 * 更新麦麦主程序配置（原始 TOML 内容）
 */
export async function updateBotConfigRaw(rawContent: string): Promise<void> {
  const response = await fetchWithAuth(`${API_BASE}/bot/raw`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ raw_content: rawContent }),
  })
  
  const data: ConfigUpdateResponse = await response.json()
  
  if (!data.success) {
    throw new Error(data.message || '保存配置失败')
  }
}

/**
 * 更新模型配置
 */
export async function updateModelConfig(config: Record<string, unknown>): Promise<void> {
  const response = await fetchWithAuth(`${API_BASE}/model`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(config),
  })
  
  const data: ConfigUpdateResponse = await response.json()
  
  if (!data.success) {
    throw new Error(data.message || '保存配置失败')
  }
}

/**
 * 更新麦麦主程序配置的指定节
 */
export async function updateBotConfigSection(
  sectionName: string,
  sectionData: unknown
): Promise<void> {
  const response = await fetchWithAuth(`${API_BASE}/bot/section/${sectionName}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(sectionData),
  })
  
  const data: ConfigUpdateResponse = await response.json()
  
  if (!data.success) {
    throw new Error(data.message || `保存配置节 ${sectionName} 失败`)
  }
}

/**
 * 更新模型配置的指定节
 */
export async function updateModelConfigSection(
  sectionName: string,
  sectionData: unknown
): Promise<void> {
  const response = await fetchWithAuth(`${API_BASE}/model/section/${sectionName}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(sectionData),
  })
  
  const data: ConfigUpdateResponse = await response.json()
  
  if (!data.success) {
    throw new Error(data.message || `保存配置节 ${sectionName} 失败`)
  }
}
