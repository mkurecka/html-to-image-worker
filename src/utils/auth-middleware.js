/**
 * Authentication Middleware
 * Provides API key validation for protected endpoints
 */

/**
 * Validate API key from request headers
 * @param {Request} request - Incoming request
 * @param {Object} env - Environment variables
 * @returns {Object} - { isValid: boolean, error?: string }
 */
export function validateApiKey(request, env) {
  // Allow internal service binding calls (worker-to-worker)
  // Service bindings use "http://internal/*" URLs and can only come from
  // other workers in the same Cloudflare account - this is secure
  const url = new URL(request.url);
  if (url.hostname === 'internal') {
    console.log('[AUTH] Internal service binding call - authenticated');
    return { isValid: true, isInternal: true };
  }

  // Extract API key from headers (supports multiple formats)
  const apiKey =
    request.headers.get('X-API-Key') ||
    request.headers.get('Authorization')?.replace('Bearer ', '') ||
    request.headers.get('Api-Key');

  // Check if API key is provided
  if (!apiKey) {
    return {
      isValid: false,
      error: 'API key is required. Provide it in X-API-Key header or Authorization: Bearer <key>'
    };
  }

  // Get allowed API keys from environment (comma-separated for multiple keys)
  const allowedKeys = env.API_KEYS?.split(',').map(key => key.trim()) || [];

  // Development fallback - allow default key if no keys configured
  if (allowedKeys.length === 0 && env.ENVIRONMENT === 'development') {
    console.warn('No API keys configured - using development mode');
    return { isValid: true };
  }

  // Check if provided key matches any allowed key
  const isValid = allowedKeys.includes(apiKey);

  if (!isValid) {
    return {
      isValid: false,
      error: 'Invalid API key'
    };
  }

  return { isValid: true };
}

/**
 * Check if endpoint is public (doesn't require auth)
 * @param {string} pathname - Request pathname
 * @returns {boolean} - True if endpoint is public
 */
export function isPublicEndpoint(pathname) {
  const publicEndpoints = [
    '/',           // Examples page
    '/health',     // Health check
  ];

  return publicEndpoints.includes(pathname);
}

/**
 * Rate limiting helper (optional - simple in-memory tracking)
 * @param {Request} request - Incoming request
 * @param {Object} env - Environment variables
 * @returns {Object} - { allowed: boolean, error?: string }
 */
export function checkRateLimit(request, env) {
  // TODO: Implement proper rate limiting with KV storage
  // For now, just allow all requests
  return { allowed: true };
}
