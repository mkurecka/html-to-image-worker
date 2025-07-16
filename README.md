# HTML to Image Converter - Cloudflare Workers

A powerful HTML to image conversion service built on Cloudflare Workers using the Browser Rendering API. Convert HTML content to high-quality PNG, JPEG, or WebP images with a simple API call.

## 🚀 Features

- **Multiple formats**: PNG, JPEG, WebP support
- **Customizable dimensions**: Set width, height, and device scale factor
- **Custom CSS**: Add additional styling to your HTML
- **Interactive demo**: Built-in web interface for testing
- **Fast & scalable**: Powered by Cloudflare Workers edge network
- **Cost-effective**: ~$0.06-0.09 per 1,000 renders

## 🔧 Setup

### Prerequisites
- Cloudflare account
- Node.js and npm installed
- Wrangler CLI: `npm install -g wrangler`

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/html-to-image-worker.git
   cd html-to-image-worker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Get your Cloudflare API token and Account ID:
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Navigate to "My Profile" → "API Tokens"
   - Create token with "Browser Rendering - Edit" permissions
   - Copy your Account ID from the right sidebar

   Then configure using one of these methods:

   **Method 1: Wrangler secrets (recommended)**
   ```bash
   wrangler secret put CLOUDFLARE_API_TOKEN
   wrangler secret put CLOUDFLARE_ACCOUNT_ID
   ```

   **Method 2: Environment variables in wrangler.toml**
   ```toml
   [vars]
   CLOUDFLARE_API_TOKEN = "your-api-token-here"
   CLOUDFLARE_ACCOUNT_ID = "your-account-id-here"
   ```

4. **Deploy to Cloudflare Workers**
   ```bash
   npm run deploy
   ```

## 📖 Usage

### API Endpoint

**POST** `/html-to-image`

### Request Body

```json
{
  "html": "<h1>Hello World!</h1>",
  "width": 800,
  "height": 600,
  "format": "png",
  "quality": 90,
  "deviceScaleFactor": 1,
  "css": "body { background: #f0f0f0; }",
  "delay": 0
}
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `html` | string | **required** | HTML content to render |
| `width` | number | 1200 | Viewport width in pixels |
| `height` | number | 800 | Viewport height in pixels |
| `format` | string | "png" | Output format: "png", "jpeg", "webp" |
| `quality` | number | 90 | JPEG quality (1-100) |
| `deviceScaleFactor` | number | 1 | Device pixel ratio (1x, 2x, 3x) |
| `css` | string | "" | Additional CSS styles |
| `delay` | number | 0 | Delay in milliseconds before screenshot |

### Examples

**Basic usage:**
```bash
curl -X POST https://your-worker.workers.dev/html-to-image \
  -H "Content-Type: application/json" \
  -d '{"html": "<h1>Hello World!</h1>", "width": 800, "height": 400}' \
  --output result.png
```

**With custom CSS:**
```bash
curl -X POST https://your-worker.workers.dev/html-to-image \
  -H "Content-Type: application/json" \
  -d '{
    "html": "<h1>Styled Content</h1>",
    "css": "h1 { color: blue; text-align: center; }",
    "width": 600,
    "height": 300,
    "format": "jpeg",
    "quality": 85
  }' \
  --output styled.jpeg
```

**Using JSON file:**
```bash
echo '{
  "html": "<div style=\"padding: 20px; background: linear-gradient(45deg, #ff6b6b, #4ecdc4); color: white; border-radius: 10px;\"><h1>Beautiful Card</h1><p>Generated with Cloudflare Workers</p></div>",
  "width": 500,
  "height": 300
}' > request.json

curl -X POST https://your-worker.workers.dev/html-to-image \
  -H "Content-Type: application/json" \
  -d @request.json \
  --output card.png
```

## 🎨 Demo Interface

Visit your deployed worker URL to access the interactive demo:
```
https://your-worker.workers.dev/
```

The demo includes:
- Live HTML editor
- CSS customization
- Format and quality options
- Pre-built examples (business cards, charts, invoices)
- Instant preview and download

## 💰 Cost Analysis

### Cloudflare Workers Pricing
- **Requests**: $0.50 per million requests (first 100K free daily)
- **CPU Time**: $0.02 per 100,000 GB-seconds
- **Browser Rendering**: $0.05 per 1,000 requests

### Estimated Costs
- **Per 1,000 renders**: ~$0.06-0.09
- **10K renders/month**: ~$0.60-0.90
- **100K renders/month**: ~$6-9
- **1M renders/month**: ~$60-90

*Note: First 100K requests daily are free*

## 🔒 Security

- API tokens are not stored in the repository
- Use environment variables or Wrangler secrets
- CORS enabled for browser requests
- Input validation and error handling

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