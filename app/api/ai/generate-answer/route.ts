import { NextRequest, NextResponse } from "next/server";
import { analyzeRequest, geminiModel } from "../../../../lib/gemini";

export async function POST(request: NextRequest) {
  try {
    // AI middleware check
    const requestData = await request.json();
    const context = "AI answer generation for quiz questions";
    
    const analysis = await analyzeRequest(requestData, context);
    
    if (!analysis.shouldAllow) {
      return NextResponse.json(
        { 
          success: false, 
          error: analysis.reasoning || "Request not allowed by AI middleware" 
        },
        { status: 403 }
      );
    }

    const { question, options } = requestData;

    if (!question || !options || !Array.isArray(options)) {
      return NextResponse.json(
        { success: false, error: "Question and options are required" },
        { status: 400 }
      );
    }

    const prompt = `
You are an expert quiz creator. Given the following multiple choice question and options, determine which option is the correct answer.

Question: ${question}

Options:
${options.map((option: string, index: number) => `${String.fromCharCode(65 + index)}) ${option}`).join('\n')}

Analyze the question carefully and determine the correct answer. Respond with ONLY a JSON object in this exact format:
{
  "correctAnswer": <index_number>,
  "confidence": <percentage>
}

Where correctAnswer is the index (0, 1, 2, or 3) of the correct option.
`;

    try {
      const result = await geminiModel.generateContent(prompt);
      const response = result.response.text();

      // Clean the response to extract JSON
      const cleanedResponse = response
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      const aiResponse = JSON.parse(cleanedResponse);

      return NextResponse.json({
        success: true,
        correctAnswer: aiResponse.correctAnswer,
        confidence: aiResponse.confidence
      });

    } catch (aiError: any) {
      console.error("AI generation error:", aiError);
      
      // Fallback: simple heuristic based on question keywords
      let fallbackAnswer = 0;
      const questionLower = question.toLowerCase();
      
      if (questionLower.includes('not') || questionLower.includes('except')) {
        fallbackAnswer = options.length - 1; // Often the last option for negative questions
      } else if (questionLower.includes('first') || questionLower.includes('primary')) {
        fallbackAnswer = 0;
      } else {
        fallbackAnswer = Math.floor(Math.random() * options.length);
      }

      return NextResponse.json({
        success: true,
        correctAnswer: fallbackAnswer,
        confidence: 50,
        fallback: true
      });
    }

  } catch (error: any) {
    console.error("Generate answer error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate answer" },
      { status: 500 }
    );
  }
}
