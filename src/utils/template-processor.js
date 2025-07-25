/**
 * Template processing utilities for HTML variable replacement
 */

/**
 * Replaces template variables in HTML string with provided values
 * @param {string} html - HTML template with {{VARIABLE}} placeholders
 * @param {Object} variables - Key-value pairs for replacement
 * @returns {string} Processed HTML with variables replaced
 */
export function processTemplate(html, variables = {}) {
  if (!html || typeof html !== 'string') {
    throw new Error('HTML template must be a non-empty string');
  }

  if (!variables || typeof variables !== 'object') {
    return html;
  }

  let processedHtml = html;

  // Replace all {{VARIABLE}} patterns with corresponding values
  Object.entries(variables).forEach(([key, value]) => {
    const pattern = new RegExp(`\\{\\{${escapeRegExp(key)}\\}\\}`, 'g');
    const replacement = value !== null && value !== undefined ? String(value) : '';
    processedHtml = processedHtml.replace(pattern, replacement);
  });

  return processedHtml;
}

/**
 * Extracts all template variables from HTML string
 * @param {string} html - HTML template
 * @returns {Array<string>} Array of variable names found in template
 */
export function extractTemplateVariables(html) {
  if (!html || typeof html !== 'string') {
    return [];
  }

  const variablePattern = /\{\{([^}]+)\}\}/g;
  const variables = new Set();
  let match;

  while ((match = variablePattern.exec(html)) !== null) {
    variables.add(match[1].trim());
  }

  return Array.from(variables);
}

/**
 * Validates template variables against required fields
 * @param {Object} variables - Provided variables
 * @param {Array<string>} requiredVars - Required variable names
 * @returns {Object} Validation result with isValid and missing fields
 */
export function validateTemplateVariables(variables, requiredVars) {
  const missing = requiredVars.filter(varName => 
    variables[varName] === undefined || variables[varName] === null || variables[varName] === ''
  );

  return {
    isValid: missing.length === 0,
    missing,
    provided: Object.keys(variables || {}),
    required: requiredVars
  };
}

/**
 * Sanitizes template variables to prevent XSS
 * @param {Object} variables - Variables to sanitize
 * @returns {Object} Sanitized variables
 */
export function sanitizeTemplateVariables(variables) {
  if (!variables || typeof variables !== 'object') {
    return {};
  }

  const sanitized = {};
  
  Object.entries(variables).forEach(([key, value]) => {
    if (typeof value === 'string') {
      // Basic HTML escaping to prevent XSS
      sanitized[key] = value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    } else {
      sanitized[key] = value;
    }
  });

  return sanitized;
}

/**
 * Escapes special regex characters
 * @param {string} string - String to escape
 * @returns {string} Escaped string
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Creates a template processing summary
 * @param {string} html - Original HTML template
 * @param {Object} variables - Variables used
 * @returns {Object} Processing summary
 */
export function getTemplateSummary(html, variables) {
  const extractedVars = extractTemplateVariables(html);
  const validation = validateTemplateVariables(variables, extractedVars);
  
  return {
    templateVariables: extractedVars,
    providedVariables: Object.keys(variables || {}),
    validation,
    processedLength: html.length,
    variableCount: extractedVars.length
  };
}