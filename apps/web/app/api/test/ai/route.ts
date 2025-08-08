import { NextRequest, NextResponse } from 'next/server';
import { createGeminiClient } from '@kit/ai/gemini';

export async function GET() {
  try {
    // Check if Gemini API key is available
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Gemini API key not configured. Please add GEMINI_API_KEY to your .env.local file.' 
        },
        { status: 500 }
      );
    }

    // Test Gemini client creation
    const geminiClient = createGeminiClient();
    
    // Test a simple AI generation
    const result = await geminiClient.generateContent(
      'Generate a simple test flashcard about the color blue. Respond in JSON format: {"front": "question", "back": "answer"}'
    );

    return NextResponse.json({
      success: true,
      message: 'Gemini AI integration is working!',
      testResult: {
        text: result.text,
        tokensUsed: result.tokensUsed,
        estimatedCost: result.estimatedCost,
      },
    });
  } catch (error) {
    console.error('AI test error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: 'Check that your Gemini API key is valid and has sufficient quota',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    const geminiClient = createGeminiClient();
    
    const prompt = `Create 2 flashcards from this content: "${content}". 
    Format as JSON array: [{"front": "question", "back": "answer"}]`;
    
    const result = await geminiClient.generateContent(prompt);

    return NextResponse.json({
      success: true,
      flashcards: result.text,
      metadata: {
        tokensUsed: result.tokensUsed,
        estimatedCost: result.estimatedCost,
      },
    });
  } catch (error) {
    console.error('AI flashcard generation error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}