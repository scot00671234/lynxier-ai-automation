import { OpenAIService } from '../openai';
import { AnthropicService } from './anthropic';
import { GeminiService } from './gemini';

export interface AIProvider {
  generateText(prompt: string, options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  }): Promise<string>;
  
  analyzeImage?(base64Image: string, prompt?: string): Promise<string>;
}

export type ProviderType = 'openai' | 'anthropic' | 'gemini';

export class AIProviderManager {
  private providers: Map<ProviderType, AIProvider> = new Map();

  constructor() {
    // Initialize providers only if API keys are available
    if (process.env.OPENAI_API_KEY) {
      this.providers.set('openai', new OpenAIService());
    }
    if (process.env.ANTHROPIC_API_KEY) {
      this.providers.set('anthropic', new AnthropicService());
    }
    if (process.env.GEMINI_API_KEY) {
      this.providers.set('gemini', new GeminiService());
    }
  }

  getProvider(type: ProviderType): AIProvider {
    const provider = this.providers.get(type);
    if (!provider) {
      throw new Error(`AI provider '${type}' is not available. Please ensure the API key is configured.`);
    }
    return provider;
  }

  getAvailableProviders(): ProviderType[] {
    return Array.from(this.providers.keys());
  }

  async generateText(
    provider: ProviderType,
    prompt: string,
    options?: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
    }
  ): Promise<string> {
    const aiProvider = this.getProvider(provider);
    return aiProvider.generateText(prompt, options);
  }

  async analyzeImage(
    provider: ProviderType,
    base64Image: string,
    prompt?: string
  ): Promise<string> {
    const aiProvider = this.getProvider(provider);
    if (!aiProvider.analyzeImage) {
      throw new Error(`Provider '${provider}' does not support image analysis`);
    }
    return aiProvider.analyzeImage(base64Image, prompt);
  }
}

export const aiProviderManager = new AIProviderManager();