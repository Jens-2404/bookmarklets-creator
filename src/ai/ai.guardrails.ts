import type { AiResponse } from './ai.types'
import { findValidationIssues } from '../generator/validator'

const bannedTokens = [/\\beval\\b/i, /\\bnew\\s+Function\\b/i, /\\bfetch\\b/i, /\\bXMLHttpRequest\\b/i]

export function applyGuardrails(code: string, maxChars = 4000): AiResponse {
  if (code.length > maxChars) {
    return {
      blocked: true,
      blockReason: `Output too long (${code.length} chars).`,
    }
  }

  for (const pattern of bannedTokens) {
    if (pattern.test(code)) {
      return {
        blocked: true,
        blockReason: 'Output contains a banned API.',
      }
    }
  }

  const warnings = findValidationIssues(code)
    .filter((issue) => issue.level === 'warning')
    .map((issue) => issue.message)

  return {
    code,
    warnings,
  }
}
