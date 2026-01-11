export function buildPreviewDocument(source: string) {
  const escaped = source.replace(/<\/script>/gi, '<\\/script>')
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:;"
    />
    <title>Bookmarklet Preview</title>
    <style>
      body { font-family: sans-serif; padding: 16px; }
      .notice { color: #475569; }
    </style>
  </head>
  <body>
    <p class="notice">Running bookmarklet preview...</p>
    <script>
      const send = (level, payload) => {
        try {
          window.parent.postMessage(
            { type: 'bookmarklet-console', level, payload },
            '*'
          )
        } catch (_) {}
      }

      const formatArgs = (args) =>
        args.map((arg) => {
          if (typeof arg === 'string') return arg
          try {
            return JSON.stringify(arg)
          } catch (_) {
            return String(arg)
          }
        }).join(' ')

      ['log', 'info', 'warn', 'error'].forEach((level) => {
        const original = console[level]
        console[level] = (...args) => {
          send(level, formatArgs(args))
          return original.apply(console, args)
        }
      })

      window.addEventListener('error', (event) => {
        send('error', event.message || 'Unknown error')
      })

      try {
        ${escaped}
      } catch (error) {
        const message = error && error.message ? error.message : String(error)
        document.body.innerHTML = '<pre>' + message + '</pre>'
        send('error', message)
      }
    </script>
  </body>
</html>`
}
