import { NextRequest, NextResponse } from 'next/server';
import { GenerateRequest, ZImageTurboGenerateResponse, GenerateApiResponse } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: GenerateRequest = await request.json();
    const { prompt, aspect_ratio } = body;

    // Validate input
    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Please enter a prompt to generate an image' } as GenerateApiResponse,
        { status: 400 }
      );
    }

    if (prompt.length > 1000) {
      return NextResponse.json(
        { success: false, error: 'Prompt must be 1000 characters or less' } as GenerateApiResponse,
        { status: 400 }
      );
    }

    const validAspectRatios = ['1:1', '4:3', '3:4', '16:9', '9:16'];
    if (!aspect_ratio || !validAspectRatios.includes(aspect_ratio)) {
      return NextResponse.json(
        { success: false, error: 'Invalid aspect ratio' } as GenerateApiResponse,
        { status: 400 }
      );
    }

    // Get API key from environment
    const apiKey = process.env.ZIMAGETURBO_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Invalid API key. Please check configuration.' } as GenerateApiResponse,
        { status: 500 }
      );
    }

    // Call zimageturbo API
    const response = await fetch('https://zimageturbo.ai/api/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        aspect_ratio,
      }),
    });

    // Handle different response codes
    if (response.status === 401) {
      return NextResponse.json(
        { success: false, error: 'Invalid API key. Please check configuration.' } as GenerateApiResponse,
        { status: 401 }
      );
    }

    if (response.status === 402) {
      return NextResponse.json(
        { success: false, error: 'Insufficient credits. Please add funds to your account.' } as GenerateApiResponse,
        { status: 402 }
      );
    }

    if (response.status === 429) {
      return NextResponse.json(
        { success: false, error: 'Rate limit reached. Please wait a moment and try again.' } as GenerateApiResponse,
        { status: 429 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate image. Please try again.' } as GenerateApiResponse,
        { status: response.status }
      );
    }

    // Parse response
    const data: ZImageTurboGenerateResponse = await response.json();

    if (data.code !== 200 || !data.data?.task_id) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate image. Please try again.' } as GenerateApiResponse,
        { status: 500 }
      );
    }

    // Return success with task_id
    return NextResponse.json({
      success: true,
      task_id: data.data.task_id,
      status: data.data.status,
    } as GenerateApiResponse);

  } catch (error) {
    console.error('Error in /api/generate:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to connect. Please try again.' } as GenerateApiResponse,
      { status: 500 }
    );
  }
}
