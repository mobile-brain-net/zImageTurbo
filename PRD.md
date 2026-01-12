# Product Requirements Document: zimageturbo Image Generator MVP

## Project Overview

Build a simple web application that allows users to generate AI images using the zimageturbo API (Z-Image-Turbo 6B parameter model). Users input a text prompt, select an aspect ratio, submit it, and view the generated image with the prompt displayed above it.

**IMPORTANT**: Initialize the Next.js project IN THE CURRENT DIRECTORY. Do not create a new subdirectory. The .env file with ZIMAGETURBO_API_KEY already exists in this directory.

## Technical Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Image API**: zimageturbo.ai API (Z-Image-Turbo model)
- **Runtime**: Node.js 18+

## Core Features

### 1. User Interface

- **Prompt Input Section**

  - Large textarea for prompt input (minimum 3 rows, expandable)
  - Placeholder text: "Describe the image you want to generate..."
  - Character counter showing remaining characters (max 1000)
  - **Aspect Ratio Selector** (required field)
    - Dropdown or radio buttons with options:
      - 1:1 (Square)
      - 4:3 (Landscape)
      - 3:4 (Portrait)
      - 16:9 (Wide)
      - 9:16 (Tall)
    - Default: 1:1
  - "Generate Image" button (primary CTA)
  - Disabled state when prompt is empty or over 1000 characters
  - Loading state while image is being generated (show polling status)

- **Image Display Section**
  - Display user's prompt as a heading above the generated image
  - Show selected aspect ratio info
  - Show generated image below the prompt
  - Responsive image sizing (max-width with aspect ratio preservation)
  - Loading progress indicator during generation (polling status)
  - Show estimated time or "Generating..." message
  - Error handling display for failed generations

### 2. API Integration

#### zimageturbo API Details (Z-Image-Turbo Model)

- **Documentation**: https://zimageturbo.ai/docs
- **Model**: Z-Image-Turbo (6B-parameter, ultra-fast text-to-image, 8-step sampler)
- **Authentication**: Bearer token in Authorization header
- **Cost**: $0.02 per successful generation
- **API is ASYNCHRONOUS** - requires polling for completion

#### API Endpoints

**1. Generate Image** (POST)

- **Endpoint**: `https://zimageturbo.ai/api/generate`
- **Headers**: `Authorization: Bearer {ZIMAGETURBO_API_KEY}`
- **Body**:
  ```json
  {
    "prompt": "string (required, max 1000 chars)",
    "aspect_ratio": "string (required: 1:1, 4:3, 3:4, 16:9, 9:16)"
  }
  ```
- **Response**:
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "task_id": "task_1234567890",
      "status": "IN_PROGRESS"
    }
  }
  ```

**2. Query Status** (GET)

- **Endpoint**: `https://zimageturbo.ai/api/status?task_id={task_id}`
- **Headers**: `Authorization: Bearer {ZIMAGETURBO_API_KEY}`
- **Response** (SUCCESS):
  ```json
  {
    "code": 200,
    "message": "success",
    "data": {
      "status": "SUCCESS",
      "task_id": "xxxxxxxx",
      "request": {
        "prompt": "A beautiful sunset over mountains",
        "aspect_ratio": "16:9"
      },
      "response": ["https://cdn.example.com/images/task_xxx_0.jpeg"],
      "consumed_credits": 15,
      "created_at": "2025-12-05 13:05:09",
      "error_message": null
    }
  }
  ```

**Status Values**:

- `IN_PROGRESS` - Still generating
- `SUCCESS` - Image ready, URL in response array
- `FAILED` - Generation failed, check error_message

#### Implementation Requirements

- Create Next.js API route `/api/generate` that:
  1. Accepts prompt and aspect_ratio from client
  2. POSTs to zimageturbo.ai/api/generate with Bearer token
  3. Returns task_id to client
- Create Next.js API route `/api/status` that:
  1. Accepts task_id from client
  2. GETs from zimageturbo.ai/api/status
  3. Returns current status and image URL when ready
- **Client-side polling logic**:
  - Poll `/api/status` every 2 seconds after getting task_id
  - Maximum 30 polling attempts (60 seconds timeout)
  - Stop polling when status is SUCCESS or FAILED
- Keep API key server-side (NEVER expose to client)
- Handle all error codes: 401 (Unauthorized), 402 (Payment Required), 429 (Rate Limited)
- Display appropriate error messages to user

### 3. State Management

- Use React useState for:
  - Prompt text
  - Selected aspect ratio (default: "1:1")
  - Task ID (from initial generate call)
  - Generated image URL
  - Loading state (boolean)
  - Polling status message ("Generating...", "Almost done...", etc.)
  - Error messages
- Use React useEffect for polling logic when task_id exists
- No external state management library needed for MVP

### 4. Error Handling

- Network errors: "Failed to connect. Please try again."
- API errors:
  - 401 Unauthorized: "Invalid API key. Please check configuration."
  - 402 Payment Required: "Insufficient credits. Please add funds to your account."
  - 429 Too Many Requests: "Rate limit reached. Please wait a moment and try again."
- Empty prompt: "Please enter a prompt to generate an image"
- Prompt too long: "Prompt must be 1000 characters or less"
- Timeout (30 polling attempts): "Generation is taking longer than expected. Please try again."
- Failed status from API: Display error_message from API response
- Display all errors in a visible, styled error message component

## File Structure

**IMPORTANT**: Create all files in the CURRENT DIRECTORY. Do NOT create a new project folder.

```
. (current directory)
├── app/
│   ├── api/
│   │   ├── generate/
│   │   │   └── route.ts          # Generate task API route
│   │   └── status/
│   │       └── route.ts          # Query status API route
│   ├── page.tsx                   # Main UI page
│   ├── layout.tsx                 # Root layout
│   └── globals.css                # Global styles
├── components/
│   ├── ImageGenerator.tsx         # Main generator component
│   └── LoadingSpinner.tsx        # Loading animation component
├── lib/
│   └── api.ts                    # API client utilities
├── types/
│   └── index.ts                  # TypeScript types
├── .env                          # ALREADY EXISTS with ZIMAGETURBO_API_KEY
├── .env.example                  # Example env file (create this)
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

## UI/UX Specifications

### Layout

- Centered container (max-width: 800px)
- Vertical layout: Header → Prompt Input → Image Display
- Consistent spacing (use Tailwind spacing scale)
- Mobile-responsive design

### Styling Guidelines

- Clean, modern aesthetic
- Primary color: Blue (#3B82F6) for CTA button
- Neutral background: White or light gray (#F9FAFB)
- Border radius: 8px for input/button elements
- Shadow: Subtle shadow on cards/containers
- Typography: System fonts (default Next.js font stack)

### Button States

- Default: Blue background, white text
- Hover: Darker blue (#2563EB)
- Loading: Disabled state with spinner
- Disabled: Gray background when prompt is empty

## Implementation Steps

### Phase 1: Project Setup

1. **CRITICAL**: Initialize Next.js IN THE CURRENT DIRECTORY using `npx create-next-app@latest . --typescript --tailwind --app`
2. The .env file ALREADY EXISTS with ZIMAGETURBO_API_KEY - do not overwrite it
3. Create .env.example file for documentation
4. Set up folder structure (app/, components/, lib/, types/)
5. Install any additional dependencies if needed

### Phase 2: API Integration

1. Create `/app/api/generate/route.ts`:
   - Accept POST with { prompt, aspect_ratio }
   - Call zimageturbo.ai/api/generate with Bearer token
   - Return { task_id, status }
2. Create `/app/api/status/route.ts`:
   - Accept GET with ?task_id=xxx
   - Call zimageturbo.ai/api/status
   - Return current status and image URL when ready
3. Implement error handling for all API error codes
4. Test with hardcoded prompts

### Phase 3: Frontend Development

1. Create main page layout (`app/page.tsx`)
2. Build ImageGenerator component with:
   - Prompt textarea with character counter (max 1000)
   - Aspect ratio selector (dropdown or radio buttons)
   - Generate button with disabled states
   - Loading state during generation
3. Implement polling logic:
   - Call /api/generate to get task_id
   - Poll /api/status every 2 seconds
   - Stop when SUCCESS or FAILED or timeout (30 attempts)
   - Display polling status messages
4. Create image display section:
   - Show prompt as heading
   - Display generated image with proper aspect ratio
   - Handle loading and error states
5. Style all components with Tailwind CSS

### Phase 4: Polish & Testing

1. Add loading spinner/animations
2. Implement responsive design
3. Test all error scenarios (401, 402, 429, timeout)
4. Test with different aspect ratios
5. Verify character limit validation
6. Test polling logic and timeout handling

## Environment Variables

**NOTE**: The .env file ALREADY EXISTS in the current directory with the following variable:

```
ZIMAGETURBO_API_KEY=your_actual_api_key_is_already_here
```

Create `.env.example` for documentation:

```
ZIMAGETURBO_API_KEY=your_api_key_here
```

## API Route Specification

### Endpoint 1: `/api/generate`

**Method**: POST

**Request Body**:

```json
{
  "prompt": "string (required, min 1 char, max 1000 chars)",
  "aspect_ratio": "string (required: 1:1, 4:3, 3:4, 16:9, 9:16)"
}
```

**Success Response** (200):

```json
{
  "success": true,
  "task_id": "task_1234567890",
  "status": "IN_PROGRESS"
}
```

**Error Response** (400/401/402/429/500):

```json
{
  "success": false,
  "error": "string (error message)"
}
```

### Endpoint 2: `/api/status`

**Method**: GET

**Query Parameters**:

- `task_id` (required): The task ID from /api/generate

**Success Response - In Progress** (200):

```json
{
  "success": true,
  "status": "IN_PROGRESS",
  "task_id": "task_1234567890"
}
```

**Success Response - Complete** (200):

```json
{
  "success": true,
  "status": "SUCCESS",
  "task_id": "task_1234567890",
  "imageUrl": "https://cdn.example.com/images/task_xxx_0.jpeg",
  "prompt": "string (original prompt)",
  "aspect_ratio": "16:9"
}
```

**Success Response - Failed** (200):

```json
{
  "success": true,
  "status": "FAILED",
  "task_id": "task_1234567890",
  "error": "string (error message from zimageturbo)"
}
```

**Error Response** (400/500):

```json
{
  "success": false,
  "error": "string (error message)"
}
```

## Acceptance Criteria

- [ ] User can input text prompt in textarea (max 1000 chars with counter)
- [ ] User can select aspect ratio from dropdown/radio buttons
- [ ] Empty prompts and invalid aspect ratios prevent submission
- [ ] Clicking "Generate Image" triggers async API call and returns task_id
- [ ] App polls for status every 2 seconds until complete or timeout
- [ ] Loading state shows polling progress ("Generating...", etc.)
- [ ] Generated image is displayed with correct aspect ratio when ready
- [ ] User's prompt and aspect ratio are displayed above image
- [ ] Errors are displayed in user-friendly format (401, 402, 429, timeout, failed)
- [ ] App is responsive on mobile and desktop
- [ ] API key is never exposed to client (stays server-side)
- [ ] Polling stops automatically when image is ready or generation fails
- [ ] Maximum 30 polling attempts (60 second timeout) prevents infinite loops
- [ ] App works in Chrome, Firefox, Safari

## Out of Scope (Future Enhancements)

- Image history/gallery
- User authentication
- Image download functionality
- Advanced settings (size, style, etc.)
- Prompt suggestions/templates
- Social sharing
- Image editing tools
- Multiple images generation

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

## Deployment

- **Platform**: Vercel (recommended for Next.js)
- **Environment**: Set `ZIMAGETURBO_API_KEY` in Vercel project settings
- **Domain**: Auto-generated .vercel.app domain (custom domain optional)
- **Note**: The local .env file is not deployed - must set env var in Vercel dashboard

## Notes for Implementation

- **CRITICAL**: Initialize Next.js in CURRENT DIRECTORY, not a subdirectory
- **CRITICAL**: Do NOT overwrite the existing .env file
- **CRITICAL**: Implement async polling logic - the API is NOT synchronous
- Prioritize simplicity - this is an MVP
- Use native Next.js features over external libraries when possible
- Focus on core functionality before adding polish
- Ensure API key security from the start (server-side only)
- Make it work first, then make it pretty
- Comment code for future maintainability
- Poll every 2 seconds - don't poll too frequently (rate limits)
- Always stop polling after 30 attempts to prevent infinite loops
- Handle all three status states: IN_PROGRESS, SUCCESS, FAILED

## Z-Image-Turbo Model Info

The Z-Image-Turbo model being used is:

- **6B-parameter** text-to-image model
- **8-step sampler** for ultra-fast generation (sub-second on GPUs)
- **Bilingual support** (English and Chinese prompts)
- **Can render text** directly in images
- **Low VRAM footprint** (runs on 16GB VRAM)
- **Photorealistic output** suitable for production use
- Cost: **$0.02 per successful generation**

## Success Metrics (Post-Launch)

- App loads and renders correctly
- Image generation completes successfully with polling
- Polling logic works correctly (stops at 30 attempts)
- All aspect ratios generate images correctly
- Error handling works as expected (401, 402, 429, timeout)
- Mobile experience is usable
- No API key leaks in client bundle

## Quick Reference: Polling Implementation Pattern

```typescript
// Frontend polling logic pattern
const handleGenerate = async () => {
  // 1. Call /api/generate
  const { task_id } = await fetch("/api/generate", {
    method: "POST",
    body: JSON.stringify({ prompt, aspect_ratio }),
  });

  // 2. Start polling
  let attempts = 0;
  const maxAttempts = 30;
  const pollInterval = 2000; // 2 seconds

  const pollStatus = async () => {
    const { status, imageUrl, error } = await fetch(
      `/api/status?task_id=${task_id}`
    );

    if (status === "SUCCESS") {
      // Display image
      setImageUrl(imageUrl);
      setLoading(false);
    } else if (status === "FAILED") {
      // Display error
      setError(error);
      setLoading(false);
    } else if (attempts >= maxAttempts) {
      // Timeout
      setError("Generation timeout");
      setLoading(false);
    } else {
      // Keep polling
      attempts++;
      setTimeout(pollStatus, pollInterval);
    }
  };

  pollStatus();
};
```
