import { useEffect, useRef } from 'react'
import './SandboxIframe.css'

type SandboxIframeProps = {
  srcDoc: string
  onMessage?: (payload: { level: string; message: string }) => void
}

export function SandboxIframe({ srcDoc, onMessage }: SandboxIframeProps) {
  const frameRef = useRef<HTMLIFrameElement | null>(null)
  useEffect(() => {
    if (!onMessage) {
      return
    }
    const handler = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow) {
        return
      }
      if (!event.data || event.data.type !== 'bookmarklet-console') {
        return
      }
      const { level, payload } = event.data as {
        level?: string
        payload?: string
      }
      if (!level || typeof payload !== 'string') {
        return
      }
      onMessage({ level, message: payload })
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [onMessage])

  return (
    <iframe
      className="sandbox-frame"
      title="Bookmarklet preview"
      sandbox="allow-scripts allow-modals"
      srcDoc={srcDoc}
      ref={frameRef}
    />
  )
}
