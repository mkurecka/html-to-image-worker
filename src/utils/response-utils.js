/**
 * Response utility functions for consistent API responses
 */

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400'
};

/**
 * Creates a success JSON response
 * @param {any} data - Response data
 * @param {number} status - HTTP status code
 * @returns {Response} Response object
 */
export function createSuccessResponse(data, status = 200) {
  return new Response(JSON.stringify({
    success: true,
    data,
    timestamp: new Date().toISOString()
  }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...SECURITY_HEADERS,
      ...CORS_HEADERS
    }
  });
}

/**
 * Creates an error JSON response
 * @param {string|Error} error - Error message or Error object
 * @param {number} status - HTTP status code
 * @returns {Response} Response object
 */
export function createErrorResponse(error, status = 500) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  return new Response(JSON.stringify({
    success: false,
    error: errorMessage,
    timestamp: new Date().toISOString()
  }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...SECURITY_HEADERS,
      ...CORS_HEADERS
    }
  });
}

/**
 * Creates an image response
 * @param {ArrayBuffer} imageBuffer - Image data
 * @param {string} format - Image format (png, jpeg)
 * @returns {Response} Response object
 */
export function createImageResponse(imageBuffer, format = 'png') {
  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
  
  return new Response(imageBuffer, {
    status: 200,
    headers: {
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=3600',
      ...SECURITY_HEADERS,
      ...CORS_HEADERS
    }
  });
}

/**
 * Creates an HTML response
 * @param {string} html - HTML content
 * @param {number} status - HTTP status code
 * @returns {Response} Response object
 */
export function createHTMLResponse(html, status = 200) {
  return new Response(html, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      ...SECURITY_HEADERS,
      ...CORS_HEADERS
    }
  });
}

/**
 * Creates an OPTIONS response for CORS preflight
 * @returns {Response} Response object
 */
export function createOptionsResponse() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS
  });
}