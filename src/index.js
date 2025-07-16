// src/index.js

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      
      // Handle CORS for browser requests
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        });
      }

      // Main route for HTML to image conversion
      if (url.pathname === '/html-to-image' && request.method === 'POST') {
        return await handleHtmlToImage(request, env);
      }

      // Health check route
      if (url.pathname === '/health') {
        return new Response('OK', { status: 200 });
      }

      // Demo route with HTML form
      if (url.pathname === '/' || url.pathname === '/demo') {
        return new Response(getDemoHTML(), {
          headers: { 'Content-Type': 'text/html' },
        });
      }

      return new Response('Not Found', { status: 404 });
    } catch (error) {
      console.error('Error:', error);
      return new Response(`Error: ${error.message}`, { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};

async function handleHtmlToImage(request, env) {
  try {
    const body = await request.json();
    const { 
      html, 
      width = 1200, 
      height = 800, 
      format = 'png',
      quality = 90,
      fullPage = false,
      deviceScaleFactor = 1,
      css = '',
      waitForSelector = null,
      delay = 0
    } = body;

    if (!html) {
      return new Response('HTML content is required', { 
        status: 400,
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Create complete HTML document with CSS
    const completeHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              margin: 0; 
              padding: 20px; 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: white;
            }
            ${css}
          </style>
        </head>
        <body>
          ${html}
        </body>
      </html>
    `;

    // Use Cloudflare Browser Rendering REST API
    const requestBody = {
      html: completeHtml,
      viewport: {
        width: parseInt(width),
        height: parseInt(height),
        deviceScaleFactor: parseFloat(deviceScaleFactor)
      }
    };

    // Add optional parameters only if they have values
    if (waitForSelector) {
      requestBody.waitForSelector = waitForSelector;
    }
    if (delay > 0) {
      requestBody.delay = parseInt(delay);
    }

    const browserResponse = await fetch('https://api.cloudflare.com/client/v4/accounts/' + env.CLOUDFLARE_ACCOUNT_ID + '/browser-rendering/screenshot', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + env.CLOUDFLARE_API_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!browserResponse.ok) {
      const errorText = await browserResponse.text();
      console.error('Browser API Error:', errorText);
      return new Response(`Browser API Error: ${errorText}`, { 
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    }

    const screenshot = await browserResponse.arrayBuffer();

    return new Response(screenshot, {
      headers: {
        'Content-Type': `image/${format}`,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
        'Content-Disposition': `inline; filename="rendered.${format}"`,
      },
    });

  } catch (error) {
    console.error('Error in handleHtmlToImage:', error);
    return new Response(`Error: ${error.message}`, { 
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  }
}

function getDemoHTML() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTML to Image Converter</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 30px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
            color: #555;
        }
        textarea, input, select {
            width: 100%;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 14px;
            box-sizing: border-box;
        }
        textarea {
            height: 200px;
            font-family: 'Courier New', monospace;
        }
        .options {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        button {
            background: #0066cc;
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
        }
        button:hover {
            background: #0056b3;
        }
        button:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
        .result {
            margin-top: 30px;
            text-align: center;
        }
        .result img {
            max-width: 100%;
            border: 2px solid #ddd;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        .loading {
            display: none;
            text-align: center;
            color: #666;
        }
        .examples {
            margin: 30px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        .example-btn {
            background: #28a745;
            margin: 5px;
            padding: 8px 16px;
            font-size: 14px;
        }
        .example-btn:hover {
            background: #218838;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎨 HTML to Image Converter</h1>
        <p style="text-align: center; color: #666; margin-bottom: 30px;">
            Convert your HTML code into beautiful images using Cloudflare Workers + Puppeteer
        </p>

        <div class="examples">
            <h3>Quick Examples:</h3>
            <button class="example-btn" onclick="loadExample('card')">Business Card</button>
            <button class="example-btn" onclick="loadExample('chart')">Chart</button>
            <button class="example-btn" onclick="loadExample('social')">Social Media Post</button>
            <button class="example-btn" onclick="loadExample('invoice')">Invoice</button>
        </div>

        <form id="htmlForm">
            <div class="form-group">
                <label for="html">HTML Content:</label>
                <textarea id="html" name="html" placeholder="Enter your HTML code here..." required>
<div style="text-align: center; padding: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px;">
    <h1 style="margin: 0 0 20px 0; font-size: 2.5em;">Hello World!</h1>
    <p style="font-size: 1.2em; margin: 0;">Generated with Cloudflare Workers</p>
    <div style="margin-top: 30px; padding: 20px; background: rgba(255,255,255,0.1); border-radius: 8px;">
        <p style="margin: 0;">✨ Powered by Puppeteer</p>
    </div>
</div>
                </textarea>
            </div>

            <div class="form-group">
                <label for="css">Additional CSS (optional):</label>
                <textarea id="css" name="css" style="height: 100px;" placeholder="Add custom CSS here..."></textarea>
            </div>

            <div class="options">
                <div class="form-group">
                    <label for="width">Width (px):</label>
                    <input type="number" id="width" name="width" value="1200" min="100" max="4000">
                </div>
                <div class="form-group">
                    <label for="height">Height (px):</label>
                    <input type="number" id="height" name="height" value="800" min="100" max="4000">
                </div>
                <div class="form-group">
                    <label for="format">Format:</label>
                    <select id="format" name="format">
                        <option value="png">PNG</option>
                        <option value="jpeg">JPEG</option>
                        <option value="webp">WebP</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="quality">Quality (for JPEG):</label>
                    <input type="number" id="quality" name="quality" value="90" min="1" max="100">
                </div>
                <div class="form-group">
                    <label for="deviceScaleFactor">Scale Factor:</label>
                    <select id="deviceScaleFactor" name="deviceScaleFactor">
                        <option value="1">1x</option>
                        <option value="2">2x (Retina)</option>
                        <option value="3">3x</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="delay">Delay (ms):</label>
                    <input type="number" id="delay" name="delay" value="0" min="0" max="10000">
                </div>
            </div>

            <div class="form-group">
                <label>
                    <input type="checkbox" id="fullPage" name="fullPage"> 
                    Capture full page height
                </label>
            </div>

            <button type="submit">🚀 Generate Image</button>
        </form>

        <div class="loading" id="loading">
            <p>🎨 Generating your image...</p>
        </div>

        <div class="result" id="result"></div>
    </div>

    <script>
        const examples = {
            card: {
                html: \`<div style="width: 400px; height: 250px; background: linear-gradient(45deg, #1e3c72, #2a5298); padding: 30px; box-sizing: border-box; color: white; border-radius: 15px; position: relative; overflow: hidden;">
    <div style="position: absolute; top: -50px; right: -50px; width: 200px; height: 200px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
    <h2 style="margin: 0 0 10px 0; font-size: 24px;">John Doe</h2>
    <p style="margin: 0 0 20px 0; color: #a8c8ec;">Senior Developer</p>
    <p style="margin: 0; font-size: 14px; line-height: 1.4;">📧 john@example.com<br>📱 +1 (555) 123-4567<br>🌐 johndoe.dev</p>
</div>\`,
                css: '',
                width: 500,
                height: 300
            },
            chart: {
                html: \`<div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.1);">
    <h2 style="margin: 0 0 30px 0; color: #333; text-align: center;">Monthly Sales Report</h2>
    <div style="display: flex; align-items: end; justify-content: space-between; height: 200px; margin-bottom: 20px;">
        <div style="display: flex; flex-direction: column; align-items: center;">
            <div style="width: 60px; height: 120px; background: #3b82f6; margin-bottom: 10px; border-radius: 4px 4px 0 0;"></div>
            <span style="font-size: 14px; color: #666;">Jan</span>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center;">
            <div style="width: 60px; height: 160px; background: #10b981; margin-bottom: 10px; border-radius: 4px 4px 0 0;"></div>
            <span style="font-size: 14px; color: #666;">Feb</span>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center;">
            <div style="width: 60px; height: 180px; background: #f59e0b; margin-bottom: 10px; border-radius: 4px 4px 0 0;"></div>
            <span style="font-size: 14px; color: #666;">Mar</span>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center;">
            <div style="width: 60px; height: 140px; background: #ef4444; margin-bottom: 10px; border-radius: 4px 4px 0 0;"></div>
            <span style="font-size: 14px; color: #666;">Apr</span>
        </div>
    </div>
    <p style="text-align: center; color: #666; margin: 0;">Total Revenue: $125,000</p>
</div>\`,
                css: '',
                width: 600,
                height: 400
            },
            social: {
                html: \`<div style="width: 500px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 60px; text-align: center; color: white; border-radius: 20px;">
    <div style="width: 80px; height: 80px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 30px; display: flex; align-items: center; justify-content: center; font-size: 40px;">
        🚀
    </div>
    <h1 style="margin: 0 0 20px 0; font-size: 36px; font-weight: bold;">Launch Day!</h1>
    <p style="margin: 0 0 30px 0; font-size: 18px; opacity: 0.9; line-height: 1.5;">We're excited to announce our new product is now live. Join thousands of happy customers!</p>
    <div style="background: rgba(255,255,255,0.2); padding: 20px; border-radius: 12px; margin-top: 30px;">
        <p style="margin: 0; font-size: 16px; font-weight: 600;">🎉 Special Launch Offer: 50% OFF</p>
    </div>
</div>\`,
                css: '',
                width: 620,
                height: 620
            },
            invoice: {
                html: \`<div style="background: white; padding: 40px; max-width: 600px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <div style="border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px;">
        <h1 style="margin: 0; color: #2563eb; font-size: 32px;">INVOICE</h1>
        <p style="margin: 5px 0 0 0; color: #666;">Invoice #INV-2024-001</p>
    </div>
    
    <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
        <div>
            <h3 style="margin: 0 0 10px 0; color: #333;">Bill To:</h3>
            <p style="margin: 0; line-height: 1.5; color: #666;">
                Acme Corporation<br>
                123 Business St.<br>
                New York, NY 10001
            </p>
        </div>
        <div style="text-align: right;">
            <p style="margin: 0; color: #666;"><strong>Date:</strong> March 15, 2024</p>
            <p style="margin: 5px 0; color: #666;"><strong>Due:</strong> April 15, 2024</p>
        </div>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
            <tr style="background: #f8fafc;">
                <th style="padding: 15px; text-align: left; border-bottom: 2px solid #e5e7eb;">Description</th>
                <th style="padding: 15px; text-align: right; border-bottom: 2px solid #e5e7eb;">Amount</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td style="padding: 15px; border-bottom: 1px solid #e5e7eb;">Web Development Services</td>
                <td style="padding: 15px; text-align: right; border-bottom: 1px solid #e5e7eb;">$2,500.00</td>
            </tr>
            <tr>
                <td style="padding: 15px; border-bottom: 1px solid #e5e7eb;">Design Consultation</td>
                <td style="padding: 15px; text-align: right; border-bottom: 1px solid #e5e7eb;">$750.00</td>
            </tr>
        </tbody>
    </table>

    <div style="text-align: right; margin-top: 20px;">
        <p style="margin: 5px 0; font-size: 18px; color: #333;"><strong>Total: $3,250.00</strong></p>
    </div>
</div>\`,
                css: '',
                width: 700,
                height: 600
            }
        };

        function loadExample(type) {
            const example = examples[type];
            document.getElementById('html').value = example.html;
            document.getElementById('css').value = example.css;
            document.getElementById('width').value = example.width;
            document.getElementById('height').value = example.height;
        }

        document.getElementById('htmlForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const data = {
                html: formData.get('html'),
                css: formData.get('css'),
                width: parseInt(formData.get('width')),
                height: parseInt(formData.get('height')),
                format: formData.get('format'),
                quality: parseInt(formData.get('quality')),
                deviceScaleFactor: parseFloat(formData.get('deviceScaleFactor')),
                delay: parseInt(formData.get('delay')),
                fullPage: formData.has('fullPage')
            };

            const button = e.target.querySelector('button');
            const loading = document.getElementById('loading');
            const result = document.getElementById('result');

            button.disabled = true;
            button.textContent = 'Generating...';
            loading.style.display = 'block';
            result.innerHTML = '';

            try {
                const response = await fetch('/html-to-image', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });

                if (!response.ok) {
                    throw new Error(\`Error: \${response.status} \${response.statusText}\`);
                }

                const blob = await response.blob();
                const imageUrl = URL.createObjectURL(blob);
                
                result.innerHTML = \`
                    <h3>Generated Image:</h3>
                    <img src="\${imageUrl}" alt="Generated Image" style="max-width: 100%;">
                    <br><br>
                    <a href="\${imageUrl}" download="rendered.\${data.format}" style="display: inline-block; background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 10px;">
                        📥 Download Image
                    </a>
                \`;
            } catch (error) {
                result.innerHTML = \`<p style="color: red;">Error: \${error.message}</p>\`;
            } finally {
                button.disabled = false;
                button.textContent = '🚀 Generate Image';
                loading.style.display = 'none';
            }
        });
    </script>
</body>
</html>
  `;
}
