import { NextRequest, NextResponse } from "next/server";
import { analyzeRequest, geminiModel } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();
    const context = "AI answer and explanation generation for quiz questions";

    const analysis = await analyzeRequest(requestData, context);

    if (!analysis.shouldAllow) {
      return NextResponse.json(
        {
          success: false,
          error: analysis.reasoning || "Request not allowed by AI middleware",
        },
        { status: 403 }
      );
    }

    const { question, options, mode = "both" } = requestData;

    if (!question || !options || !Array.isArray(options)) {
      return NextResponse.json(
        { success: false, error: "Question and options are required" },
        { status: 400 }
      );
    }

    let prompt = "";

    if (mode === "answer" || mode === "both") {
      prompt = `
You are an expert quiz creator. Given the following multiple choice question and options, determine which option is the correct answer${
        mode === "both" ? " and provide an explanation" : ""
      }.

Question: ${question}

Options:
${options
  .map(
    (option: string, index: number) =>
      `${String.fromCharCode(65 + index)}) ${option}`
  )
  .join("\n")}

Analyze the question carefully and determine the correct answer.${
        mode === "both"
          ? " Also provide a clear, concise explanation (2-3 sentences) of why this is the correct answer. Focus on the reasoning and educational value."
          : ""
      } 

Respond with ONLY a JSON object in this exact format:
{
  "correctAnswer": <index_number>,
  "confidence": <percentage>${
    mode === "both" ? ',\n  "explanation": "Your explanation here"' : ""
  }
}

Where correctAnswer is the index (0, 1, 2, or 3) of the correct option.
`;
    } else if (mode === "explanation") {
      const { correctAnswer } = requestData;

      if (correctAnswer === undefined) {
        return NextResponse.json(
          {
            success: false,
            error: "Correct answer is required for explanation mode",
          },
          { status: 400 }
        );
      }

      prompt = `
You are an expert educator. Given the following multiple choice question, options, and correct answer, provide a clear and educational explanation of why the correct answer is right.

Question: ${question}

Options:
${options
  .map(
    (option: string, index: number) =>
      `${String.fromCharCode(65 + index)}) ${option}`
  )
  .join("\n")}

Correct Answer: ${String.fromCharCode(65 + correctAnswer)}) ${
        options[correctAnswer]
      }

Provide a clear, concise explanation (2-3 sentences) of why this is the correct answer. Focus on the reasoning and educational value. Respond with ONLY a JSON object in this exact format:
{
  "explanation": "Your explanation here"
}
`;
    }

    try {
      const result = await geminiModel.generateContent(prompt);
      const response = result.response.text();

      const cleanedResponse = response
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      const aiResponse = JSON.parse(cleanedResponse);

      const responseData: any = { success: true };

      if (mode === "answer" || mode === "both") {
        responseData.correctAnswer = aiResponse.correctAnswer;
        responseData.confidence = aiResponse.confidence;
      }

      if (mode === "explanation" || mode === "both") {
        responseData.explanation = aiResponse.explanation;
      }

      return NextResponse.json(responseData);
    } catch (aiError: any) {
      console.error("AI generation error:", aiError);

      const responseData: any = { success: true, fallback: true };

      if (mode === "answer" || mode === "both") {
        let fallbackAnswer = 0;
        const questionLower = question.toLowerCase();

        if (questionLower.includes("not") || questionLower.includes("except")) {
          fallbackAnswer = options.length - 1;
        } else if (
          questionLower.includes("first") ||
          questionLower.includes("primary")
        ) {
          fallbackAnswer = 0;
        } else {
          fallbackAnswer = Math.floor(Math.random() * options.length);
        }

        responseData.correctAnswer = fallbackAnswer;
        responseData.confidence = 50;
      }

      if (mode === "explanation" || mode === "both") {
        const correctAnswerIndex =
          mode === "both"
            ? responseData.correctAnswer
            : requestData.correctAnswer;
        const fallbackExplanation = `The correct answer is ${String.fromCharCode(
          65 + correctAnswerIndex
        )}) ${
          options[correctAnswerIndex]
        }. This option best addresses the question based on the given context and available choices.`;

        responseData.explanation = fallbackExplanation;
      }

      return NextResponse.json(responseData);
    }
  } catch (error: any) {
    console.error("Generate answer/explanation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate answer/explanation" },
      { status: 500 }
    );
  }
}
