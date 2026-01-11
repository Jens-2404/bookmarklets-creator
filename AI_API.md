# AI API Outline (Post-MVP)

## TypeScript Interfaces
```ts
export type AiRequest = {
  intent: 'generate' | 'explain'
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
```

## Guardrail Checks (client-side)
- Max length (default 4000 chars).
- Reject banned tokens: `eval`, `new Function`, `fetch`, `XMLHttpRequest`.
- Always run validator before allowing preview.

## Provider Abstraction
```ts
export interface AiProvider {
  generate(request: AiRequest): Promise<AiResponse>
}
```

## Consent
- Show a one-time dialog before sending prompts to a remote API.
- Allow "local only" mode (no network).
