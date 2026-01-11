import { minifySource } from './minifier'
import { validateSource } from './validator'

type GeneratorResult = {
  bookmarklet: string
  warnings: string[]
}

export async function generateBookmarklet(source: string): Promise<GeneratorResult> {
  const warnings = validateSource(source)
  const minified = await minifySource(source)
  const encoded = encodeURIComponent(minified)
  return {
    bookmarklet: `javascript:${encoded}`,
    warnings,
  }
}
