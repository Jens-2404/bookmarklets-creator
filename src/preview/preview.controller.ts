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
      body { font-family: sans-serif; padding: 16px; background: #f8f5ef; color: #2c2620; }
      .notice { color: #6b655f; }
      .output { margin-top: 12px; display: grid; gap: 6px; }
      .output div { padding: 8px 10px; border-radius: 8px; background: #efe8dd; }
    </style>
  </head>
  <body>
    <p id="preview-notice" class="notice">Running bookmarklet preview...</p>
    <div id="preview-output" class="output" aria-live="polite"></div>
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

      const output = document.getElementById('preview-output')
      const writeOutput = (message) => {
        if (!output) return
        const item = document.createElement('div')
        item.textContent = message
        output.appendChild(item)
      }

      window.alert = (message) => {
        send('info', message)
        writeOutput(String(message))
      }

      window.confirm = (message) => {
        send('info', message)
        writeOutput(String(message))
        return false
      }

      window.prompt = (message, defaultValue) => {
        const text = defaultValue ? String(message) + ' (' + String(defaultValue) + ')' : message
        send('info', text)
        writeOutput(String(text))
        return null
      }

      try {
        ${escaped}
      } catch (error) {
        const message = error && error.message ? error.message : String(error)
        document.body.innerHTML = '<pre>' + message + '</pre>'
        send('error', message)
      }

      const notice = document.getElementById('preview-notice')
      if (notice) {
        const bodyText = document.body.textContent?.trim()
        const noticeText = notice.textContent?.trim()
        const shouldRemove =
          document.body.children.length > 1 || (bodyText && noticeText && bodyText !== noticeText)
        if (shouldRemove) {
          notice.remove()
        } else {
          notice.textContent = 'No visible output. Check the console or DOM changes.'
        }
      }
    </script>
  </body>
</html>`
}
