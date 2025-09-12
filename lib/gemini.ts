import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIAnalysis } from "../middleware/types";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is required");
}

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const geminiModel = genai.getGenerativeModel({
  model: "gemini-2.5-flash",
});

export async function analyzeRequest(
  requestData: any,
  context: string
): Promise<AIAnalysis> {
  const prompt = `
    You are an AI middleware system analyzing a request with the following context: ${context}
    
    Request Data: ${JSON.stringify(requestData, null, 2)}
    
    Analyze this request and determine:
    1. Should this request be allowed? (authentication, authorization, rate limiting)
    2. What action should be taken? (allow, block, redirect, transform)
    3. Any response modifications needed
    4. Error handling requirements
    
    Respond in JSON format:
    {
      "shouldAllow": boolean,
      "action": "allow|block|redirect|transform|error",
      "response": any,
      "reasoning": "explanation of decision",
      "modifications": any
    }
  `;

  // Retry logic for API overload
  const maxRetries = 2;
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await geminiModel.generateContent(prompt);
      const response = result.response.text();

      // Clean the response to extract JSON from markdown formatting
      const cleanedResponse = response
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      return JSON.parse(cleanedResponse);
    } catch (error: any) {
      lastError = error;

      // Check if it's a 503 overload error
      if (
        error.message?.includes("503") ||
        error.message?.includes("overloaded")
      ) {
        console.warn(
          `Gemini API overloaded (attempt ${attempt}/${maxRetries}), retrying...`
        );

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempt) * 1000)
          );
          continue;
        }
      }

      // For other errors, break immediately
      break;
    }
  }

  console.warn(
    "Gemini API unavailable after retries, using fallback logic:",
    lastError
  );

  // Return a safe fallback response when AI is unavailable
  return {
    shouldAllow: true,
    action: "allow" as const,
    reasoning:
      "AI service temporarily unavailable, using fallback security rules",
  };
}
