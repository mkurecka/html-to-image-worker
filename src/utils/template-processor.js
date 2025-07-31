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
  const openPattern = new RegExp(`\\{\\{#${blockType}\\s+([^}]+)\\}\\}`, 'g');
  const closePattern = new RegExp(`\\{\\{\\/${blockType}\\}\\}`, 'g');
  const elsePattern = /\{\{else\}\}/g;
  
  let processedHtml = html;
  let match;
  
  // Find all opening blocks
  const openMatches = [];
  while ((match = openPattern.exec(html)) !== null) {
    openMatches.push({
      index: match.index,
      length: match[0].length,
      variableName: match[1].trim(),
      fullMatch: match[0]
    });
  }
  
  // Process blocks from end to start to avoid index shifting
  for (let i = openMatches.length - 1; i >= 0; i--) {
    const openMatch = openMatches[i];
    
    // Find corresponding closing block
    const afterOpen = html.substring(openMatch.index + openMatch.length);
    const closeMatch = afterOpen.match(closePattern);
    
    if (!closeMatch) {
      continue; // Skip malformed blocks
    }
    
    const blockStart = openMatch.index;
    const blockEnd = openMatch.index + openMatch.length + closeMatch.index + closeMatch[0].length;
    const blockContent = html.substring(openMatch.index + openMatch.length, openMatch.index + openMatch.length + closeMatch.index);
    
    // Check for {{else}} within the block
    const elseMatch = blockContent.match(elsePattern);
    let ifContent, elseContent;
    
    if (elseMatch) {
      ifContent = blockContent.substring(0, elseMatch.index);
      elseContent = blockContent.substring(elseMatch.index + elseMatch[0].length);
    } else {
      ifContent = blockContent;
      elseContent = '';
    }
    
    // Evaluate condition
    const variableValue = variables[openMatch.variableName];
    const condition = isUnless ? !isTruthy(variableValue) : isTruthy(variableValue);
    
    const replacement = condition ? ifContent : elseContent;
    
    // Replace the entire block
    processedHtml = processedHtml.substring(0, blockStart) + replacement + processedHtml.substring(blockEnd);
  }
  
  return processedHtml;
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