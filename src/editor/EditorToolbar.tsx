import './EditorToolbar.css'

type EditorToolbarProps = {
  onGenerate: () => void
  onReset: () => void
  onJumpToIssue?: () => void
  warningsCount: number
  errorsCount: number
  hasGenerated: boolean
  disableGenerate?: boolean
}

export function EditorToolbar({
  onGenerate,
  onReset,
  onJumpToIssue,
  warningsCount,
  errorsCount,
  hasGenerated,
  disableGenerate,
}: EditorToolbarProps) {
  return (
    <div className="editor-toolbar">
      <div className="toolbar-actions">
        <button
          type="button"
          className="primary"
          onClick={onGenerate}
          disabled={disableGenerate}
          title={disableGenerate ? 'Fix errors before generating.' : undefined}
        >
          Generate
        </button>
        <button type="button" className="ghost" onClick={onReset}>
          Reset
        </button>
        {onJumpToIssue ? (
          <button type="button" className="ghost" onClick={onJumpToIssue}>
            Jump to issue
          </button>
        ) : null}
      </div>
      <div className="toolbar-meta">
        {hasGenerated ? <span>Bookmarklet ready</span> : <span>Not generated</span>}
        {errorsCount > 0 ? (
          <span className="error-pill">{errorsCount} errors</span>
        ) : null}
        {warningsCount > 0 ? (
          <span className="warning-pill">{warningsCount} warnings</span>
        ) : (
          <span className="ok-pill">No warnings</span>
        )}
      </div>
    </div>
  )
}
