import type { AiProvider } from '../provider'
import type { AiRequest, AiResponse } from '../ai.types'

export function createAnthropicProvider(_apiKey: string): AiProvider {
  return {
    async generate(_request: AiRequest): Promise<AiResponse> {
      return {
        blocked: true,
        blockReason: 'Anthropic provider not wired yet.',
      }
    },
  }
}
