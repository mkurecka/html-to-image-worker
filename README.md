# HTML to Image API - Cloudflare Workers

A powerful HTML to image conversion service built on Cloudflare Workers using Puppeteer. Convert HTML templates to high-quality PNG/JPEG images with variable replacement and R2 storage.

## 🚀 Features

- **Template Variables**: Use `{{VARIABLE}}` syntax for dynamic content
- **Real Puppeteer**: Actual browser rendering with @cloudflare/puppeteer
- **R2 Storage**: Images stored in Cloudflare R2 with public URLs
- **Multiple formats**: PNG, JPEG support with quality control
- **Variable Processing**: Extract, validate, and replace template variables
- **Production Ready**: Error handling, validation, security headers
- **Fast & scalable**: Powered by Cloudflare Workers edge network

## 🔧 Setup

### Prerequisites
- Cloudflare account with R2 and Browser bindings enabled
- Node.js and npm installed
- Wrangler CLI: `npm install -g wrangler`

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/mkurecka/html-to-image-worker.git
   cd html-to-image-worker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create R2 bucket**
   ```bash
   npx wrangler r2 bucket create html-images
   ```

4. **Deploy to Cloudflare Workers**
   ```bash
   npm run deploy
   ```

The worker will automatically set up browser and R2 bindings as configured in `wrangler.toml`.

## 📖 Usage

### API Endpoints

**Live API**: `https://html-to-image-worker.kureckamichal.workers.dev`

- **GET** `/` - Complete API documentation with examples
- **POST** `/template/render` - Generate images from templates with variables
- **POST** `/template/preview` - Preview processed HTML without generating image
- **POST** `/template/variables` - Extract all variables from template
- **POST** `/render` - Generate image from plain HTML
- **GET** `/health` - Service health check

### Template Rendering (Recommended)

**POST** `/template/render`

```json
{
  "template": "<div style='background: #FF6B6B; color: white; padding: 30px; text-align: center;'><h1>{{title}}</h1><p>{{message}}</p></div>",
  "variables": {
    "title": "Hello World!",
    "message": "Generated with API"
  },
  "width": 400,
  "height": 250,
  "format": "png",
  "quality": 90,
  "returnUrl": true
}
```

### Simple HTML Rendering

**POST** `/render`

```json
{
  "html": "<div style='padding: 40px; background: #007bff; color: white; text-align: center;'><h1>Simple HTML</h1><p>No variables needed</p></div>",
  "width": 400,
  "height": 200,
  "format": "png",
  "returnUrl": true
}
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `template` | string | **required** | HTML template with `{{VARIABLE}}` placeholders |
| `variables` | object | {} | Key-value pairs for variable replacement |
| `html` | string | **required** | Static HTML content (for `/render` endpoint) |
| `width` | number | 1200 | Viewport width in pixels |
| `height` | number | 800 | Viewport height in pixels |
| `format` | string | "png" | Output format: "png", "jpeg" |
| `quality` | number | 90 | JPEG quality (1-100) |
| `deviceScaleFactor` | number | 1 | Device pixel ratio (1x, 2x, 3x) |
| `returnUrl` | boolean | true | Return R2 URL instead of binary data |
| `sanitize` | boolean | true | Sanitize variables to prevent XSS |

### Recommended Social Media Dimensions

#### Instagram
- **Story**: 1080 x 1920 pixels (9:16 ratio)
- **Post Square**: 1080 x 1080 pixels (1:1 ratio)
- **Post Portrait**: 1080 x 1350 pixels (4:5 ratio)
- **Profile Picture**: 320 x 320 pixels

#### Facebook
- **Post Image**: 1200 x 628 pixels
- **Profile Picture**: 196 x 196 pixels
- **Cover Photo**: 1584 x 396 pixels
- **Story**: 1080 x 1920 pixels (9:16 ratio)

#### X (Twitter)
- **Post Image Landscape**: 1200 x 628 pixels
- **Post Image Square**: 1200 x 1200 pixels
- **Profile Picture**: 400 x 400 pixels
- **Header**: 1500 x 500 pixels

#### LinkedIn
- **Post Image**: 1200 x 627 pixels
- **Profile Picture**: 400 x 400 pixels
- **Cover Photo**: 1584 x 396 pixels
- **Company Logo**: 300 x 300 pixels

#### YouTube
- **Thumbnail**: 1280 x 720 pixels (16:9 ratio)
- **Channel Art**: 2560 x 1440 pixels
- **Shorts**: 1080 x 1920 pixels (9:16 ratio)

#### TikTok
- **Video**: 1080 x 1920 pixels (9:16 ratio)
- **Profile Picture**: 200 x 200 pixels

#### Pinterest
- **Pin**: 1000 x 1500 pixels (2:3 ratio)
- **Square Pin**: 1000 x 1000 pixels
- **Profile Picture**: 165 x 165 pixels

### Response Format

```json
{
  "success": true,
  "data": {
    "url": "https://pub-0f88a89fca694876be6529864f42efa7.r2.dev/template-xxx.png",
    "filename": "template-xxx.png",
    "size": 24080,
    "format": "png",
    "dimensions": { "width": 400, "height": 250 },
    "template": {
      "variables": ["title", "message"],
      "processed": { "title": "Hello World!", "message": "Generated with API" },
      "validation": { "isValid": true, "missing": [] }
    }
  }
}
```

### Examples

**Template with variables:**
```bash
curl -X POST https://html-to-image-worker.kureckamichal.workers.dev/template/render \
  -H "Content-Type: application/json" \
  -d '{
    "template": "<div style=\"background: #FF6B6B; color: white; padding: 30px; text-align: center;\"><h1>{{title}}</h1><p>{{message}}</p></div>",
    "variables": {"title": "Hello World!", "message": "Generated with API"},
    "width": 400,
    "height": 250,
    "format": "png"
  }'
```

**Simple HTML rendering:**
```bash
curl -X POST https://html-to-image-worker.kureckamichal.workers.dev/render \
  -H "Content-Type: application/json" \
  -d '{
    "html": "<div style=\"padding: 40px; background: #007bff; color: white; text-align: center;\"><h1>Simple HTML</h1><p>No variables needed</p></div>",
    "width": 400,
    "height": 200,
    "format": "png"
  }'
```

**Extract template variables:**
```bash
curl -X POST https://html-to-image-worker.kureckamichal.workers.dev/template/variables \
  -H "Content-Type: application/json" \
  -d '{"template": "<div>Invoice #{{invoiceNumber}} for {{companyName}} - Amount: ${{amount}}</div>"}'
```

## 🎨 API Documentation

Visit the live API for complete documentation with examples:
```
https://html-to-image-worker.kureckamichal.workers.dev/
```

The API documentation includes:
- Complete endpoint documentation
- Copy-paste ready curl examples
- Template variable syntax
- Response format details
- Real-world use cases (invoices, certificates, business cards)

## 💰 Cost Analysis

### Cloudflare Workers Pricing
- **Requests**: $0.50 per million requests (first 100K free daily)
- **CPU Time**: $0.02 per 100,000 GB-seconds
- **Browser Rendering**: Browser usage included in worker
- **R2 Storage**: $0.015 per GB stored, $0.36 per million Class A operations

### Estimated Costs (per 1,000 renders)
- **Worker execution**: ~$0.02-0.05
- **R2 storage**: ~$0.01-0.02
- **Total**: ~$0.03-0.07 per 1,000 renders

*Note: First 100K requests daily are free, R2 has 10GB free storage*

## 🔒 Security

- **XSS Protection**: Template variables are sanitized by default
- **CORS enabled**: For browser requests with security headers
- **Input validation**: All inputs validated and error handling
- **R2 Security**: Images stored with public URLs (no authentication needed)
- **Template Variables**: Automatic HTML escaping prevents XSS

## 🛠️ Development

### Local Development
```bash
# Start development server
npm run dev

# The server will run at http://localhost:8787
```

### Project Structure
```
├── src/
│   └── index.js          # Main worker code
├── wrangler.toml         # Cloudflare Workers configuration
├── package.json          # Dependencies and scripts
├── CLAUDE.md            # Project documentation
└── README.md            # This file
```

### Scripts
- `npm run dev` - Start local development server
- `npm run deploy` - Deploy to Cloudflare Workers
- `npm run deploy:production` - Deploy to production environment

## 📚 API Reference

### Health Check
```bash
GET /health
```
Returns: `OK` (200 status)

### Screenshot Generation
```bash
POST /html-to-image
```
Returns: Binary image data with appropriate Content-Type header

### Demo Interface
```bash
GET /
```
Returns: Interactive HTML demo page

## 🐛 Troubleshooting

### Common Issues

1. **"Invalid API token"**
   - Verify your API token has "Browser Rendering - Edit" permissions
   - Check that the token is correctly set in environment variables

2. **"Account ID not found"**
   - Ensure you're using the correct Account ID from Cloudflare dashboard
   - Account ID should be a 32-character hex string

3. **"Unrecognized keys" error**
   - The Browser Rendering API has specific parameter requirements
   - Ensure you're using supported parameters only

4. **JSON parsing errors**
   - Use proper JSON escaping in curl commands
   - Consider using JSON files with `@filename` syntax

### Debug Mode
Enable debug logging by setting:
```bash
wrangler secret put DEBUG_MODE
# Enter: true
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Links

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Browser Rendering API](https://developers.cloudflare.com/browser-rendering/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

---

Built with ❤️ using Cloudflare Workers and Browser Rendering API