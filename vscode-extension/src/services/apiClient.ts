import axios, { AxiosInstance, AxiosResponse } from 'axios';

export interface CodeGenerationRequest {
    description: string;
    language: string;
    context?: any;
    style?: string;
    max_tokens?: number;
}

export interface CodeExplanationRequest {
    code: string;
    language: string;
    context?: any;
    detail_level?: string;
}

export interface CodeRefactorRequest {
    code: string;
    language: string;
    goals: string[];
    context?: any;
    preserve_functionality?: boolean;
}

export interface TestGenerationRequest {
    code: string;
    language: string;
    test_framework?: string;
    context?: any;
    test_types?: string[];
}

export interface DebugRequest {
    code: string;
    error_message?: string;
    language: string;
    context?: any;
    expected_behavior?: string;
}

export interface ChatRequest {
    message: string;
    context?: any;
    conversation_history?: Array<{role: string, content: string}>;
    max_tokens?: number;
}

export interface OptimizationRequest {
    code: string;
    language: string;
    optimization_goals: string[];
    context?: any;
    constraints?: string[];
}

export interface DocumentationRequest {
    code: string;
    language: string;
    doc_style?: string;
    include_examples?: boolean;
    context?: any;
}

export class ApiClient {
    private client: AxiosInstance;
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
        this.client = axios.create({
            baseURL: baseUrl,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Add request interceptor for logging
        this.client.interceptors.request.use(
            (config) => {
                console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
                return config;
            },
            (error) => {
                console.error('API Request Error:', error);
                return Promise.reject(error);
            }
        );

        // Add response interceptor for error handling
        this.client.interceptors.response.use(
            (response) => {
                return response;
            },
            (error) => {
                console.error('API Response Error:', error.response?.data || error.message);
                return Promise.reject(error);
            }
        );
    }

    updateBaseUrl(newBaseUrl: string) {
        this.baseUrl = newBaseUrl;
        this.client.defaults.baseURL = newBaseUrl;
    }

    async generateCode(request: CodeGenerationRequest): Promise<string> {
        try {
            const response: AxiosResponse = await this.client.post('/api/v1/generate', request);
            return response.data.generated_code;
        } catch (error) {
            throw new Error(`Code generation failed: ${error}`);
        }
    }

    async explainCode(request: CodeExplanationRequest): Promise<string> {
        try {
            const response: AxiosResponse = await this.client.post('/api/v1/explain', request);
            return response.data.explanation;
        } catch (error) {
            throw new Error(`Code explanation failed: ${error}`);
        }
    }

    async refactorCode(request: CodeRefactorRequest): Promise<{code: string, improvements: string[]}> {
        try {
            const response: AxiosResponse = await this.client.post('/api/v1/refactor', request);
            return {
                code: response.data.refactored_code,
                improvements: response.data.improvements
            };
        } catch (error) {
            throw new Error(`Code refactoring failed: ${error}`);
        }
    }

    async generateTests(request: TestGenerationRequest): Promise<string> {
        try {
            const response: AxiosResponse = await this.client.post('/api/v1/test', request);
            return response.data.test_code;
        } catch (error) {
            throw new Error(`Test generation failed: ${error}`);
        }
    }

    async debugCode(request: DebugRequest): Promise<{suggestions: string[], fixed_code?: string}> {
        try {
            const response: AxiosResponse = await this.client.post('/api/v1/debug', request);
            return {
                suggestions: response.data.suggestions,
                fixed_code: response.data.fixed_code
            };
        } catch (error) {
            throw new Error(`Debug assistance failed: ${error}`);
        }
    }

    async chat(request: ChatRequest): Promise<string> {
        try {
            const response: AxiosResponse = await this.client.post('/api/v1/chat', request);
            return response.data.response;
        } catch (error) {
            throw new Error(`Chat failed: ${error}`);
        }
    }

    async optimizeCode(request: OptimizationRequest): Promise<{optimized_code: string, improvements: string[]}> {
        try {
            const response: AxiosResponse = await this.client.post('/api/v1/optimize', request);
            return {
                optimized_code: response.data.optimized_code,
                improvements: response.data.improvements
            };
        } catch (error) {
            throw new Error(`Code optimization failed: ${error}`);
        }
    }

    async generateDocumentation(request: DocumentationRequest): Promise<string> {
        try {
            const response: AxiosResponse = await this.client.post('/api/v1/document', request);
            return response.data.documented_code;
        } catch (error) {
            throw new Error(`Documentation generation failed: ${error}`);
        }
    }

    async indexProject(projectPath: string, projectId: string, filePatterns?: string[]): Promise<boolean> {
        try {
            const response: AxiosResponse = await this.client.post('/api/v1/index', {
                file_paths: [projectPath], // This would be expanded to actual file paths
                project_id: projectId,
                chunk_size: 1000,
                overlap: 200
            });
            return response.data.success;
        } catch (error) {
            console.error(`Project indexing failed: ${error}`);
            return false;
        }
    }

    async searchCode(query: string, projectPath?: string, topK: number = 5): Promise<any[]> {
        try {
            const response: AxiosResponse = await this.client.post('/api/v1/search', {
                query,
                project_path: projectPath,
                top_k: topK,
                threshold: 0.7
            });
            return response.data.results;
        } catch (error) {
            console.error(`Code search failed: ${error}`);
            return [];
        }
    }

    async getHealth(): Promise<boolean> {
        try {
            const response: AxiosResponse = await this.client.get('/health');
            return response.data.status === 'healthy';
        } catch (error) {
            return false;
        }
    }
}
