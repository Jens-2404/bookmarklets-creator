export type ValidationIssue = {
  message: string
  index: number
  length: number
  level: 'warning' | 'error'
}

const riskyPatterns: Array<{ label: string; pattern: RegExp }> = [
  { label: 'Avoid eval() in bookmarklets.', pattern: /\beval\s*\(/ },
  { label: 'Avoid new Function() in bookmarklets.', pattern: /\bnew\s+Function\s*\(/ },
  { label: 'Accessing document.cookie may be unsafe.', pattern: /\bdocument\.cookie\b/ },
  { label: 'Network requests are discouraged (fetch).', pattern: /\bfetch\s*\(/ },
  { label: 'Network requests are discouraged (XMLHttpRequest).', pattern: /\bXMLHttpRequest\b/ },
  { label: 'Use of document.write can be unsafe.', pattern: /\bdocument\.write\b/ },
  { label: 'Direct localStorage access may leak data.', pattern: /\blocalStorage\b/ },
  { label: 'Direct sessionStorage access may leak data.', pattern: /\bsessionStorage\b/ },
]

export function findValidationIssues(source: string): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  if (source.trim().length === 0) {
    issues.push({
      message: 'Source is empty.',
      index: 0,
      length: 1,
      level: 'error',
    })
    return issues
  }

  try {
    // Parse-only syntax check.
    // eslint-disable-next-line no-new-func
    new Function(source)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Syntax error.'
    issues.push({
      message: `Syntax error: ${message}`,
      index: 0,
      length: 1,
      level: 'error',
    })
  }

  riskyPatterns.forEach(({ label, pattern }) => {
    const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`
    const matcher = new RegExp(pattern.source, flags)
    let match = matcher.exec(source)
    while (match) {
      if (typeof match.index === 'number') {
        issues.push({
          message: label,
          index: match.index,
          length: match[0]?.length ?? 1,
          level: 'warning',
        })
      }
      match = matcher.exec(source)
    }
  })
  return issues
}

export function validateSource(source: string) {
  return findValidationIssues(source).map((issue) => issue.message)
}
