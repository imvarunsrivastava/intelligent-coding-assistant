import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { 
  Play, 
  Download, 
  Copy, 
  RefreshCw, 
  TestTube, 
  Bug, 
  FileText, 
  Zap,
  Settings,
  Save,
  FolderOpen
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs'
import { Textarea } from '../components/ui/Textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select'
import { Input } from '../components/ui/Input'
import { apiClient } from '../services/api'
import { useCodeStore } from '../stores/codeStore'
import CodeEditor from '../components/CodeEditor'
import toast from 'react-hot-toast'
import { copyToClipboard, generateId } from '../lib/utils'

const PlaygroundPage = () => {
  const [activeTab, setActiveTab] = useState('generate')
  const [description, setDescription] = useState('')
  const [language, setLanguage] = useState('python')
  const [style, setStyle] = useState('clean')
  const [goals, setGoals] = useState<string[]>([])
  const [testFramework, setTestFramework] = useState('pytest')
  const [errorMessage, setErrorMessage] = useState('')
  const [result, setResult] = useState('')
  
  const { files, activeFileId, addFile, updateFile, getActiveFile } = useCodeStore()
  const activeFile = getActiveFile()

  const languages = [
    { value: 'python', label: 'Python' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'c', label: 'C' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
  ]

  const codeStyles = [
    { value: 'clean', label: 'Clean' },
    { value: 'functional', label: 'Functional' },
    { value: 'object-oriented', label: 'Object-Oriented' },
    { value: 'minimal', label: 'Minimal' },
    { value: 'documented', label: 'Well Documented' },
  ]

  const refactoringGoals = [
    'Improve readability',
    'Optimize performance',
    'Reduce complexity',
    'Follow best practices',
    'Add error handling',
    'Improve maintainability'
  ]

  const testFrameworks = {
    python: ['pytest', 'unittest', 'nose2'],
    javascript: ['jest', 'mocha', 'jasmine'],
    typescript: ['jest', 'mocha', 'jasmine'],
    java: ['junit', 'testng'],
    cpp: ['gtest', 'catch2'],
    c: ['unity', 'cmocka']
  }

  // Mutations
  const generateCodeMutation = useMutation({
    mutationFn: apiClient.generateCode,
    onSuccess: (data) => {
      setResult(data)
      toast.success('Code generated successfully!')
    },
    onError: (error) => {
      toast.error(`Generation failed: ${error.message}`)
    }
  })

  const explainCodeMutation = useMutation({
    mutationFn: apiClient.explainCode,
    onSuccess: (data) => {
      setResult(data)
      toast.success('Code explained successfully!')
    },
    onError: (error) => {
      toast.error(`Explanation failed: ${error.message}`)
    }
  })

  const refactorCodeMutation = useMutation({
    mutationFn: apiClient.refactorCode,
    onSuccess: (data) => {
      setResult(`${data.code}\n\n/* Improvements:\n${data.improvements.map(imp => `- ${imp}`).join('\n')}\n*/`)
      toast.success('Code refactored successfully!')
    },
    onError: (error) => {
      toast.error(`Refactoring failed: ${error.message}`)
    }
  })

  const generateTestsMutation = useMutation({
    mutationFn: apiClient.generateTests,
    onSuccess: (data) => {
      setResult(data)
      toast.success('Tests generated successfully!')
    },
    onError: (error) => {
      toast.error(`Test generation failed: ${error.message}`)
    }
  })

  const debugCodeMutation = useMutation({
    mutationFn: apiClient.debugCode,
    onSuccess: (data) => {
      const suggestions = data.suggestions.map(s => `- ${s}`).join('\n')
      const fixedCode = data.fixed_code ? `\n\nFixed Code:\n${data.fixed_code}` : ''
      setResult(`Debug Suggestions:\n${suggestions}${fixedCode}`)
      toast.success('Debug analysis completed!')
    },
    onError: (error) => {
      toast.error(`Debug analysis failed: ${error.message}`)
    }
  })

  const optimizeCodeMutation = useMutation({
    mutationFn: apiClient.optimizeCode,
    onSuccess: (data) => {
      setResult(`${data.optimized_code}\n\n/* Optimizations:\n${data.improvements.map(imp => `- ${imp}`).join('\n')}\n*/`)
      toast.success('Code optimized successfully!')
    },
    onError: (error) => {
      toast.error(`Optimization failed: ${error.message}`)
    }
  })

  const generateDocsMutation = useMutation({
    mutationFn: apiClient.generateDocumentation,
    onSuccess: (data) => {
      setResult(data)
      toast.success('Documentation generated successfully!')
    },
    onError: (error) => {
      toast.error(`Documentation generation failed: ${error.message}`)
    }
  })

  const handleGenerateCode = () => {
    if (!description.trim()) {
      toast.error('Please enter a description')
      return
    }

    generateCodeMutation.mutate({
      description,
      language,
      style,
      max_tokens: 1000
    })
  }

  const handleExplainCode = () => {
    if (!activeFile?.content.trim()) {
      toast.error('Please select code to explain')
      return
    }

    explainCodeMutation.mutate({
      code: activeFile.content,
      language: activeFile.language,
      detail_level: 'detailed'
    })
  }

  const handleRefactorCode = () => {
    if (!activeFile?.content.trim()) {
      toast.error('Please select code to refactor')
      return
    }

    if (goals.length === 0) {
      toast.error('Please select refactoring goals')
      return
    }

    refactorCodeMutation.mutate({
      code: activeFile.content,
      language: activeFile.language,
      goals,
      preserve_functionality: true
    })
  }

  const handleGenerateTests = () => {
    if (!activeFile?.content.trim()) {
      toast.error('Please select code to test')
      return
    }

    generateTestsMutation.mutate({
      code: activeFile.content,
      language: activeFile.language,
      test_framework: testFramework,
      test_types: ['unit']
    })
  }

  const handleDebugCode = () => {
    if (!activeFile?.content.trim()) {
      toast.error('Please select code to debug')
      return
    }

    debugCodeMutation.mutate({
      code: activeFile.content,
      error_message: errorMessage,
      language: activeFile.language
    })
  }

  const handleOptimizeCode = () => {
    if (!activeFile?.content.trim()) {
      toast.error('Please select code to optimize')
      return
    }

    optimizeCodeMutation.mutate({
      code: activeFile.content,
      language: activeFile.language,
      optimization_goals: ['Improve performance', 'Reduce complexity']
    })
  }

  const handleGenerateDocs = () => {
    if (!activeFile?.content.trim()) {
      toast.error('Please select code to document')
      return
    }

    generateDocsMutation.mutate({
      code: activeFile.content,
      language: activeFile.language,
      doc_style: 'google',
      include_examples: true
    })
  }

  const handleCopyResult = async () => {
    try {
      await copyToClipboard(result)
      toast.success('Copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy')
    }
  }

  const handleInsertResult = () => {
    if (result && activeFile) {
      updateFile(activeFile.id, result)
      toast.success('Code inserted!')
    } else {
      // Create new file
      const fileId = addFile({
        name: `generated_${Date.now()}.${language === 'python' ? 'py' : language === 'javascript' ? 'js' : language}`,
        language,
        content: result
      })
      toast.success('New file created!')
    }
  }

  const handleCreateNewFile = () => {
    const fileId = addFile({
      name: `untitled_${Date.now()}.${language === 'python' ? 'py' : language === 'javascript' ? 'js' : language}`,
      language,
      content: ''
    })
    toast.success('New file created!')
  }

  const isLoading = generateCodeMutation.isPending || 
                   explainCodeMutation.isPending || 
                   refactorCodeMutation.isPending || 
                   generateTestsMutation.isPending || 
                   debugCodeMutation.isPending || 
                   optimizeCodeMutation.isPending || 
                   generateDocsMutation.isPending

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">AI Coding Playground</h1>
        <p className="text-muted-foreground mt-2">
          Generate, explain, refactor, and optimize code with AI assistance
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Panel - Controls */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                AI Assistant
              </CardTitle>
              <CardDescription>
                Choose what you want to do with your code
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="generate">Generate</TabsTrigger>
                  <TabsTrigger value="analyze">Analyze</TabsTrigger>
                  <TabsTrigger value="improve">Improve</TabsTrigger>
                </TabsList>

                <TabsContent value="generate" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <Textarea
                        placeholder="Describe the code you want to generate..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Language</label>
                        <Select value={language} onValueChange={setLanguage}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {languages.map((lang) => (
                              <SelectItem key={lang.value} value={lang.value}>
                                {lang.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Style</label>
                        <Select value={style} onValueChange={setStyle}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {codeStyles.map((style) => (
                              <SelectItem key={style.value} value={style.value}>
                                {style.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button 
                      onClick={handleGenerateCode} 
                      loading={generateCodeMutation.isPending}
                      className="w-full"
                    >
                      <Zap className="mr-2 h-4 w-4" />
                      Generate Code
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="analyze" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      onClick={handleExplainCode} 
                      loading={explainCodeMutation.isPending}
                      variant="outline"
                      className="h-20 flex-col"
                    >
                      <FileText className="h-6 w-6 mb-2" />
                      Explain Code
                    </Button>
                    
                    <Button 
                      onClick={handleDebugCode} 
                      loading={debugCodeMutation.isPending}
                      variant="outline"
                      className="h-20 flex-col"
                    >
                      <Bug className="h-6 w-6 mb-2" />
                      Debug Code
                    </Button>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Error Message (Optional)</label>
                    <Input
                      placeholder="Enter error message if any..."
                      value={errorMessage}
                      onChange={(e) => setErrorMessage(e.target.value)}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="improve" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      onClick={handleRefactorCode} 
                      loading={refactorCodeMutation.isPending}
                      variant="outline"
                      className="h-20 flex-col"
                    >
                      <RefreshCw className="h-6 w-6 mb-2" />
                      Refactor
                    </Button>
                    
                    <Button 
                      onClick={handleOptimizeCode} 
                      loading={optimizeCodeMutation.isPending}
                      variant="outline"
                      className="h-20 flex-col"
                    >
                      <Zap className="h-6 w-6 mb-2" />
                      Optimize
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      onClick={handleGenerateTests} 
                      loading={generateTestsMutation.isPending}
                      variant="outline"
                      className="h-20 flex-col"
                    >
                      <TestTube className="h-6 w-6 mb-2" />
                      Generate Tests
                    </Button>
                    
                    <Button 
                      onClick={handleGenerateDocs} 
                      loading={generateDocsMutation.isPending}
                      variant="outline"
                      className="h-20 flex-col"
                    >
                      <FileText className="h-6 w-6 mb-2" />
                      Add Docs
                    </Button>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Test Framework</label>
                    <Select value={testFramework} onValueChange={setTestFramework}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(testFrameworks[language as keyof typeof testFrameworks] || ['unittest']).map((framework) => (
                          <SelectItem key={framework} value={framework}>
                            {framework}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Result Panel */}
          {result && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Result</CardTitle>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={handleCopyResult}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button size="sm" onClick={handleInsertResult}>
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-4 max-h-96 overflow-auto">
                  <pre className="text-sm whitespace-pre-wrap">{result}</pre>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel - Code Editor */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <FolderOpen className="mr-2 h-5 w-5" />
                  Code Editor
                </CardTitle>
                <Button size="sm" onClick={handleCreateNewFile}>
                  <Plus className="h-4 w-4 mr-2" />
                  New File
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <CodeEditor />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default PlaygroundPage