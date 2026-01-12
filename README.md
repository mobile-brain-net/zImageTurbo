# zimageturbo Image Generator

A Next.js application that generates AI images using the zimageturbo API (Z-Image-Turbo 6B parameter model).

## Features

- Text-to-image generation with custom prompts
- Multiple aspect ratio options (1:1, 4:3, 3:4, 16:9, 9:16)
- Real-time polling for async image generation
- Responsive design with Tailwind CSS
- Error handling for API failures and rate limits
- Character counter for prompts (max 1000 characters)

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Image API**: zimageturbo.ai API

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- zimageturbo API key

### Installation

1. Clone or navigate to this directory

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Add your zimageturbo API key to `.env`:
```
ZIMAGETURBO_API_KEY=your_api_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Usage

1. Enter a text prompt describing the image you want to generate
2. Select an aspect ratio from the dropdown
3. Click "Generate Image"
4. Wait for the image to be generated (typically 2-10 seconds)
5. View your generated image

## API Routes

- `/api/generate` - POST endpoint to start image generation
- `/api/status` - GET endpoint to check generation status

## Environment Variables

- `ZIMAGETURBO_API_KEY` - Your zimageturbo API key (required)

## Deployment

Deploy to Vercel (recommended):

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add `ZIMAGETURBO_API_KEY` environment variable in Vercel project settings
4. Deploy

## License

MIT
