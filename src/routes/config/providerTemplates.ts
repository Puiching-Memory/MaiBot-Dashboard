/**
 * 模型提供商模板配置
 * 
 * 这些预设模板帮助用户快速配置常用的 API 提供商
 */

// 提供商模板定义
export interface ProviderTemplate {
  id: string
  name: string
  base_url: string
  client_type: 'openai' | 'gemini'
  display_name: string
}

// 内置提供商模板
export const PROVIDER_TEMPLATES: ProviderTemplate[] = [
  // 国内提供商
  {
    id: 'siliconflow',
    name: 'SiliconFlow',
    base_url: 'https://api.siliconflow.cn/v1',
    client_type: 'openai',
    display_name: '硅基流动 (SiliconFlow)',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    base_url: 'https://api.deepseek.com',
    client_type: 'openai',
    display_name: 'DeepSeek',
  },
  {
    id: 'rinkoai',
    name: 'RinkoAI',
    base_url: 'https://rinkoai.com/v1',
    client_type: 'openai',
    display_name: 'RinkoAI',
  },
  {
    id: 'zhipu',
    name: 'ZhipuAI',
    base_url: 'https://open.bigmodel.cn/api/paas/v4',
    client_type: 'openai',
    display_name: '智谱 AI (ZhipuAI / GLM)',
  },
  {
    id: 'moonshot',
    name: 'Moonshot',
    base_url: 'https://api.moonshot.cn/v1',
    client_type: 'openai',
    display_name: '月之暗面 (Moonshot / Kimi)',
  },
  {
    id: 'doubao',
    name: 'Doubao',
    base_url: 'https://ark.cn-beijing.volces.com/api/v3',
    client_type: 'openai',
    display_name: '字节豆包 (Doubao)',
  },
  {
    id: 'alibaba',
    name: 'Alibaba',
    base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    client_type: 'openai',
    display_name: '阿里云百炼 (Alibaba Qwen)',
  },
  {
    id: 'baichuan',
    name: 'Baichuan',
    base_url: 'https://api.baichuan-ai.com/v1',
    client_type: 'openai',
    display_name: '百川智能 (Baichuan)',
  },
  {
    id: 'minimax',
    name: 'MiniMax',
    base_url: 'https://api.minimax.chat/v1',
    client_type: 'openai',
    display_name: 'MiniMax (海螺 AI)',
  },
  {
    id: 'stepfun',
    name: 'StepFun',
    base_url: 'https://api.stepfun.com/v1',
    client_type: 'openai',
    display_name: '阶跃星辰 (StepFun)',
  },
  {
    id: 'lingyi',
    name: 'Lingyi',
    base_url: 'https://api.lingyiwanwu.com/v1',
    client_type: 'openai',
    display_name: '零一万物 (Lingyi / Yi)',
  },

  // 国际提供商
  {
    id: 'openai',
    name: 'OpenAI',
    base_url: 'https://api.openai.com/v1',
    client_type: 'openai',
    display_name: 'OpenAI',
  },
  {
    id: 'xai',
    name: 'xAI',
    base_url: 'https://api.x.ai/v1',
    client_type: 'openai',
    display_name: 'xAI (Grok)',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    base_url: 'https://api.anthropic.com/v1',
    client_type: 'openai',
    display_name: 'Anthropic (Claude)',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    base_url: 'https://generativelanguage.googleapis.com/v1beta',
    client_type: 'gemini',
    display_name: 'Google Gemini',
  },
  {
    id: 'cohere',
    name: 'Cohere',
    base_url: 'https://api.cohere.ai/v1',
    client_type: 'openai',
    display_name: 'Cohere',
  },
  {
    id: 'groq',
    name: 'Groq',
    base_url: 'https://api.groq.com/openai/v1',
    client_type: 'openai',
    display_name: 'Groq',
  },
  {
    id: 'together',
    name: 'Together AI',
    base_url: 'https://api.together.xyz/v1',
    client_type: 'openai',
    display_name: 'Together AI',
  },
  {
    id: 'fireworks',
    name: 'Fireworks',
    base_url: 'https://api.fireworks.ai/inference/v1',
    client_type: 'openai',
    display_name: 'Fireworks AI',
  },
  {
    id: 'mistral',
    name: 'Mistral',
    base_url: 'https://api.mistral.ai/v1',
    client_type: 'openai',
    display_name: 'Mistral AI',
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    base_url: 'https://api.perplexity.ai',
    client_type: 'openai',
    display_name: 'Perplexity AI',
  },

  // 自定义选项
  {
    id: 'custom',
    name: '',
    base_url: '',
    client_type: 'openai',
    display_name: '自定义',
  },
]
