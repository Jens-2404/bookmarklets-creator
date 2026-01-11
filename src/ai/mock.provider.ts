import type { AiProvider } from './provider'
import type { AiRequest, AiResponse } from './ai.types'
import { applyGuardrails } from './ai.guardrails'

const safeSnippets = [
  `(() => {
  document.querySelectorAll('a').forEach(link => {
    link.style.outline = '2px solid #f97316'
  })
})()`,
  `(() => {
  const headings = Array.from(document.querySelectorAll('h1,h2,h3'))
    .map(h => h.textContent?.trim())
    .filter(Boolean)
  console.log(headings.join('\\n'))
})()`,
  `(() => {
  document.querySelectorAll('img').forEach(img => {
    img.style.outline = '2px solid #3b82f6'
  })
})()`,
]

function pickSnippet(prompt: string) {
  const lowered = prompt.toLowerCase()
  if (lowered.includes('heading')) {
    return safeSnippets[1]
  }
  if (lowered.includes('image')) {
    return safeSnippets[2]
  }
  return safeSnippets[0]
}

function buildExplanation(code: string): string[] {
  const lines: string[] = []
  if (code.includes('querySelectorAll')) {
    lines.push('Selects elements using querySelectorAll.')
  }
  if (code.includes('style.')) {
    lines.push('Applies inline styles to matched elements.')
  }
  if (code.includes('console.log')) {
    lines.push('Logs results to the console.')
  }
  if (lines.length === 0) {
    lines.push('Runs a small DOM manipulation in the page context.')
  }
  return lines
}

export const mockProvider: AiProvider = {
  async generate(request: AiRequest): Promise<AiResponse> {
    if (request.intent === 'generate') {
      const candidate = pickSnippet(request.prompt || '')
      const guarded = applyGuardrails(candidate, request.options?.maxChars)
      return guarded
    }

    const source = request.sourceCode ?? ''
    return {
      explanation: buildExplanation(source),
    }
  },
}
