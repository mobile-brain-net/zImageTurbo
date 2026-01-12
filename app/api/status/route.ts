import { NextRequest, NextResponse } from 'next/server';
import { ZImageTurboStatusResponse, StatusApiResponse } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get task_id from query parameters
    const searchParams = request.nextUrl.searchParams;
    const task_id = searchParams.get('task_id');

    if (!task_id) {
      return NextResponse.json(
        { success: false, error: 'Missing task_id parameter' } as StatusApiResponse,
        { status: 400 }
      );
    }

    // Get API key from environment
    const apiKey = process.env.ZIMAGETURBO_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Invalid API key. Please check configuration.' } as StatusApiResponse,
        { status: 500 }
      );
    }

    // Call zimageturbo status API
    const response = await fetch(
      `https://zimageturbo.ai/api/status?task_id=${task_id}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    );

    // Handle different response codes
    if (response.status === 401) {
      return NextResponse.json(
        { success: false, error: 'Invalid API key. Please check configuration.' } as StatusApiResponse,
        { status: 401 }
      );
    }

    if (response.status === 429) {
      return NextResponse.json(
        { success: false, error: 'Rate limit reached. Please wait a moment and try again.' } as StatusApiResponse,
        { status: 429 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: 'Failed to check status. Please try again.' } as StatusApiResponse,
        { status: response.status }
      );
    }

    // Parse response
    const data: ZImageTurboStatusResponse = await response.json();

    if (data.code !== 200 || !data.data) {
      return NextResponse.json(
        { success: false, error: 'Failed to check status. Please try again.' } as StatusApiResponse,
        { status: 500 }
      );
    }

    const { status, task_id: returnedTaskId, request: originalRequest, response: imageUrls, error_message } = data.data;

    // Handle IN_PROGRESS status
    if (status === 'IN_PROGRESS') {
      return NextResponse.json({
        success: true,
        status: 'IN_PROGRESS',
        task_id: returnedTaskId,
      } as StatusApiResponse);
    }

    // Handle FAILED status
    if (status === 'FAILED') {
      return NextResponse.json({
        success: true,
        status: 'FAILED',
        task_id: returnedTaskId,
        error: error_message || 'Image generation failed. Please try again.',
      } as StatusApiResponse);
    }

    // Handle SUCCESS status
    if (status === 'SUCCESS') {
      // Parse imageUrls if it's a string (API might return stringified JSON)
      let parsedImageUrls: string[] = [];
      if (typeof imageUrls === 'string') {
        try {
          parsedImageUrls = JSON.parse(imageUrls);
        } catch (e) {
          console.error('Failed to parse imageUrls:', e);
          return NextResponse.json({
            success: true,
            status: 'FAILED',
            task_id: returnedTaskId,
            error: 'Invalid image URL format received.',
          } as StatusApiResponse);
        }
      } else if (Array.isArray(imageUrls)) {
        parsedImageUrls = imageUrls;
      }

      if (!parsedImageUrls || parsedImageUrls.length === 0) {
        return NextResponse.json({
          success: true,
          status: 'FAILED',
          task_id: returnedTaskId,
          error: 'No image was generated. Please try again.',
        } as StatusApiResponse);
      }

      return NextResponse.json({
        success: true,
        status: 'SUCCESS',
        task_id: returnedTaskId,
        imageUrl: parsedImageUrls[0],
        prompt: originalRequest?.prompt,
        aspect_ratio: originalRequest?.aspect_ratio,
      } as StatusApiResponse);
    }

    // Unknown status
    return NextResponse.json(
      { success: false, error: 'Unknown status received from API' } as StatusApiResponse,
      { status: 500 }
    );

  } catch (error) {
    console.error('Error in /api/status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to connect. Please try again.' } as StatusApiResponse,
      { status: 500 }
    );
  }
}
