import { processTemplate, extractTemplateVariables, validateTemplateVariables, sanitizeTemplateVariables, getTemplateSummary } from './utils/template-processor.js';
import { createSuccessResponse, createErrorResponse, createImageResponse, createOptionsResponse } from './utils/response-utils.js';
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
    });

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
    });

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
 * Generate image using Puppeteer (mock implementation for now)
 * In production, this would use @cloudflare/puppeteer
 */
async function generateImage(html, options) {
  // This is a mock implementation
  // In production, you would use:
  // import puppeteer from '@cloudflare/puppeteer';
  
  const { width, height, format, quality, deviceScaleFactor } = options;
  
  // Mock response - in production this would be actual Puppeteer screenshot
  const mockImageData = new Uint8Array(1000).fill(0);
  return mockImageData.buffer;
  
  /* Production implementation would be:
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.setViewport({
    width,
    height,
    deviceScaleFactor
  });
  
  await page.setContent(html, {
    waitUntil: 'networkidle0'
  });
  
  const imageBuffer = await page.screenshot({
    type: format,
    quality: format === 'jpeg' ? quality : undefined,
    fullPage: true
  });
  
  await browser.close();
  return imageBuffer;
  */
}