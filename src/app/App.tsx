import { useEffect, useMemo, useRef, useState } from 'react'
import type { editor as MonacoEditor } from 'monaco-editor'
import './App.css'
import { CodeEditor } from '../editor/CodeEditor'
import { EditorToolbar } from '../editor/EditorToolbar'
import { generateBookmarklet } from '../generator/bookmarklet.generator'
import { findValidationIssues } from '../generator/validator'
import { BookmarkletList } from '../manager/BookmarkletList'
import { useBookmarklets } from '../manager/bookmarklet.store'
import { buildPreviewDocument } from '../preview/preview.controller'
import { SandboxIframe } from '../preview/SandboxIframe'
import { AppLayout } from './layout/AppLayout'

const starterCode = `(() => {
  const selection = window.getSelection()?.toString()
  if (!selection) {
    alert('Select text before running the bookmarklet.')
    return
  }
  alert('Selected: ' + selection)
})()`

function App() {
  const { items, addBookmarklet, updateBookmarklet, removeBookmarklet } =
    useBookmarklets()
  const [sourceCode, setSourceCode] = useState(starterCode)
  const [generatedCode, setGeneratedCode] = useState('')
  const [copyStatus, setCopyStatus] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('Untitled Bookmarklet')
  const [draftTags, setDraftTags] = useState('dom, utility')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'name'>('updated')
  const [consoleEntries, setConsoleEntries] = useState<
    Array<{ id: string; level: string; message: string }>
  >([])
  const [warningsAcknowledged, setWarningsAcknowledged] = useState(false)
  const [consoleStatus, setConsoleStatus] = useState<string | null>(null)
  const [tourStep, setTourStep] = useState<number | null>(null)
  const [consoleFilter, setConsoleFilter] = useState<
    'all' | 'log' | 'info' | 'warn' | 'error'
  >('all')
  const issues = useMemo(() => findValidationIssues(sourceCode), [sourceCode])
  const errorIssues = useMemo(
    () => issues.filter((issue) => issue.level === 'error'),
    [issues],
  )
  const warningIssues = useMemo(
    () => issues.filter((issue) => issue.level === 'warning'),
    [issues],
  )
  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId),
    [items, selectedId],
  )
  const tagOptions = useMemo(() => {
    const tagMap = new Map<string, string>()
    items.forEach((item) => {
      item.tags.forEach((tag) => {
        const key = tag.toLowerCase()
        if (!tagMap.has(key)) {
          tagMap.set(key, tag)
        }
      })
    })
    return Array.from(tagMap.values()).sort((a, b) => a.localeCompare(b))
  }, [items])

  const tourSteps = useMemo(
    () => [
      {
        id: 'editor',
        title: '1. Write your JavaScript',
        body: 'Use the Monaco editor to write or paste your bookmarklet code.',
      },
      {
        id: 'preview',
        title: '2. Preview safely',
        body: 'Run the code in a sandboxed iframe and check the console on the right.',
      },
      {
        id: 'export',
        title: '3. Generate and export',
        body: 'Generate the bookmarklet, then copy or drag it to your bookmarks bar.',
      },
      {
        id: 'library',
        title: '4. Save and manage',
        body: 'Save to your local library, filter by tags, and edit later.',
      },
    ],
    [],
  )
  const activeTourStep = tourStep === null ? null : tourSteps[tourStep]
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null)
  useEffect(() => {
    if (warningIssues.length > 0) {
      setWarningsAcknowledged(false)
    }
  }, [warningIssues.length])
  const previewDoc = useMemo(
    () => buildPreviewDocument(sourceCode),
    [sourceCode],
  )
  const filteredConsoleEntries =
    consoleFilter === 'all'
      ? consoleEntries
      : consoleEntries.filter((entry) => entry.level === consoleFilter)

  const normalizeTags = (value: string) =>
    value
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean)
      .sort()
      .join('|')

  const normalizeTagsArray = (tags: string[]) =>
    tags
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean)
      .sort()
      .join('|')

  const isDirty = useMemo(() => {
    if (!selectedItem) {
      return (
        sourceCode !== starterCode ||
        generatedCode !== '' ||
        draftName !== 'Untitled Bookmarklet' ||
        normalizeTags(draftTags) !== normalizeTags('dom, utility')
      )
    }
    return (
      sourceCode !== selectedItem.sourceCode ||
      generatedCode !== selectedItem.generatedCode ||
      draftName !== selectedItem.name ||
      normalizeTags(draftTags) !== normalizeTagsArray(selectedItem.tags)
    )
  }, [selectedItem, sourceCode, generatedCode, draftName, draftTags])
  const filteredBookmarklets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const tag = tagFilter.trim().toLowerCase()
    const filtered = items.filter((item) => {
      const matchesQuery =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.tags.some((t) => t.toLowerCase().includes(query))
      const matchesTag = !tag || item.tags.some((t) => t.toLowerCase() === tag)
      return matchesQuery && matchesTag
    })
    const sorted = [...filtered]
    sorted.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      }
      if (sortBy === 'created') {
        return b.createdAt - a.createdAt
      }
      return b.updatedAt - a.updatedAt
    })
    return sorted
  }, [items, searchQuery, tagFilter, sortBy])

  const handleGenerate = async () => {
    if (errorIssues.length > 0) {
      setCopyStatus('Fix errors before generating')
      return
    }
    const result = await generateBookmarklet(sourceCode)
    setGeneratedCode(result.bookmarklet)
  }

  const handleReset = () => {
    if (isDirty && !window.confirm('Discard unsaved changes?')) {
      return
    }
    setSourceCode(starterCode)
    setGeneratedCode('')
    setCopyStatus(null)
    setConsoleEntries([])
    setWarningsAcknowledged(false)
    setDraftName('Untitled Bookmarklet')
    setDraftTags('dom, utility')
    setSelectedId(null)
  }

  const handleSave = () => {
    if (!generatedCode) {
      setCopyStatus('Generate first')
      return
    }
    if (warningIssues.length > 0 && !warningsAcknowledged) {
      setCopyStatus('Acknowledge warnings')
      return
    }
    const now = Date.now()
    const id = selectedId ?? (crypto.randomUUID ? crypto.randomUUID() : String(now))
    const tags = draftTags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
    const existing = selectedId
      ? items.find((item) => item.id === selectedId)
      : undefined
    const record = {
      id,
      name: draftName.trim() || 'Untitled Bookmarklet',
      description: '',
      tags,
      sourceCode,
      generatedCode,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    }
    if (selectedId) {
      updateBookmarklet(record)
      setCopyStatus('Updated')
    } else {
      addBookmarklet(record)
      setCopyStatus('Saved')
      setSelectedId(id)
    }
  }

  const handleCopy = async () => {
    if (!generatedCode) {
      setCopyStatus('Generate first')
      return
    }
    try {
      await navigator.clipboard.writeText(generatedCode)
      setCopyStatus('Copied')
    } catch {
      setCopyStatus('Copy failed')
    }
  }

  const handleConsoleMessage = (entry: { level: string; message: string }) => {
    setConsoleEntries((current) => {
      const next = [
        ...current,
        { id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), ...entry },
      ]
      return next.length > 200 ? next.slice(-200) : next
    })
  }

  const handleCopyConsole = async () => {
    if (filteredConsoleEntries.length === 0) {
      setConsoleStatus('No console entries')
      return
    }
    const payload = filteredConsoleEntries
      .map((entry) => `[${entry.level}] ${entry.message}`)
      .join('\n')
    try {
      await navigator.clipboard.writeText(payload)
      setConsoleStatus('Console copied')
    } catch {
      setConsoleStatus('Copy failed')
    }
  }

  const handleDownloadConsole = () => {
    if (filteredConsoleEntries.length === 0) {
      setConsoleStatus('No console entries')
      return
    }
    const payload = filteredConsoleEntries
      .map((entry) => `[${entry.level}] ${entry.message}`)
      .join('\n')
    const blob = new Blob([payload], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'bookmarklet-console.txt'
    anchor.click()
    URL.revokeObjectURL(url)
    setConsoleStatus('Console downloaded')
  }

  const handleStartTour = () => setTourStep(0)
  const handleNextTour = () => {
    if (tourStep === null) {
      return
    }
    const next = tourStep + 1
    if (next >= tourSteps.length) {
      setTourStep(null)
    } else {
      setTourStep(next)
    }
  }
  const handlePrevTour = () => {
    if (tourStep === null) {
      return
    }
    const prev = tourStep - 1
    if (prev < 0) {
      setTourStep(null)
    } else {
      setTourStep(prev)
    }
  }
  const handleStopTour = () => setTourStep(null)

  const handleJumpToWarning = () => {
    const firstIssue = issues[0]
    const editor = editorRef.current
    if (!firstIssue || !editor) {
      return
    }
    const model = editor.getModel()
    if (!model) {
      return
    }
    const start = model.getPositionAt(firstIssue.index)
    const end = model.getPositionAt(firstIssue.index + firstIssue.length)
    editor.revealPositionInCenter(start)
    editor.setSelection({
      startLineNumber: start.lineNumber,
      startColumn: start.column,
      endLineNumber: end.lineNumber,
      endColumn: end.column,
    })
    editor.focus()
  }

  const handleSelectBookmarklet = (bookmarklet: {
    id: string
    name: string
    tags: string[]
    sourceCode: string
    generatedCode: string
  }) => {
    if (isDirty && !window.confirm('Discard unsaved changes?')) {
      return
    }
    setSelectedId(bookmarklet.id)
    setDraftName(bookmarklet.name)
    setDraftTags(bookmarklet.tags.join(', '))
    setSourceCode(bookmarklet.sourceCode)
    setGeneratedCode(bookmarklet.generatedCode)
    setCopyStatus(null)
  }

  return (
    <AppLayout
      action={
        tourStep === null ? (
          <button type="button" className="tour-button" onClick={handleStartTour}>
            Start tour
          </button>
        ) : null
      }
    >
      <main className="app-grid">
        <section
          className={`panel panel-editor ${
            activeTourStep?.id === 'editor' ? 'tour-highlight' : ''
          }`}
        >
          <div className="panel-header">
            <h2>Editor</h2>
            <span className="panel-meta">JavaScript</span>
          </div>
          <div className="panel-body">
            <EditorToolbar
              onGenerate={handleGenerate}
              onReset={handleReset}
              onJumpToIssue={handleJumpToWarning}
              warningsCount={warningIssues.length}
              errorsCount={errorIssues.length}
              hasGenerated={generatedCode.length > 0}
              disableGenerate={errorIssues.length > 0}
            />
            <CodeEditor
              value={sourceCode}
              onChange={setSourceCode}
              issues={issues}
              onEditorReady={(editor) => {
                editorRef.current = editor
              }}
            />
            <div
              className={`generated-output ${
                activeTourStep?.id === 'export' ? 'tour-highlight' : ''
              }`}
            >
              <label htmlFor="bookmarklet-output">Generated bookmarklet</label>
              <textarea
                id="bookmarklet-output"
                readOnly
                value={generatedCode}
                placeholder="Generate to see the encoded bookmarklet."
              />
              <div className="export-actions">
                <button type="button" onClick={handleCopy} disabled={!generatedCode}>
                  Copy to clipboard
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={
                    !generatedCode ||
                    errorIssues.length > 0 ||
                    (warningIssues.length > 0 && !warningsAcknowledged)
                  }
                  title={
                    errorIssues.length > 0
                      ? 'Fix errors before saving.'
                      : warningIssues.length > 0 && !warningsAcknowledged
                      ? 'Acknowledge warnings to save.'
                      : undefined
                  }
                >
                  {selectedId ? 'Update' : 'Save to library'}
                </button>
                <a
                  className={`drag-link ${generatedCode ? '' : 'is-disabled'}`}
                  href={generatedCode || '#'}
                  draggable={Boolean(generatedCode)}
                  onClick={(event) => {
                    if (!generatedCode) {
                      event.preventDefault()
                    }
                  }}
                >
                  Drag to bookmarks bar
                </a>
                {copyStatus ? <span className="copy-status">{copyStatus}</span> : null}
              </div>
            </div>
            {errorIssues.length > 0 ? (
              <div className="error-box">
                <strong>Errors</strong>
                <ul>
                  {errorIssues.map((issue) => (
                    <li key={`${issue.index}-${issue.message}`}>{issue.message}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {warningIssues.length > 0 ? (
              <div className="warning-box">
                <strong>Warnings</strong>
                <ul>
                  {warningIssues.map((issue) => (
                    <li key={`${issue.index}-${issue.message}`}>{issue.message}</li>
                  ))}
                </ul>
                <label className="warning-ack">
                  <input
                    type="checkbox"
                    checked={warningsAcknowledged}
                    onChange={(event) => setWarningsAcknowledged(event.target.checked)}
                  />
                  I understand these warnings.
                </label>
              </div>
            ) : null}
            <div className="save-form">
              <p className="save-mode">
                {selectedId ? 'Editing existing bookmarklet' : 'New bookmarklet'}
              </p>
              <div>
                <label htmlFor="bookmarklet-name">Name</label>
                <input
                  id="bookmarklet-name"
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                />
              </div>
              <div>
                <label htmlFor="bookmarklet-tags">Tags</label>
                <input
                  id="bookmarklet-tags"
                  value={draftTags}
                  onChange={(event) => setDraftTags(event.target.value)}
                  placeholder="comma separated"
                />
              </div>
              <button type="button" className="new-draft" onClick={handleReset}>
                New draft
              </button>
            </div>
          </div>
        </section>

        <section
          className={`panel panel-preview ${
            activeTourStep?.id === 'preview' ? 'tour-highlight' : ''
          }`}
        >
          <div className="panel-header">
            <h2>Preview</h2>
            <span className="panel-meta">Sandbox iframe</span>
          </div>
          <div className="panel-body">
            <SandboxIframe srcDoc={previewDoc} onMessage={handleConsoleMessage} />
            <p className="panel-note">
              Preview runs the current editor content in a sandboxed iframe.
            </p>
            <div className="console-controls">
              <div className="console-filters">
                {['all', 'log', 'info', 'warn', 'error'].map((level) => (
                  <button
                    key={level}
                    type="button"
                    className={consoleFilter === level ? 'active' : ''}
                    onClick={() =>
                      setConsoleFilter(level as 'all' | 'log' | 'info' | 'warn' | 'error')
                    }
                  >
                    {level}
                  </button>
                ))}
              </div>
              <div className="console-actions">
                <button type="button" onClick={handleCopyConsole}>
                  Copy console
                </button>
                <button type="button" onClick={handleDownloadConsole}>
                  Download log
                </button>
                <button
                  type="button"
                  className="console-clear"
                  onClick={() => {
                    setConsoleEntries([])
                    setConsoleStatus(null)
                  }}
                >
                  Clear
                </button>
              </div>
            </div>
            {consoleStatus ? <p className="console-status">{consoleStatus}</p> : null}
            <div className="console-output">
              {filteredConsoleEntries.length === 0 ? (
                <span className="console-empty">Console output will appear here.</span>
              ) : (
                filteredConsoleEntries.map((entry) => (
                  <div key={entry.id} className={`console-line ${entry.level}`}>
                    <span className="console-level">{entry.level}</span>
                    <span>{entry.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>

      <section
        className={`panel panel-manager ${
          activeTourStep?.id === 'library' ? 'tour-highlight' : ''
        }`}
      >
        <div className="panel-header">
          <h2>Bookmarklets</h2>
          <span className="panel-meta">Local library</span>
        </div>
        <div className="panel-body">
          <div className="manager-filters">
            <div>
              <label htmlFor="manager-search">Search</label>
              <input
                id="manager-search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="name, tag, description"
              />
            </div>
            <div>
              <label htmlFor="manager-tag">Tag</label>
              <select
                id="manager-tag"
                value={tagFilter}
                onChange={(event) => setTagFilter(event.target.value)}
              >
                <option value="">All tags</option>
                {tagOptions.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="manager-sort">Sort</label>
              <select
                id="manager-sort"
                value={sortBy}
                onChange={(event) =>
                  setSortBy(event.target.value as 'updated' | 'created' | 'name')
                }
              >
                <option value="updated">Recently updated</option>
                <option value="created">Recently created</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>
            <button
              type="button"
              className="manager-clear"
              onClick={() => {
                setSearchQuery('')
                setTagFilter('')
                setSortBy('updated')
              }}
            >
              Clear filters
            </button>
          </div>
          <BookmarkletList
            items={filteredBookmarklets}
            onDelete={removeBookmarklet}
            onSelect={handleSelectBookmarklet}
          />
        </div>
      </section>
      {activeTourStep ? (
        <div className="tour-overlay" role="dialog" aria-live="polite">
          <div className={`tour-card tour-${activeTourStep.id}`}>
            <div>
              <p className="tour-step">
                Step {tourStep! + 1} / {tourSteps.length}
              </p>
              <h3>{activeTourStep.title}</h3>
              <p>{activeTourStep.body}</p>
            </div>
            <div className="tour-actions">
              <button type="button" onClick={handlePrevTour}>
                Back
              </button>
              <button type="button" onClick={handleNextTour}>
                {tourStep === tourSteps.length - 1 ? 'Finish' : 'Next'}
              </button>
              <button type="button" className="ghost" onClick={handleStopTour}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppLayout>
  )
}

export default App
