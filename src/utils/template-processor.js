/**
 * Template processing utilities for HTML variable replacement
 */

/**
 * Replaces template variables in HTML string with provided values
 * Supports both simple {{VARIABLE}} and conditional {{#if VARIABLE}}...{{/if}} patterns
 * @param {string} html - HTML template with {{VARIABLE}} placeholders and conditionals
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

  // First, process conditional blocks ({{#if}}, {{#unless}}, etc.)
  processedHtml = processConditionalBlocks(processedHtml, variables);

  // Then replace simple {{VARIABLE}} patterns with corresponding values
  Object.entries(variables).forEach(([key, value]) => {
    const pattern = new RegExp(`\\{\\{${escapeRegExp(key)}\\}\\}`, 'g');
    const replacement = value !== null && value !== undefined ? String(value) : '';
    processedHtml = processedHtml.replace(pattern, replacement);
  });

  return processedHtml;
}

/**
 * Processes conditional blocks in template HTML
 * Supports {{#if variable}}, {{#unless variable}}, {{else}}, {{/if}}, {{/unless}}
 * @param {string} html - HTML template with conditional blocks
 * @param {Object} variables - Variables for condition evaluation
 * @returns {string} Processed HTML with conditionals resolved
 */
function processConditionalBlocks(html, variables) {
  let processedHtml = html;
  
  // Process {{#if}} blocks first
  processedHtml = processIfBlocks(processedHtml, variables, false);
  
  // Process {{#unless}} blocks
  processedHtml = processIfBlocks(processedHtml, variables, true);
  
  return processedHtml;
}

/**
 * Processes if/unless conditional blocks
 * @param {string} html - HTML template
 * @param {Object} variables - Variables for evaluation
 * @param {boolean} isUnless - Whether this is an "unless" block (inverted logic)
 * @returns {string} Processed HTML
 */
function processIfBlocks(html, variables, isUnless = false) {
  const blockType = isUnless ? 'unless' : 'if';
  const openTag = `{{#${blockType}`;
  const closeTag = `{{/${blockType}}}`;
  const elseTag = '{{else}}';
  
  let result = html;
  let changed = true;
  
  // Keep processing until no more blocks are found (handles nested blocks)
  while (changed) {
    changed = false;
    let workingHtml = result;
    
    // Find the first opening tag
    let openIndex = workingHtml.indexOf(openTag);
    while (openIndex !== -1) {
      // Find the end of the opening tag
      let openTagEnd = workingHtml.indexOf('}}', openIndex) + 2;
      if (openTagEnd === 1) break; // Invalid tag
      
      // Extract variable name
      let openTagContent = workingHtml.substring(openIndex + openTag.length, openTagEnd - 2).trim();
      
      // Find corresponding closing tag
      let depth = 1;
      let searchIndex = openTagEnd;
      let closeIndex = -1;
      
      while (depth > 0 && searchIndex < workingHtml.length) {
        let nextOpen = workingHtml.indexOf(openTag, searchIndex);
        let nextClose = workingHtml.indexOf(closeTag, searchIndex);
        
        if (nextClose === -1) break; // No closing tag found
        
        if (nextOpen !== -1 && nextOpen < nextClose) {
          depth++;
          searchIndex = nextOpen + openTag.length;
        } else {
          depth--;
          if (depth === 0) {
            closeIndex = nextClose;
          }
          searchIndex = nextClose + closeTag.length;
        }
      }
      
      if (closeIndex === -1) break; // No matching close tag
      
      // Extract content between tags
      let blockContent = workingHtml.substring(openTagEnd, closeIndex);
      
      // Check for {{else}}
      let elseIndex = blockContent.indexOf(elseTag);
      let ifContent = '';
      let elseContent = '';
      
      if (elseIndex !== -1) {
        ifContent = blockContent.substring(0, elseIndex);
        elseContent = blockContent.substring(elseIndex + elseTag.length);
      } else {
        ifContent = blockContent;
      }
      
      // Evaluate condition
      const variableValue = variables[openTagContent];
      const condition = isUnless ? !isTruthy(variableValue) : isTruthy(variableValue);
      
      const replacement = condition ? ifContent : elseContent;
      
      // Replace the entire block
      result = workingHtml.substring(0, openIndex) + replacement + workingHtml.substring(closeIndex + closeTag.length);
      changed = true;
      break; // Start over with the modified string
    }
  }
  
  return result;
}

/**
 * Determines if a value is "truthy" in template context
 * @param {any} value - Value to evaluate
 * @returns {boolean} Whether the value is truthy
 */
function isTruthy(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.trim() !== '';
  if (typeof value === 'number') return value !== 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return Boolean(value);
}

/**
 * Extracts all template variables from HTML string
 * Includes both simple variables and conditional variables
 * @param {string} html - HTML template
 * @returns {Array<string>} Array of variable names found in template
 */
export function extractTemplateVariables(html) {
  if (!html || typeof html !== 'string') {
    return [];
  }

  const variables = new Set();
  
  // Extract simple variables: {{variable}}
  const simplePattern = /\{\{([^#\/][^}]*)\}\}/g;
  let match;
  
  while ((match = simplePattern.exec(html)) !== null) {
    const variableName = match[1].trim();
    // Skip reserved words like 'else'
    if (variableName !== 'else') {
      variables.add(variableName);
    }
  }
  
  // Extract conditional variables: {{#if variable}} and {{#unless variable}}
  const conditionalPattern = /\{\{#(?:if|unless)\s+([^}]+)\}\}/g;
  
  while ((match = conditionalPattern.exec(html)) !== null) {
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
 * @param {Object} options - Sanitization options
 * @param {boolean} options.skipQuoteEscaping - Skip quote escaping for HTML content
 * @returns {Object} Sanitized variables
 */
export function sanitizeTemplateVariables(variables, options = {}) {
  if (!variables || typeof variables !== 'object') {
    return {};
  }

  const { skipQuoteEscaping = false } = options;
  const sanitized = {};
  
  Object.entries(variables).forEach(([key, value]) => {
    if (typeof value === 'string') {
      // Basic HTML escaping to prevent XSS
      let sanitizedValue = value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      
      // Only escape quotes if not explicitly skipped (for HTML content)
      if (!skipQuoteEscaping) {
        sanitizedValue = sanitizedValue
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }
      
      sanitized[key] = sanitizedValue;
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