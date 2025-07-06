import { useEffect, useRef } from 'react'
import Editor from '@monaco-editor/react'
import { useCodeStore } from '../stores/codeStore'
import { useThemeStore } from '../stores/themeStore'
import { Button } from './ui/Button'
import { X, FileText } from 'lucide-react'
import { cn } from '../lib/utils'

const CodeEditor = () => {
  const { files, activeFileId, setActiveFile, updateFile, deleteFile, getActiveFile } = useCodeStore()
  const { theme } = useThemeStore()
  const editorRef = useRef<any>(null)
  
  const activeFile = getActiveFile()

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor
  }

  const handleEditorChange = (value: string | undefined) => {
    if (activeFile && value !== undefined) {
      updateFile(activeFile.id, value)
    }
  }

  const getLanguageIcon = (language: string) => {
    const icons: Record<string, string> = {
      javascript: '🟨',
      typescript: '🔷',
      python: '🐍',
      java: '☕',
      cpp: '⚡',
      c: '🔧',
      go: '🐹',
      rust: '🦀',
    }
    return icons[language] || '📄'
  }

  return (
    <div className="h-[600px] flex flex-col">
      {/* File Tabs */}
      {files.length > 0 && (
        <div className="flex items-center border-b bg-muted/50 overflow-x-auto">
          {files.map((file) => (
            <div
              key={file.id}
              className={cn(
                "flex items-center px-3 py-2 border-r cursor-pointer hover:bg-muted transition-colors min-w-0",
                activeFileId === file.id ? "bg-background border-b-2 border-primary" : ""
              )}
              onClick={() => setActiveFile(file.id)}
            >
              <span className="mr-2 text-sm">{getLanguageIcon(file.language)}</span>
              <span className="text-sm truncate max-w-32">{file.name}</span>
              <Button
                size="sm"
                variant="ghost"
                className="ml-2 h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                onClick={(e) => {
                  e.stopPropagation()
                  deleteFile(file.id)
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Editor */}
      <div className="flex-1">
        {activeFile ? (
          <Editor
            height="100%"
            language={activeFile.language}
            value={activeFile.content}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            theme={theme === 'dark' ? 'vs-dark' : 'light'}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              roundedSelection: false,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              insertSpaces: true,
              wordWrap: 'on',
              bracketPairColorization: { enabled: true },
              guides: {
                bracketPairs: true,
                indentation: true,
              },
              suggest: {
                showKeywords: true,
                showSnippets: true,
              },
              quickSuggestions: {
                other: true,
                comments: true,
                strings: true,
              },
            }}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No file selected</p>
              <p className="text-sm">Create a new file or select an existing one to start coding</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CodeEditor