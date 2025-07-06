import axios, { AxiosInstance, AxiosResponse } from 'axios'

export interface CodeGenerationRequest {
  description: string
  language: string
  context?: any
  style?: string
  max_tokens?: number
}

export interface CodeExplanationRequest {
  code: string
  language: string
  context?: any
  detail_level?: string
}

export interface CodeRefactorRequest {
  code: string
  language: string
  goals: string[]
  context?: any
  preserve_functionality?: boolean
}

export interface TestGenerationRequest {
  code: string
  language: string
  test_framework?: string
  context?: any
  test_types?: string[]
}

export interface DebugRequest {
  code: string
  error_message?: string
  language: string
  context?: any
  expected_behavior?: string
}

export interface ChatRequest {
  message: string
  context?: any
  conversation_history?: Array<{role: string, content: string}>
  max_tokens?: number
}

export interface OptimizationRequest {
  code: string
  language: string
  optimization_goals: string[]
  context?: any
  constraints?: string[]
}

export interface DocumentationRequest {
  code: string
  language: string
  doc_style?: string
  include_examples?: boolean
  context?: any
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: '/api/v1',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`)
        return config
      },
      (error) => {
        console.error('API Request Error:', error)
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Response Error:', error.response?.data || error.message)
        return Promise.reject(error)
      }
    )
  }

  async generateCode(request: CodeGenerationRequest): Promise<string> {
    try {
      const response: AxiosResponse = await this.client.post('/generate', request)
      return response.data.generated_code
    } catch (error) {
      throw new Error(`Code generation failed: ${error}`)
    }
  }

  async explainCode(request: CodeExplanationRequest): Promise<string> {
    try {
      const response: AxiosResponse = await this.client.post('/explain', request)
      return response.data.explanation
    } catch (error) {
      throw new Error(`Code explanation failed: ${error}`)
    }
  }

  async refactorCode(request: CodeRefactorRequest): Promise<{code: string, improvements: string[]}> {
    try {
      const response: AxiosResponse = await this.client.post('/refactor', request)
      return {
        code: response.data.refactored_code,
        improvements: response.data.improvements
      }
    } catch (error) {
      throw new Error(`Code refactoring failed: ${error}`)
    }
  }

  async generateTests(request: TestGenerationRequest): Promise<string> {
    try {
      const response: AxiosResponse = await this.client.post('/test', request)
      return response.data.test_code
    } catch (error) {
      throw new Error(`Test generation failed: ${error}`)
    }
  }

  async debugCode(request: DebugRequest): Promise<{suggestions: string[], fixed_code?: string}> {
    try {
      const response: AxiosResponse = await this.client.post('/debug', request)
      return {
        suggestions: response.data.suggestions,
        fixed_code: response.data.fixed_code
      }
    } catch (error) {
      throw new Error(`Debug assistance failed: ${error}`)
    }
  }

  async chat(request: ChatRequest): Promise<string> {
    try {
      const response: AxiosResponse = await this.client.post('/chat', request)
      return response.data.response
    } catch (error) {
      throw new Error(`Chat failed: ${error}`)
    }
  }

  async optimizeCode(request: OptimizationRequest): Promise<{optimized_code: string, improvements: string[]}> {
    try {
      const response: AxiosResponse = await this.client.post('/optimize', request)
      return {
        optimized_code: response.data.optimized_code,
        improvements: response.data.improvements
      }
    } catch (error) {
      throw new Error(`Code optimization failed: ${error}`)
    }
  }

  async generateDocumentation(request: DocumentationRequest): Promise<string> {
    try {
      const response: AxiosResponse = await this.client.post('/document', request)
      return response.data.documented_code
    } catch (error) {
      throw new Error(`Documentation generation failed: ${error}`)
    }
  }

  async getHealth(): Promise<boolean> {
    try {
      const response: AxiosResponse = await this.client.get('/health')
      return response.data.status === 'healthy'
    } catch (error) {
      return false
    }
  }

  async getStats(): Promise<any> {
    try {
      const response: AxiosResponse = await this.client.get('/stats')
      return response.data
    } catch (error) {
      throw new Error(`Failed to get stats: ${error}`)
    }
  }
}

export const apiClient = new ApiClient()