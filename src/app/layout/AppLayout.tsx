import type { ReactNode } from 'react'
import './AppLayout.css'

type AppLayoutProps = {
  children: ReactNode
  action?: ReactNode
}

export function AppLayout({ children, action }: AppLayoutProps) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="app-eyebrow">Bookmarklets Creator</p>
          <h1>Build, test, and ship tiny automations.</h1>
        </div>
        <div className="app-actions">
          {action}
          <div className="app-status">
            <span className="status-dot" aria-hidden="true" />
            <span>MVP in progress</span>
          </div>
        </div>
      </header>
      {children}
    </div>
  )
}
