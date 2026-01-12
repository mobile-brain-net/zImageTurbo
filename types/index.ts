// Aspect ratio options
export type AspectRatio = '1:1' | '4:3' | '3:4' | '16:9' | '9:16';

// Status values from zimageturbo API
export type TaskStatus = 'IN_PROGRESS' | 'SUCCESS' | 'FAILED';

// zimageturbo API response for generate endpoint
export interface ZImageTurboGenerateResponse {
  code: number;
  message: string;
  data: {
    task_id: string;
    status: TaskStatus;
  };
}

// zimageturbo API response for status endpoint
export interface ZImageTurboStatusResponse {
  code: number;
  message: string;
  data: {
    status: TaskStatus;
    task_id: string;
    request?: {
      prompt: string;
      aspect_ratio: AspectRatio;
    };
    response?: string[] | string; // Can be array or stringified JSON
    consumed_credits?: number;
    created_at?: string;
    error_message?: string | null;
  };
}

// Internal API response for /api/generate
export interface GenerateApiResponse {
  success: boolean;
  task_id?: string;
  status?: TaskStatus;
  error?: string;
}

// Internal API response for /api/status
export interface StatusApiResponse {
  success: boolean;
  status?: TaskStatus;
  task_id?: string;
  imageUrl?: string;
  prompt?: string;
  aspect_ratio?: AspectRatio;
  error?: string;
}

// Request body for generate API
export interface GenerateRequest {
  prompt: string;
  aspect_ratio: AspectRatio;
}
