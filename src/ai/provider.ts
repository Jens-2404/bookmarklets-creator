import type { AiRequest, AiResponse } from './ai.types'

export interface AiProvider {
  generate(request: AiRequest): Promise<AiResponse>
}
