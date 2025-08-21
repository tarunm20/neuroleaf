import { NextRequest, NextResponse } from 'next/server';
import { GeminiClient } from '@kit/ai';

export async function POST(request: NextRequest) {
  try {
    const { imageData, fileName } = await request.json();
    
    if (!imageData) {
      return NextResponse.json(
        { success: false, error: 'No image data provided' },
        { status: 400 }
      );
    }
    
    // Initialize Gemini client with the latest model that supports vision
    const client = new GeminiClient({
      apiKey: process.env.GEMINI_API_KEY || '',
      model: 'gemini-1.5-flash', // Updated to current model with vision support
      maxTokens: 2048,
      temperature: 0.1, // Low temperature for accurate OCR
    });
    
    // Extract text from image using Gemini Vision API
    const prompt = `Extract all text from this image. Return only the text content, preserving formatting and line breaks where appropriate. If there's no readable text, return "No text found in image."`;
    
    const result = await client.generateContentWithImage({
      prompt,
      imageData,
      maxTokens: 2048
    });
    
    return NextResponse.json({
      success: true,
      text: result.content,
      tokensUsed: result.tokensUsed,
      fileName
    });
    
  } catch (error) {
    console.error('Vision OCR error:', error);
    
    // Provide user-friendly error messages
    let errorMessage = 'Failed to process image';
    if (error instanceof Error) {
      if (error.message.includes('quota') || error.message.includes('limit')) {
        errorMessage = 'OCR service temporarily unavailable. Please try again later.';
      } else if (error.message.includes('invalid') || error.message.includes('format')) {
        errorMessage = 'Invalid image format. Please try a different image.';
      } else {
        errorMessage = 'Failed to extract text from image';
      }
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage
      },
      { status: 500 }
    );
  }
}