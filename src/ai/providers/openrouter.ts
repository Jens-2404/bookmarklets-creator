import type { AiProvider } from '../provider'
import type { AiRequest, AiResponse } from '../ai.types'
import { applyGuardrails } from '../ai.guardrails'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const DEFAULT_MODEL = 'openai/gpt-4o-mini'

type OpenRouterMessage = {
  role: 'system' | 'user'
  content: string
}

const systemGeneratePrompt = `You are a JavaScript expert for browser bookmarklets.
Rules:
- No network requests.
- No eval or Function constructors.
- Use only standard DOM APIs.
Return only JavaScript code.`

const systemExplainPrompt = `Explain the following bookmarklet code in plain English.
Highlight any risky APIs and suggest safer alternatives.`

function buildGenerateMessages(prompt: string): OpenRouterMessage[] {
  return [
    { role: 'system', content: systemGeneratePrompt },
    {
      role: 'user',
      content: `Task: ${prompt}\nConstraints:\n- Keep it short and readable.\n- Avoid external dependencies.`,
    },
  ]
}

function buildExplainMessages(code: string): OpenRouterMessage[] {
  return [
    { role: 'system', content: systemExplainPrompt },
    { role: 'user', content: `Code:\n${code}` },
  ]
}

function stripCodeFences(text: string) {
  return text.replace(/```[a-z]*\\n?/gi, '').replace(/```/g, '').trim()
}

function toBulletLines(text: string) {
  return text
    .split('\n')
    .map((line) => line.replace(/^[-*]\\s+/, '').trim())
    .filter(Boolean)
}

async function callOpenRouter(apiKey: string, messages: OpenRouterMessage[]) {
  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-Title': 'Bookmarklets Creator',
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages,
      temperature: 0.2,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'OpenRouter request failed.')
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }

  const content = json.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('OpenRouter returned an empty response.')
  }
  return content
}

export function createOpenRouterProvider(apiKey: string): AiProvider {
  return {
    async generate(request: AiRequest): Promise<AiResponse> {
      if (request.intent === 'generate') {
        const content = await callOpenRouter(apiKey, buildGenerateMessages(request.prompt))
        const candidate = stripCodeFences(content)
        return applyGuardrails(candidate, request.options?.maxChars)
      }

      const content = await callOpenRouter(
        apiKey,
        buildExplainMessages(request.sourceCode ?? ''),
      )
      return {
        explanation: toBulletLines(content),
      }
    },
  }
}
