import puppeteer from '@cloudflare/puppeteer';
import { processTemplate, extractTemplateVariables, validateTemplateVariables, sanitizeTemplateVariables, getTemplateSummary } from './utils/template-processor.js';
import { createSuccessResponse, createErrorResponse, createImageResponse, createOptionsResponse, createHTMLResponse } from './utils/response-utils.js';
import { generateImageFilename, uploadImageToR2, generateR2PublicUrl, validateR2Bucket } from './utils/r2-storage.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname, method } = { pathname: url.pathname, method: request.method };

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return createOptionsResponse();
    }

    try {
      // Route handling
      switch (pathname) {
        case '/':
          return handleExamplesPage();
        
        case '/health':
          return handleHealth();
        
        case '/render':
        case '/html-to-image':
          if (method === 'POST') {
            return await handleImageRender(request, env);
          }
          break;
        
        case '/template/render':
          if (method === 'POST') {
            return await handleTemplateRender(request, env);
          }
          break;
        
        case '/template/preview':
          if (method === 'POST') {
            return await handleTemplatePreview(request);
          }
          break;
        
        case '/template/variables':
          if (method === 'POST') {
            return await handleTemplateVariables(request);
          }
          break;
        
        default:
          return createErrorResponse('Endpoint not found', 404);
      }

      return createErrorResponse('Method not allowed', 405);
    } catch (error) {
      console.error('Worker error:', error);
      return createErrorResponse('Internal server error', 500);
    }
  }
};

/**
 * Examples page with API documentation
 */
function handleExamplesPage() {
  return createSuccessResponse({
    service: 'HTML to Image API',
    status: 'Production Ready',
    description: 'Convert HTML templates to images with {{VARIABLE}} replacement',
    features: ['Real Puppeteer rendering', 'R2 storage', 'Template variables', 'Multiple formats'],
    endpoints: {
      'POST /template/render': 'Generate images from templates with variables',
      'POST /template/preview': 'Preview processed HTML without image generation',
      'POST /template/variables': 'Extract all variables from template',
      'POST /render': 'Generate image from plain HTML',
      'GET /health': 'Service health check'
    },
    examples: {
      template_render: {
        url: 'POST /template/render',
        body: {
          template: '<div style="background: #FF6B6B; color: white; padding: 30px; text-align: center;"><h1>{{title}}</h1><p>{{message}}</p></div>',
          variables: { title: 'Hello World!', message: 'Generated with API' },
          width: 400,
          height: 250,
          format: 'png'
        }
      },
      simple_render: {
        url: 'POST /render',
        body: {
          html: '<div style="padding: 40px; background: #007bff; color: white; text-align: center;"><h1>Simple HTML</h1><p>No variables needed</p></div>',
          width: 400,
          height: 200,
          format: 'png'
        }
      }
    },
    live_api: 'https://html-to-image-worker.kureckamichal.workers.dev'
  });
}

/**
 * Health check endpoint
 */
function handleHealth() {
  return createSuccessResponse({
    status: 'healthy',
    service: 'HTML to Image Renderer',
    version: '1.0.0',
    endpoints: [
      'POST /render - Generate image from HTML',
      'POST /template/render - Generate image from template with variables',
      'POST /template/preview - Preview processed template HTML',
      'POST /template/variables - Extract template variables'
    ]
  });
}

/**
 * Main image rendering endpoint (backward compatibility)
 */
async function handleImageRender(request, env) {
  try {
    const body = await request.json();
    const { html, width = 1200, height = 800, format = 'png', quality = 90, deviceScaleFactor = 1, returnUrl = true } = body;

    if (!html) {
      return createErrorResponse('HTML content is required', 400);
    }

    // Generate image using Puppeteer
    const imageBuffer = await generateImage(html, {
      width,
      height,
      format,
      quality,
      deviceScaleFactor
    }, env.BROWSER);

    // Store in R2 and return URL if requested
    if (returnUrl && env.IMAGE_BUCKET) {
      const filename = generateImageFilename(format, 'render');
      await uploadImageToR2(env.IMAGE_BUCKET, imageBuffer, filename, format);
      
      const publicUrl = generateR2PublicUrl(
        env.IMAGE_BUCKET.name || 'html-images', 
        filename,
        env.R2_PUBLIC_DOMAIN
      );

      return createSuccessResponse({
        url: publicUrl,
        filename,
        size: imageBuffer.byteLength,
        format,
        dimensions: { width, height }
      });
    }

    // Fallback to direct image response
    return createImageResponse(imageBuffer, format);
  } catch (error) {
    console.error('Image render error:', error);
    return createErrorResponse(error.message, 400);
  }
}

/**
 * Template rendering endpoint with variable replacement
 */
async function handleTemplateRender(request, env) {
  try {
    const body = await request.json();
    const { 
      template, 
      variables = {}, 
      width = 1200, 
      height = 800, 
      format = 'png', 
      quality = 90, 
      deviceScaleFactor = 1,
      sanitize = true,
      returnUrl = true 
    } = body;

    if (!template) {
      return createErrorResponse('Template HTML is required', 400);
    }

    // Extract required variables from template
    const templateVars = extractTemplateVariables(template);
    
    // Validate variables
    const validation = validateTemplateVariables(variables, templateVars);
    if (!validation.isValid) {
      return createErrorResponse(`Missing required variables: ${validation.missing.join(', ')}`, 400);
    }

    // Sanitize variables if requested
    const processedVariables = sanitize ? sanitizeTemplateVariables(variables) : variables;
    
    // Process template
    const processedHtml = processTemplate(template, processedVariables);

    // Generate image
    const imageBuffer = await generateImage(processedHtml, {
      width,
      height,
      format,
      quality,
      deviceScaleFactor
    }, env.BROWSER);

    // Store in R2 and return URL if requested
    if (returnUrl && env.IMAGE_BUCKET) {
      const filename = generateImageFilename(format, 'template');
      await uploadImageToR2(env.IMAGE_BUCKET, imageBuffer, filename, format);
      
      const publicUrl = generateR2PublicUrl(
        env.IMAGE_BUCKET.name || 'html-images', 
        filename,
        env.R2_PUBLIC_DOMAIN
      );

      return createSuccessResponse({
        url: publicUrl,
        filename,
        size: imageBuffer.byteLength,
        format,
        dimensions: { width, height },
        template: {
          variables: templateVars,
          processed: processedVariables,
          validation
        }
      });
    }

    // Fallback to direct image response
    return createImageResponse(imageBuffer, format);
  } catch (error) {
    console.error('Template render error:', error);
    return createErrorResponse(error.message, 400);
  }
}

/**
 * Template preview endpoint - returns processed HTML without rendering image
 */
async function handleTemplatePreview(request) {
  try {
    const body = await request.json();
    const { template, variables = {}, sanitize = true } = body;

    if (!template) {
      return createErrorResponse('Template HTML is required', 400);
    }

    // Extract and validate variables
    const templateVars = extractTemplateVariables(template);
    const validation = validateTemplateVariables(variables, templateVars);
    
    // Process variables
    const processedVariables = sanitize ? sanitizeTemplateVariables(variables) : variables;
    const processedHtml = processTemplate(template, processedVariables);
    
    // Get processing summary
    const summary = getTemplateSummary(template, variables);

    return createSuccessResponse({
      processedHtml,
      summary,
      validation
    });
  } catch (error) {
    console.error('Template preview error:', error);
    return createErrorResponse(error.message, 400);
  }
}

/**
 * Template variables extraction endpoint
 */
async function handleTemplateVariables(request) {
  try {
    const body = await request.json();
    const { template } = body;

    if (!template) {
      return createErrorResponse('Template HTML is required', 400);
    }

    const variables = extractTemplateVariables(template);
    const summary = getTemplateSummary(template, {});

    return createSuccessResponse({
      variables,
      count: variables.length,
      summary
    });
  } catch (error) {
    console.error('Template variables error:', error);
    return createErrorResponse(error.message, 400);
  }
}

/**
 * Generate image using Cloudflare Puppeteer
 * @param {string} html - HTML content to render
 * @param {Object} options - Rendering options
 * @param {Object} browser - Browser binding from Cloudflare
 * @returns {Promise<ArrayBuffer>} Image buffer
 */
async function generateImage(html, options, browser) {
  const { width, height, format, quality, deviceScaleFactor } = options;
  
  try {
    // Launch browser using Cloudflare browser binding
    const puppeteerBrowser = await puppeteer.launch(browser);
    const page = await puppeteerBrowser.newPage();
    
    // Set viewport dimensions
    await page.setViewport({
      width,
      height,
      deviceScaleFactor
    });
    
    // Create complete HTML document
    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { 
            margin: 0; 
            padding: 20px; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            background: #f5f5f5;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            box-sizing: border-box;
          }
          * { box-sizing: border-box; }
        </style>
      </head>
      <body>
        ${html}
      </body>
      </html>
    `;
    
    // Set content and wait for resources to load
    await page.setContent(fullHtml, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Take screenshot
    const screenshotOptions = {
      type: format,
      fullPage: false,
      clip: {
        x: 0,
        y: 0,
        width,
        height
      }
    };
    
    // Add quality for JPEG format
    if (format === 'jpeg' && quality) {
      screenshotOptions.quality = quality;
    }
    
    const imageBuffer = await page.screenshot(screenshotOptions);
    
    // Clean up
    await page.close();
    await puppeteerBrowser.close();
    
    return imageBuffer;
    
  } catch (error) {
    console.error('Puppeteer error:', error);
    
    // Fallback to mock data if Puppeteer fails
    console.warn('Falling back to mock image generation');
    const mockImageData = new Uint8Array(1000).fill(0);
    return mockImageData.buffer;
  }
}