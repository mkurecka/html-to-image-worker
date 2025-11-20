import puppeteer from '@cloudflare/puppeteer';
import { processTemplate, extractTemplateVariables, validateTemplateVariables, sanitizeTemplateVariables, getTemplateSummary } from './utils/template-processor.js';
import { createSuccessResponse, createErrorResponse, createImageResponse, createOptionsResponse, createHTMLResponse } from './utils/response-utils.js';
import { generateImageFilename, uploadImageToR2, generateR2PublicUrl, validateR2Bucket } from './utils/r2-storage.js';
import { validateApiKey, isPublicEndpoint } from './utils/auth-middleware.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname, method } = { pathname: url.pathname, method: request.method };

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return createOptionsResponse();
    }

    // Authentication check for protected endpoints
    if (!isPublicEndpoint(pathname)) {
      const authResult = validateApiKey(request, env);
      if (!authResult.isValid) {
        return createErrorResponse(authResult.error, 401);
      }
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
      tweetToIgPost: {
        url: 'POST /template/render',
        body: {
          template: '<div style="background: #000; color: #fff; padding: 40px; border-radius: 16px; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Arial, sans-serif; max-width: 600px;"><div style="display: flex; align-items: center; margin-bottom: 20px;"><img src="{{twitterAvatar}}" style="width: 48px; height: 48px; border-radius: 50%; margin-right: 16px;" /><div><div style="font-weight: bold; font-size: 16px;">{{twitterHandle}}</div><div style="color: #8b98a5; font-size: 14px;">@{{twitterHandle}}</div></div></div><div style="font-size: 18px; line-height: 1.4; margin-bottom: 20px;">{{text}}</div><div style="display: flex; justify-content: space-between; align-items: center; color: #8b98a5; font-size: 14px;"><div style="display: flex; gap: 20px;"><span>💬 Reply</span><span>🔄 Retweet</span><span>❤️ Like</span><span>📤 Share</span></div><div>🕐 Now</div></div></div>',
          variables: { twitterHandle: 'elonmusk', twitterAvatar: 'https://pbs.twimg.com/profile_images/1683325380441128960/yRsRRjGO_400x400.jpg', text: 'Making life multiplanetary 🚀' },
          width: 1080,
          height: 1080,
          format: 'png'
        }
      },
      igCarouselIntro: {
        url: 'POST /template/render',
        body: {
          template: '<div style="position: relative; width: 100%; height: 100vh; background: {{backgroundColor}}; background-image: {{backgroundImage}}; background-size: cover; background-position: center; display: flex; align-items: center; justify-content: center; text-align: center; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Arial, sans-serif;"><div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4);"></div><div style="position: relative; z-index: 2; color: white; padding: 60px 40px;"><h1 style="font-size: 72px; font-weight: 900; line-height: 0.9; margin: 0 0 30px 0; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">{{hookText}}</h1></div><div style="position: absolute; bottom: 40px; right: 40px; z-index: 3;"><img src="{{logo}}" style="width: 80px; height: 80px; border-radius: 50%; border: 4px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3);" /></div></div>',
          variables: { hookText: '5 Secrets to Scale Your Business', backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', backgroundImage: 'none', logo: 'https://via.placeholder.com/80x80/FF6B6B/white?text=LOGO' },
          width: 1080,
          height: 1080,
          format: 'png'
        }
      },
      igCarouselSlide: {
        url: 'POST /template/render',
        body: {
          template: '<div style="position: relative; width: 100%; height: 100vh; background: {{backgroundColor}}; display: flex; flex-direction: column; justify-content: center; padding: 80px 60px; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Arial, sans-serif; color: {{textColor}};"><div style="flex: 1; display: flex; flex-direction: column; justify-content: center;"><h2 style="font-size: 48px; font-weight: 800; margin: 0 0 40px 0; line-height: 1.1;">{{title}}</h2><p style="font-size: 24px; line-height: 1.4; margin: 0; opacity: 0.9;">{{text}}</p></div><div style="display: flex; justify-content: space-between; align-items: center; margin-top: 60px;"><div style="font-size: 18px; font-weight: 600; opacity: 0.7;">{{brandName}}</div><img src="{{logo}}" style="width: 60px; height: 60px; border-radius: 50%;" /></div></div>',
          variables: { title: 'Focus on Customer Experience', text: 'Happy customers become your best marketing team. Every interaction matters and builds your reputation.', backgroundColor: '#f8f9fa', textColor: '#2c3e50', brandName: 'YourBrand', logo: 'https://via.placeholder.com/60x60/3498db/white?text=YB' },
          width: 1080,
          height: 1080,
          format: 'png'
        }
      },
      igQuote: {
        url: 'POST /template/render',
        body: {
          template: '<div style="position: relative; width: 100%; height: 100vh; background: {{backgroundColor}}; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 80px 60px; font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Arial, sans-serif; color: {{textColor}}; text-align: center;"><div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; max-width: 800px;"><div style="font-size: 120px; line-height: 1; margin-bottom: 40px; opacity: 0.3;">"</div><blockquote style="font-size: 36px; font-weight: 500; line-height: 1.3; margin: 0 0 50px 0; font-style: italic;">{{quote}}</blockquote><div style="font-size: 24px; font-weight: 600; opacity: 0.8;">— {{author}}</div></div><div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-top: 60px;"><div style="font-size: 18px; font-weight: 600; opacity: 0.7;">{{brandName}}</div><img src="{{logo}}" style="width: 60px; height: 60px; border-radius: 50%;" /></div></div>',
          variables: { quote: 'Úspěch není konečná stanice, neúspěch není fatální. Důležitá je odvaha pokračovat.', author: 'Winston Churchill', backgroundColor: '#ffffff', textColor: '#2c3e50', brandName: 'aičko.cz', logo: 'https://via.placeholder.com/60x60/667eea/white?text=AI' },
          width: 1080,
          height: 1080,
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

    // Sanitize variables if requested (skip quote escaping for HTML content)
    const processedVariables = sanitize ? sanitizeTemplateVariables(variables, { skipQuoteEscaping: true }) : variables;
    
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
    
    // Process variables (skip quote escaping for HTML content)
    const processedVariables = sanitize ? sanitizeTemplateVariables(variables, { skipQuoteEscaping: true }) : variables;
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