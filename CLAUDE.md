# Image Renderer - Cloudflare Workers

## Project Overview
HTML to image rendering service on Cloudflare Workers using Puppeteer for serverless image generation.

**Linear Project**: `image-renderer-573f8d7ac5bb`

## Core Features
- Convert HTML content to PNG/JPEG images
- Custom CSS styling support
- Responsive image dimensions
- High-quality rendering with Puppeteer
- Fast serverless execution

## Technical Stack
- **Runtime**: Cloudflare Workers
- **Rendering**: Puppeteer (headless Chrome)
- **Output**: PNG/JPEG images
- **Deployment**: Wrangler CLI

## API Endpoints

### POST /render
Generate image from HTML content.

**Request:**
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

**Response:** Image binary (PNG/JPEG)

### GET /health
Health check endpoint - returns service status.

## Development

### Setup
```bash
npm install
```

### Local Development
```bash
npm run dev          # Start dev server
wrangler dev         # Local with wrangler
```

### Deployment
```bash
npm run deploy       # Deploy to CF Workers
```

## Performance Targets
- Cold start: <500ms
- Warm execution: <300ms
- Memory limit: 128MB
- Timeout: 30s max

## Cost Estimation
- CF Workers: $0.50/million requests
- CPU time: $0.02/100K GB-seconds
- Puppeteer memory: ~50-100MB/render
- **Expected**: $0.10-0.50 per 1,000 renders

## Project Management
Track issues, features, and bugs in Linear project `image-renderer-573f8d7ac5bb`.

## Key Considerations
- Optimize HTML for rendering performance
- Monitor memory usage to stay within limits
- Handle timeouts gracefully
- Cache rendered images when possible
- Validate input HTML to prevent XSS
