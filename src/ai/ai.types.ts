export type AiIntent = 'generate' | 'explain'

export type AiRequest = {
  intent: AiIntent
  prompt: string
  sourceCode?: string
  options?: {
    category?: 'dom' | 'seo' | 'content' | 'debug'
    maxChars?: number
    tone?: 'concise' | 'detailed'
  }
}

export type AiResponse = {
  code?: string
  explanation?: string[]
  warnings?: string[]
  blocked?: boolean
  blockReason?: string
}
