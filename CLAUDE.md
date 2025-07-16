# Image Renderer - Cloudflare Workers

## Project Overview
HTML to image rendering service built on Cloudflare Workers using Puppeteer for serverless image generation.

## Core Features
- Convert HTML content to PNG/JPEG images
- Support for custom CSS styling
- Responsive image dimensions
- High-quality rendering with Puppeteer
- Fast serverless execution on CF Workers

## Technical Stack
- **Runtime**: Cloudflare Workers
- **Rendering**: Puppeteer (headless Chrome)
- **Output**: PNG/JPEG images
- **Deployment**: Wrangler CLI

## API Endpoints
- `POST /render` - Generate image from HTML
- `GET /health` - Health check endpoint

## Request Format
```json
{
  "html": "<html>...</html>",
  "options": {
    "width": 1200,
    "height": 800,
    "format": "png",
    "quality": 90
  }
}
```

## Development Commands
- `npm install` - Install dependencies
- `npm run dev` - Start development server
- `npm run deploy` - Deploy to Cloudflare Workers
- `wrangler dev` - Local development with wrangler

## Cost Considerations
- CF Workers: $0.50 per million requests
- CPU time: $0.02 per 100,000 GB-seconds
- Puppeteer memory usage: ~50-100MB per render
- Expected cost: $0.10-0.50 per 1000 renders

## Performance
- Cold start: ~200-500ms
- Warm execution: ~100-300ms
- Memory limit: 128MB (Workers default)
- Timeout: 30 seconds max