import { useEffect, useMemo, useRef, useState } from 'react'
import type { editor as MonacoEditor } from 'monaco-editor'
import './App.scss'
import { CodeEditor } from '../editor/CodeEditor'
import { EditorToolbar } from '../editor/EditorToolbar'
import { generateBookmarklet } from '../generator/bookmarklet.generator'
import { findValidationIssues } from '../generator/validator'
import { BookmarkletList } from '../manager/BookmarkletList'
import { useBookmarklets } from '../manager/bookmarklet.store'
import { buildPreviewDocument } from '../preview/preview.controller'
import { SandboxIframe } from '../preview/SandboxIframe'
import { loadSettings, saveSettings } from '../storage/settings'
import { AppLayout } from './layout/AppLayout'
import { mockProvider } from '../ai/mock.provider'
import type { AiResponse } from '../ai/ai.types'
import { createOpenAiProvider } from '../ai/providers/openai'
import { createAnthropicProvider } from '../ai/providers/anthropic'
import { createOpenRouterProvider } from '../ai/providers/openrouter'

const starterCode = `(() => {
  const selection = window.getSelection()?.toString()
  if (!selection) {
    alert('Select text before running the bookmarklet.')
    return
  }
  alert('Selected: ' + selection)
})()`

function App() {
  const { items, addBookmarklet, updateBookmarklet, removeBookmarklet, resetLibrary } =
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
  const [toasts, setToasts] = useState<Array<{ id: string; message: string }>>([])
  const [tourStep, setTourStep] = useState<number | null>(null)
  const [theme, setTheme] = useState(() => loadSettings().theme)
  const [aiProviderKey, setAiProviderKey] = useState<
    'none' | 'mock' | 'openai' | 'anthropic' | 'openrouter'
  >(() => loadSettings().aiProvider)
  const [aiConsent, setAiConsent] = useState(() => loadSettings().aiConsent)
  const [autosaveStatus, setAutosaveStatus] = useState<string | null>(null)
  const [previewLoaded, setPreviewLoaded] = useState(false)
  const [aiMode, setAiMode] = useState<'generate' | 'explain' | null>(null)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiStatus, setAiStatus] = useState<'idle' | 'loading' | 'done' | 'error'>(
    'idle',
  )
  const [aiResponse, setAiResponse] = useState<AiResponse | null>(null)
  const [aiConsentOpen, setAiConsentOpen] = useState(false)
  const aiConfigured = aiProviderKey !== 'none'
  const openRouterApiKey = import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined
  const aiProvider =
    aiProviderKey === 'mock'
      ? mockProvider
      : aiProviderKey === 'openrouter' && openRouterApiKey
      ? createOpenRouterProvider(openRouterApiKey)
      : null
  const aiProviderReady =
    aiProviderKey === 'mock' ||
    (aiProviderKey === 'openrouter' && Boolean(openRouterApiKey))
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

  const aiSanitizedCode = useMemo(() => {
    if (!aiResponse?.code) {
      return ''
    }
    let cleaned = aiResponse.code.trim()
    const prefixPattern = /^\s*javascript\s*:?\s*(\r?\n)?/i
    while (prefixPattern.test(cleaned)) {
      cleaned = cleaned.replace(prefixPattern, '')
    }
    return cleaned.trim()
  }, [aiResponse?.code])

  const diffLines = useMemo(() => {
    if (!aiResponse?.code) {
      return null
    }
    const currentLines = sourceCode.split('\n')
    const aiLines = aiSanitizedCode.split('\n')
    const maxLines = Math.max(currentLines.length, aiLines.length)
    const current = []
    const ai = []
    for (let i = 0; i < maxLines; i += 1) {
      const currentLine = currentLines[i]
      const aiLine = aiLines[i]
      const isSame = currentLine === aiLine
      current.push({
        line: currentLine ?? '',
        status: currentLine === undefined ? 'empty' : isSame ? 'same' : 'changed',
        number: i + 1,
      })
      ai.push({
        line: aiLine ?? '',
        status: aiLine === undefined ? 'empty' : isSame ? 'same' : 'changed',
        number: i + 1,
      })
    }
    return { current, ai }
  }, [aiResponse?.code, aiSanitizedCode, sourceCode])

  const diffStats = useMemo(() => {
    if (!aiResponse?.code) {
      return null
    }
    const currentLines = sourceCode.split('\n')
    const aiLines = aiSanitizedCode.split('\n')
    const maxLines = Math.max(currentLines.length, aiLines.length)
    let changed = 0
    for (let i = 0; i < maxLines; i += 1) {
      if ((currentLines[i] ?? '') !== (aiLines[i] ?? '')) {
        changed += 1
      }
    }
    return {
      current: currentLines.length,
      ai: aiLines.length,
      changed,
    }
  }, [aiResponse?.code, aiSanitizedCode, sourceCode])

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

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    saveSettings({ theme, aiProvider: aiProviderKey, aiConsent })
  }, [theme, aiProviderKey, aiConsent])

  useEffect(() => {
    if (toasts.length === 0) {
      return
    }
    const timer = window.setTimeout(() => {
      setToasts((current) => current.slice(1))
    }, 2500)
    return () => window.clearTimeout(timer)
  }, [toasts])

  useEffect(() => {
    setPreviewLoaded(false)
  }, [sourceCode])
  useEffect(() => {
    if (!selectedId) {
      setAutosaveStatus(null)
      return
    }
    if (!isDirty || errorIssues.length > 0 || !generatedCode) {
      return
    }
    if (warningIssues.length > 0 && !warningsAcknowledged) {
      return
    }
    const timer = window.setTimeout(() => {
      const now = Date.now()
      const tags = draftTags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
      const record = {
        id: selectedId,
        name: draftName.trim() || 'Untitled Bookmarklet',
        description: '',
        tags,
        sourceCode,
        generatedCode,
        createdAt: selectedItem?.createdAt ?? now,
        updatedAt: now,
      }
      updateBookmarklet(record)
      setAutosaveStatus('Auto-saved')
    }, 1200)
    return () => window.clearTimeout(timer)
  }, [
    selectedId,
    isDirty,
    errorIssues.length,
    warningIssues.length,
    warningsAcknowledged,
    generatedCode,
    sourceCode,
    draftName,
    draftTags,
    selectedItem,
    updateBookmarklet,
  ])
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
    setAutosaveStatus(null)
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
      setToasts((current) => [
        ...current,
        { id: crypto.randomUUID(), message: 'Bookmarklet updated' },
      ])
    } else {
      addBookmarklet(record)
      setCopyStatus('Saved')
      setSelectedId(id)
      setToasts((current) => [
        ...current,
        { id: crypto.randomUUID(), message: 'Bookmarklet saved' },
      ])
    }
    setAutosaveStatus(null)
  }

  const handleCopy = async () => {
    if (!generatedCode) {
      setCopyStatus('Generate first')
      return
    }
    try {
      await navigator.clipboard.writeText(generatedCode)
      setCopyStatus('Copied')
      setToasts((current) => [
        ...current,
        { id: crypto.randomUUID(), message: 'Copied to clipboard' },
      ])
    } catch {
      setCopyStatus('Copy failed')
    }
  }

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) {
        return
      }
      if (event.key === 'Enter') {
        event.preventDefault()
        void handleGenerate()
      }
      if (event.key.toLowerCase() === 's') {
        event.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleGenerate, handleSave])

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

  const handleAiClose = () => {
    setAiMode(null)
    setAiStatus('idle')
    setAiResponse(null)
    setAiPrompt('')
  }

  const handleAiGenerate = async () => {
    if (!aiProvider) {
      setAiStatus('error')
      setAiResponse({ blocked: true, blockReason: 'Provider not wired yet.' })
      return
    }
    const needsConsent =
      aiProviderKey === 'openrouter' && !aiConsent.openrouter && aiProviderReady
    if (needsConsent) {
      setAiConsentOpen(true)
      return
    }
    if (!aiPrompt.trim()) {
      setAiStatus('error')
      setAiResponse({ blocked: true, blockReason: 'Describe what you want to build.' })
      return
    }
    setAiStatus('loading')
    try {
      const response = await aiProvider.generate({
        intent: 'generate',
        prompt: aiPrompt,
        options: { maxChars: 4000 },
      })
      setAiResponse(response)
      setAiStatus('done')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI request failed.'
      setAiStatus('error')
      setAiResponse({ blocked: true, blockReason: message })
    }
  }

  const handleAiExplain = async () => {
    if (!aiProvider) {
      setAiStatus('error')
      setAiResponse({ blocked: true, blockReason: 'Provider not wired yet.' })
      return
    }
    const needsConsent =
      aiProviderKey === 'openrouter' && !aiConsent.openrouter && aiProviderReady
    if (needsConsent) {
      setAiConsentOpen(true)
      return
    }
    setAiStatus('loading')
    try {
      const response = await aiProvider.generate({
        intent: 'explain',
        prompt: '',
        sourceCode,
      })
      setAiResponse(response)
      setAiStatus('done')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI request failed.'
      setAiStatus('error')
      setAiResponse({ blocked: true, blockReason: message })
    }
  }

  const handleAiInsert = () => {
    if (!aiResponse?.code) {
      return
    }
    setSourceCode(aiSanitizedCode)
    setAiMode(null)
    setAiStatus('idle')
    setAiResponse(null)
    setAiPrompt('')
  }

  const handleAiConsentAccept = () => {
    if (aiProviderKey === 'openrouter') {
      setAiConsent((current) => ({ ...current, openrouter: true }))
    }
    setAiConsentOpen(false)
  }

  const handleAiConsentDecline = () => {
    setAiConsentOpen(false)
  }

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
    setAutosaveStatus(null)
  }

  const handleResetLibrary = async () => {
    if (!window.confirm('Reset the library to demo data? This will remove saved items.')) {
      return
    }
    await resetLibrary()
    setSelectedId(null)
    setAutosaveStatus(null)
    setCopyStatus('Library reset')
    setToasts((current) => [
      ...current,
      { id: crypto.randomUUID(), message: 'Library reset to demo data' },
    ])
  }

  return (
    <AppLayout
      action={
        tourStep === null ? (
          <>
            <button
              type="button"
              className="theme-toggle"
              onClick={() =>
                setTheme((current) => (current === 'light' ? 'dark' : 'light'))
              }
            >
              {theme === 'light' ? 'Dark mode' : 'Light mode'}
            </button>
            <button type="button" className="tour-button" onClick={handleStartTour}>
              Start tour
            </button>
          </>
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
              onAiGenerate={() => setAiMode('generate')}
              onAiExplain={() => setAiMode('explain')}
              warningsCount={warningIssues.length}
              errorsCount={errorIssues.length}
              hasGenerated={generatedCode.length > 0}
              disableGenerate={errorIssues.length > 0}
            />
            {aiMode ? (
              <div className="ai-panel">
                <div className="ai-header">
                  <div>
                    <p className="ai-eyebrow">AI Assist</p>
                    <h3>{aiMode === 'generate' ? 'Create with AI' : 'Explain code'}</h3>
                  </div>
                  <button type="button" className="ai-close" onClick={handleAiClose}>
                    Close
                  </button>
                </div>
                {!aiConfigured ? (
                  <div className="ai-empty">
                    <p>AI is not configured yet. Connect a provider to enable this feature.</p>
                    <label htmlFor="ai-provider">Provider</label>
                    <select
                      id="ai-provider"
                      value={aiProviderKey}
                      onChange={(event) =>
                        setAiProviderKey(
                          event.target.value as
                            | 'none'
                            | 'mock'
                            | 'openai'
                            | 'anthropic'
                            | 'openrouter',
                        )
                      }
                    >
                      <option value="none">Not configured</option>
                      <option value="mock">Mock (local)</option>
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                      <option value="openrouter">OpenRouter</option>
                    </select>
                  </div>
                ) : (
                  <div className="ai-form">
                    <div className="ai-provider">
                      <label htmlFor="ai-provider">Provider</label>
                      <select
                        id="ai-provider"
                        value={aiProviderKey}
                      onChange={(event) =>
                        setAiProviderKey(
                          event.target.value as
                            | 'none'
                            | 'mock'
                            | 'openai'
                            | 'anthropic'
                            | 'openrouter',
                        )
                      }
                      >
                        <option value="mock">Mock (local)</option>
                        <option value="openai">OpenAI</option>
                        <option value="anthropic">Anthropic</option>
                        <option value="openrouter">OpenRouter</option>
                        <option value="none">Disable AI</option>
                      </select>
                    </div>
                    {aiProviderKey === 'openrouter' ? (
                      <div className="ai-key">
                        <label>API key source</label>
                        <p>
                          Uses <code>VITE_OPENROUTER_API_KEY</code> from <code>.env.local</code>.
                        </p>
                      </div>
                    ) : null}
                    {aiProviderKey === 'openrouter' && aiConsent.openrouter ? (
                      <button
                        type="button"
                        className="ai-revoke"
                        onClick={() =>
                          setAiConsent((current) => ({ ...current, openrouter: false }))
                        }
                      >
                        Revoke consent
                      </button>
                    ) : null}
                    {!aiProviderReady ? (
                      <p className="ai-warning">
                        {aiProviderKey === 'openrouter'
                          ? 'Add VITE_OPENROUTER_API_KEY to enable OpenRouter.'
                          : 'This provider is not wired yet. Select Mock (local) to try the flow.'}
                      </p>
                    ) : null}
                    {aiMode === 'generate' ? (
                      <>
                        <label htmlFor="ai-prompt">Describe the bookmarklet</label>
                        <textarea
                          id="ai-prompt"
                          value={aiPrompt}
                          onChange={(event) => setAiPrompt(event.target.value)}
                          placeholder="e.g., Highlight all external links in red"
                        />
                        {aiResponse?.blocked ? (
                          <p className="ai-error">{aiResponse.blockReason}</p>
                        ) : null}
                        <div className="ai-form-actions">
                          <button
                            type="button"
                            className="primary"
                            onClick={handleAiGenerate}
                            disabled={aiStatus === 'loading' || !aiProviderReady}
                          >
                            {aiStatus === 'loading' ? 'Generating...' : 'Generate'}
                          </button>
                          <button type="button" className="ghost" onClick={handleAiClose}>
                            Cancel
                          </button>
                        </div>
                        {aiResponse?.code ? (
                          <div className="ai-result">
                            <label>Generated code</label>
                            <textarea readOnly value={aiSanitizedCode} />
                            {aiResponse.warnings?.length ? (
                              <p className="ai-warning">
                                Warnings: {aiResponse.warnings.join(', ')}
                              </p>
                            ) : null}
                            {diffStats ? (
                              <div className="ai-diff">
                                <span>Lines (current): {diffStats.current}</span>
                                <span>Lines (AI): {diffStats.ai}</span>
                                <span>Lines changed: {diffStats.changed}</span>
                              </div>
                            ) : null}
                            {diffLines ? (
                              <div className="ai-compare">
                                <div className="ai-compare-grid">
                                  <div className="ai-compare-panel">
                                    <label>Current code</label>
                                    <pre className="ai-code">
                                      {diffLines.current.map((entry) => (
                                        <div
                                          key={`current-${entry.number}`}
                                          className={`ai-line ${entry.status}`}
                                        >
                                          <span className="ai-line-number">
                                            {entry.number}
                                          </span>
                                          <span className="ai-line-text">{entry.line}</span>
                                        </div>
                                      ))}
                                    </pre>
                                  </div>
                                  <div className="ai-compare-panel">
                                    <label>AI code</label>
                                    <pre className="ai-code">
                                      {diffLines.ai.map((entry) => (
                                        <div
                                          key={`ai-${entry.number}`}
                                          className={`ai-line ${entry.status}`}
                                        >
                                          <span className="ai-line-number">
                                            {entry.number}
                                          </span>
                                          <span className="ai-line-text">{entry.line}</span>
                                        </div>
                                      ))}
                                    </pre>
                                  </div>
                                </div>
                              </div>
                            ) : null}
                            <button type="button" className="primary" onClick={handleAiInsert}>
                              Apply to editor
                            </button>
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <>
                        <p>Explain mode will summarize and annotate the current editor code.</p>
                        <div className="ai-form-actions">
                          <button
                            type="button"
                            className="primary"
                            onClick={handleAiExplain}
                            disabled={aiStatus === 'loading' || !aiProviderReady}
                          >
                            {aiStatus === 'loading' ? 'Explaining...' : 'Explain'}
                          </button>
                          <button type="button" className="ghost" onClick={handleAiClose}>
                            Cancel
                          </button>
                        </div>
                        {aiResponse?.explanation?.length ? (
                          <ul className="ai-explain">
                            {aiResponse.explanation.map((line) => (
                              <li key={line}>{line}</li>
                            ))}
                          </ul>
                        ) : null}
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : null}
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
                <div className="drag-group">
                  <a
                    className={`drag-link ${generatedCode ? '' : 'is-disabled'}`}
                    href={generatedCode || '#'}
                    draggable={Boolean(generatedCode)}
                    aria-disabled={!generatedCode}
                    onClick={(event) => {
                      event.preventDefault()
                      if (!generatedCode) {
                        return
                      }
                      setToasts((current) => [
                        ...current,
                        {
                          id: crypto.randomUUID(),
                          message: 'Drag this bookmarklet into your bookmarks bar.',
                        },
                      ])
                    }}
                    onDragStart={(event) => {
                      if (!generatedCode) {
                        event.preventDefault()
                        return
                      }
                      const label = draftName.trim() || 'Bookmarklet'
                      event.dataTransfer.effectAllowed = 'copy'
                      event.dataTransfer.setData('text/uri-list', generatedCode)
                      event.dataTransfer.setData('text/plain', label)
                      event.dataTransfer.setData(
                        'text/html',
                        `<a href="${generatedCode}">${label}</a>`,
                      )
                    }}
                  >
                    {draftName.trim() || 'Bookmarklet'}
                  </a>
                  <span className="drag-hint">Drag to bookmarks bar</span>
                </div>
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
                {autosaveStatus ? ` • ${autosaveStatus}` : ''}
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
            <SandboxIframe
              srcDoc={previewDoc}
              onMessage={handleConsoleMessage}
              onLoad={() => setPreviewLoaded(true)}
            />
            <p className="panel-note">
              {previewLoaded
                ? 'Preview ready in sandboxed iframe.'
                : 'Loading preview in sandboxed iframe...'}
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
            <button type="button" className="manager-reset" onClick={handleResetLibrary}>
              Reset demo data
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
      {aiConsentOpen ? (
        <div className="ai-consent-overlay" role="dialog" aria-live="polite">
          <div className="ai-consent-card">
            <h3>AI Provider Consent</h3>
            <p>
              Using a remote AI provider sends your prompt and relevant code to
              that service. Continue only if you agree.
            </p>
            <div className="ai-consent-actions">
              <button type="button" onClick={handleAiConsentDecline}>
                Cancel
              </button>
              <button type="button" className="primary" onClick={handleAiConsentAccept}>
                I agree
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className="toast">
            {toast.message}
          </div>
        ))}
      </div>
    </AppLayout>
  )
}

export default App
