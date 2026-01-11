import { useEffect, useRef } from 'react'
import * as monaco from 'monaco-editor'
import 'monaco-editor/min/vs/editor/editor.main.css'
import './CodeEditor.css'
import type { ValidationIssue } from '../generator/validator'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

if (typeof window !== 'undefined') {
  ;(self as unknown as {
    MonacoEnvironment?: { getWorker: (moduleId: string, label: string) => Worker }
  }).MonacoEnvironment = {
    getWorker(_moduleId, label) {
      if (label === 'json') {
        return new JsonWorker()
      }
      if (label === 'css' || label === 'scss' || label === 'less') {
        return new CssWorker()
      }
      if (label === 'html' || label === 'handlebars' || label === 'razor') {
        return new HtmlWorker()
      }
      if (label === 'typescript' || label === 'javascript') {
        return new TsWorker()
      }
      return new EditorWorker()
    },
  }
}

type CodeEditorProps = {
  value: string
  onChange: (value: string) => void
  issues?: ValidationIssue[]
  onEditorReady?: (editor: monaco.editor.IStandaloneCodeEditor) => void
}

export function CodeEditor({
  value,
  onChange,
  issues = [],
  onEditorReady,
}: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const lastValueRef = useRef(value)

  useEffect(() => {
    if (!containerRef.current) {
      return
    }

    const editor = monaco.editor.create(containerRef.current, {
      value,
      language: 'javascript',
      minimap: { enabled: false },
      fontSize: 14,
      lineHeight: 22,
      automaticLayout: true,
      scrollBeyondLastLine: false,
    })

    editor.onDidChangeModelContent(() => {
      const nextValue = editor.getValue()
      lastValueRef.current = nextValue
      onChange(nextValue)
    })

    editorRef.current = editor
    onEditorReady?.(editor)

    return () => {
      editor.dispose()
      editorRef.current = null
    }
  }, [])

  useEffect(() => {
    const model = editorRef.current?.getModel()
    if (!model) {
      return
    }
    const markers: monaco.editor.IMarkerData[] = issues.map((issue) => {
      const start = model.getPositionAt(issue.index)
      const end = model.getPositionAt(issue.index + issue.length)
      return {
        severity:
          issue.level === 'error'
            ? monaco.MarkerSeverity.Error
            : monaco.MarkerSeverity.Warning,
        message: issue.message,
        startLineNumber: start.lineNumber,
        startColumn: start.column,
        endLineNumber: end.lineNumber,
        endColumn: end.column,
      }
    })
    monaco.editor.setModelMarkers(model, 'bookmarklet-validator', markers)
  }, [issues])

  useEffect(() => {
    if (!editorRef.current) {
      return
    }
    if (value === lastValueRef.current) {
      return
    }
    editorRef.current.setValue(value)
    lastValueRef.current = value
  }, [value])

  return (
    <div className="code-editor" ref={containerRef} />
  )
}
