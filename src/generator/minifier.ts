import { minify } from 'terser'

export async function minifySource(source: string) {
  try {
    const result = await minify(source, {
      compress: true,
      mangle: true,
      format: { semicolons: false },
    })
    if (result.code) {
      return result.code
    }
  } catch {
    // Fall back to a safe whitespace squeeze.
  }
  return source.replace(/\s+/g, ' ').trim()
}
