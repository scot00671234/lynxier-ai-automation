import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  private client: GoogleGenAI;

  constructor() {
    this.client = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY || "" 
    });
  }

  async generateText(prompt: string, options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  } = {}): Promise<string> {
    const response = await this.client.models.generateContent({
      model: options.model || "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "";
  }

  async analyzeImage(base64Image: string, prompt: string = "Analyze this image"): Promise<string> {
    const contents = [
      {
        inlineData: {
          data: base64Image,
          mimeType: "image/jpeg",
        },
      },
      prompt,
    ];

    const response = await this.client.models.generateContent({
      model: "gemini-2.5-pro",
      contents: contents,
    });

    return response.text || "";
  }
}