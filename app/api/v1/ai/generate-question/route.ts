import { NextRequest, NextResponse } from "next/server";
import { geminiModel } from "@/lib/gemini";

function getQuestionPrompt(
  topic: string,
  difficulty: string,
  count: number = 1
): string {
  if (count === 1) {
    return `Generate a high-quality multiple choice question about ${topic} with ${difficulty} difficulty level.

Requirements:
- Create a clear, specific question
- Provide exactly 4 options (A, B, C, D)
- Mark the correct answer (0-3 index) - VARY the correct answer, don't always use 0
- Include a brief explanation
- Focus on practical knowledge and problem-solving
- Randomize which option is correct (A, B, C, or D)

Return ONLY a JSON object in this exact format:
{
  "question": "Your question here",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 2,
  "explanation": "Brief explanation of why this is correct"
}

IMPORTANT: The correctAnswer should be a random number between 0-3, not always 0. Mix up the correct answers across different options.`;
  } else {
    return `Generate ${count} high-quality multiple choice questions about ${topic} with ${difficulty} difficulty level.

Requirements:
- Create clear, specific questions
- Provide exactly 4 options (A, B, C, D) for each
- Mark the correct answer (0-3 index) for each - VARY the correct answers, don't always use 0
- Include brief explanations for each
- Focus on practical knowledge and problem-solving
- Ensure variety in question types and topics
- Randomize which option is correct (A, B, C, or D) for each question

Return ONLY a JSON object in this exact format:
{
  "questions": [
    {
      "question": "Your question here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 2,
      "explanation": "Brief explanation of why this is correct"
    }
  ]
}

IMPORTANT: Mix up the correctAnswer values (0, 1, 2, 3) across different questions. Don't always use 0.`;
  }
}

function getBulkPrompt(promptType: string, count: number): string {
  const prompts = {
    aptitude_placement: `Generate ${count} Aptitude and Reasoning questions for placement practice. Include:
- Quantitative Aptitude (arithmetic, algebra, geometry)
- Logical Reasoning (patterns, sequences, puzzles)
- Data Interpretation (charts, graphs, tables)
- Verbal Reasoning (analogies, coding-decoding)

Return ONLY a JSON object with this format:
{
  "questions": [
    {
      "question": "What is the value of √(144) + ∛(125)?",
      "options": ["17", "19", "21", "23"],
      "correctAnswer": 0,
      "explanation": "√144 = 12 and ∛125 = 5, so 12 + 5 = 17"
    }
  ]
}`,
    math_basics: `Generate ${count} basic mathematics questions covering:
- Arithmetic operations
- Percentages and ratios
- Simple algebra
- Basic geometry

Return ONLY a JSON object with questions array format.`,
    logical_reasoning: `Generate ${count} logical reasoning questions covering:
- Pattern recognition
- Sequence completion
- Logical deduction
- Analytical reasoning

Return ONLY a JSON object with questions array format.`,
  };

  return (
    prompts[promptType as keyof typeof prompts] || prompts.aptitude_placement
  );
}

export async function POST(request: NextRequest) {
  try {
    const {
      topic,
      difficulty = "medium",
      count = 1,
      bulkPrompt,
    } = await request.json();

    if (!topic && !bulkPrompt) {
      return NextResponse.json(
        { success: false, error: "Topic or bulk prompt is required" },
        { status: 400 }
      );
    }

    let prompt = "";

    if (bulkPrompt) {
      prompt = getBulkPrompt(bulkPrompt, count);
    } else {
      prompt = getQuestionPrompt(topic, difficulty, count);
    }

    try {
      const result = await geminiModel.generateContent(prompt);
      const response = result.response.text();

      const cleanedResponse = response
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      const generatedContent = JSON.parse(cleanedResponse);

      if (generatedContent && typeof generatedContent === "object") {
        if (count > 1 || bulkPrompt) {
          return NextResponse.json({
            success: true,
            questions: generatedContent.questions || [generatedContent],
          });
        } else {
          return NextResponse.json({
            success: true,
            question: generatedContent,
          });
        }
      }
    } catch (aiError) {
      console.log("AI generation failed:", aiError);
      return NextResponse.json(
        {
          success: false,
          error: "AI service temporarily unavailable. Please try again later.",
        },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error("Error generating AI question:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate question" },
      { status: 500 }
    );
  }
}
