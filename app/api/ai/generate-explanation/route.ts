import { NextRequest, NextResponse } from "next/server";
import { analyzeRequest, geminiModel } from "../../../../lib/gemini";

export async function POST(request: NextRequest) {
  try {
    // AI middleware check
    const requestData = await request.json();
    const context = "AI explanation generation for quiz questions";
    
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

    const { question, options, correctAnswer } = requestData;

    if (!question || !options || correctAnswer === undefined) {
      return NextResponse.json(
        { success: false, error: "Question, options, and correct answer are required" },
        { status: 400 }
      );
    }

    const prompt = `
You are an expert educator. Given the following multiple choice question, options, and correct answer, provide a clear and educational explanation of why the correct answer is right.

Question: ${question}

Options:
${options.map((option: string, index: number) => `${String.fromCharCode(65 + index)}) ${option}`).join('\n')}

Correct Answer: ${String.fromCharCode(65 + correctAnswer)}) ${options[correctAnswer]}

Provide a clear, concise explanation (2-3 sentences) of why this is the correct answer. Focus on the reasoning and educational value. Respond with ONLY a JSON object in this exact format:
{
  "explanation": "Your explanation here"
}
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
        explanation: aiResponse.explanation
      });

    } catch (aiError: any) {
      console.error("AI generation error:", aiError);
      
      // Fallback explanation
      const fallbackExplanation = `The correct answer is ${String.fromCharCode(65 + correctAnswer)}) ${options[correctAnswer]}. This option best addresses the question based on the given context and available choices.`;

      return NextResponse.json({
        success: true,
        explanation: fallbackExplanation,
        fallback: true
      });
    }

  } catch (error: any) {
    console.error("Generate explanation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate explanation" },
      { status: 500 }
    );
  }
}
