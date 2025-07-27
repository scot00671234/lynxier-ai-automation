import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface AIProcessingResult {
  output: string;
  metadata?: Record<string, any>;
}

export async function processText(
  task: string,
  instructions: string,
  inputText: string
): Promise<AIProcessingResult> {
  try {
    let prompt = "";
    
    switch (task) {
      case "summarize":
        prompt = `Please summarize the following text concisely while maintaining key points. ${instructions ? `Additional instructions: ${instructions}` : ''}\n\nText to summarize:\n${inputText}`;
        break;
      case "rewrite":
        prompt = `Please rewrite the following text according to these instructions: ${instructions}\n\nText to rewrite:\n${inputText}`;
        break;
      case "analyze":
        prompt = `Please analyze the following text. ${instructions}\n\nText to analyze:\n${inputText}`;
        break;
      case "extract":
        prompt = `Please extract information from the following text. ${instructions}\n\nText:\n${inputText}`;
        break;
      case "generate":
        prompt = `Please generate content based on the following input and instructions: ${instructions}\n\nInput:\n${inputText}`;
        break;
      default:
        throw new Error(`Unsupported AI task: ${task}`);
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1500,
    });

    const output = response.choices[0].message.content || "";
    
    return {
      output,
      metadata: {
        model: "gpt-4o",
        task,
        usage: response.usage
      }
    };
  } catch (error) {
    throw new Error(`AI processing failed: ${error.message}`);
  }
}

export async function analyzeResume(resumeText: string): Promise<AIProcessingResult> {
  try {
    const prompt = `Please analyze this resume and provide a structured evaluation. Return your response in JSON format with the following structure:
{
  "candidateName": "string",
  "yearsOfExperience": "number",
  "skills": ["array", "of", "skills"],
  "education": "string",
  "score": "number (1-10)",
  "summary": "string",
  "strengths": ["array", "of", "strengths"],
  "recommendations": ["array", "of", "recommendations"]
}

Resume text:
${resumeText}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const output = response.choices[0].message.content || "{}";
    
    return {
      output,
      metadata: {
        model: "gpt-4o",
        task: "resume_analysis",
        usage: response.usage
      }
    };
  } catch (error) {
    throw new Error(`Resume analysis failed: ${error.message}`);
  }
}
