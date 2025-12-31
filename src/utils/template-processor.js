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

  // Process array blocks first ({{#arrayName}}...{{/arrayName}})
  processedHtml = processArrayBlocks(processedHtml, variables);

  // Process {{#if}} blocks
  processedHtml = processIfBlocks(processedHtml, variables, false);

  // Process {{#unless}} blocks
  processedHtml = processIfBlocks(processedHtml, variables, true);

  return processedHtml;
}

/**
 * Processes array iteration blocks in template HTML
 * Supports Mustache-style {{#arrayName}}...{{/arrayName}} syntax
 * @param {string} html - HTML template with array blocks
 * @param {Object} variables - Variables containing arrays
 * @returns {string} Processed HTML with array blocks expanded
 */
function processArrayBlocks(html, variables) {
  let result = html;
  let changed = true;

  // Keep processing until no more array blocks are found (handles nested)
  while (changed) {
    changed = false;

    // Find array blocks: {{#name}}...{{/name}} where name is an array in variables
    // Skip reserved keywords: if, unless, else
    const arrayBlockPattern = /\{\{#([^}\s]+)\}\}([\s\S]*?)\{\{\/\1\}\}/;
    const match = result.match(arrayBlockPattern);

    if (match) {
      const [fullMatch, arrayName, blockContent] = match;

      // Skip if this is a conditional block (if/unless)
      if (arrayName === 'if' || arrayName === 'unless') {
        // Move past this match to find actual array blocks
        const matchIndex = result.indexOf(fullMatch);
        const before = result.substring(0, matchIndex + fullMatch.length);
        const after = result.substring(matchIndex + fullMatch.length);
        const processedAfter = processArrayBlocks(after, variables);
        result = before + processedAfter;
        continue;
      }

      const arrayValue = variables[arrayName];

      // Check if this variable is actually an array
      if (Array.isArray(arrayValue)) {
        // Iterate over array and expand template for each item
        let expandedContent = '';

        for (let i = 0; i < arrayValue.length; i++) {
          const item = arrayValue[i];
          let itemContent = blockContent;

          // Replace {{.}} with the item itself (for simple arrays)
          if (typeof item !== 'object') {
            itemContent = itemContent.replace(/\{\{\.\}\}/g, String(item));
          } else {
            // Replace {{property}} with item.property for object arrays
            Object.entries(item).forEach(([key, value]) => {
              const pattern = new RegExp(`\\{\\{${escapeRegExp(key)}\\}\\}`, 'g');
              const replacement = value !== null && value !== undefined ? String(value) : '';
              itemContent = itemContent.replace(pattern, replacement);
            });
          }

          // Add index helpers: {{@index}} (0-based), {{@number}} (1-based), {{@first}}, {{@last}}
          itemContent = itemContent.replace(/\{\{@index\}\}/g, String(i));
          itemContent = itemContent.replace(/\{\{@number\}\}/g, String(i + 1));
          itemContent = itemContent.replace(/\{\{@first\}\}/g, String(i === 0));
          itemContent = itemContent.replace(/\{\{@last\}\}/g, String(i === arrayValue.length - 1));

          expandedContent += itemContent;
        }

        result = result.replace(fullMatch, expandedContent);
        changed = true;
      }
      // If not an array, leave the block as-is (might be processed by conditionals)
    }
  }

  return result;
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
 * Includes both simple variables, conditional variables, and array variables
 * Variables inside array blocks are NOT required at top-level
 * @param {string} html - HTML template
 * @returns {Array<string>} Array of variable names found in template (top-level only)
 */
export function extractTemplateVariables(html) {
  if (!html || typeof html !== 'string') {
    return [];
  }

  const variables = new Set();
  const arrayBlockVariables = new Set(); // Variables inside array blocks

  // First, find all array block names and their inner variables
  const arrayBlocks = extractArrayBlocks(html);
  arrayBlocks.forEach(block => {
    variables.add(block.arrayName); // Array itself is required
    block.innerVariables.forEach(v => arrayBlockVariables.add(v));
  });

  // Extract simple variables: {{variable}} (excluding those inside array blocks)
  let processedHtml = html;

  // Remove array block content to avoid extracting inner variables as top-level
  arrayBlocks.forEach(block => {
    processedHtml = processedHtml.replace(block.fullMatch, `{{${block.arrayName}}}`);
  });

  const simplePattern = /\{\{([^#\/@][^}]*)\}\}/g;
  let match;

  while ((match = simplePattern.exec(processedHtml)) !== null) {
    const variableName = match[1].trim();
    // Skip reserved words and index helpers
    if (variableName !== 'else' && !variableName.startsWith('@')) {
      variables.add(variableName);
    }
  }

  // Extract conditional variables: {{#if variable}} and {{#unless variable}}
  const conditionalPattern = /\{\{#(?:if|unless)\s+([^}]+)\}\}/g;

  while ((match = conditionalPattern.exec(processedHtml)) !== null) {
    variables.add(match[1].trim());
  }

  return Array.from(variables);
}

/**
 * Extracts array block information from template
 * @param {string} html - HTML template
 * @returns {Array<Object>} Array of block info: { arrayName, innerVariables, fullMatch }
 */
function extractArrayBlocks(html) {
  const blocks = [];
  const reservedKeywords = ['if', 'unless', 'else'];

  // Match array blocks: {{#name}}content{{/name}}
  const blockPattern = /\{\{#([^}\s]+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;
  let match;

  while ((match = blockPattern.exec(html)) !== null) {
    const [fullMatch, blockName, content] = match;

    // Skip reserved keywords (conditionals)
    if (reservedKeywords.includes(blockName)) {
      continue;
    }

    // Extract inner variables from block content
    const innerVars = new Set();
    const innerPattern = /\{\{([^#\/@][^}]*)\}\}/g;
    let innerMatch;

    while ((innerMatch = innerPattern.exec(content)) !== null) {
      const varName = innerMatch[1].trim();
      if (varName !== 'else' && !varName.startsWith('@')) {
        innerVars.add(varName);
      }
    }

    blocks.push({
      arrayName: blockName,
      innerVariables: Array.from(innerVars),
      fullMatch
    });
  }

  return blocks;
}

/**
 * Validates template variables against required fields
 * Handles both simple values and arrays
 * Empty strings are valid (user explicitly wants empty value)
 * @param {Object} variables - Provided variables
 * @param {Array<string>} requiredVars - Required variable names
 * @returns {Object} Validation result with isValid and missing fields
 */
export function validateTemplateVariables(variables, requiredVars) {
  // Handle case where variables is passed as a JSON string
  let vars = variables || {};
  if (typeof vars === 'string') {
    try {
      vars = JSON.parse(vars);
    } catch (e) {
      vars = {};
    }
  }

  const missing = requiredVars.filter(varName => {
    // Variable is missing only if not provided at all (undefined) or null
    // Empty strings ARE valid - user explicitly wants empty value
    if (!(varName in vars)) return true;

    const value = vars[varName];
    if (value === undefined || value === null) return true;

    // Empty arrays are considered missing (nothing to iterate)
    if (Array.isArray(value) && value.length === 0) return true;

    return false;
  });

  return {
    isValid: missing.length === 0,
    missing,
    provided: Object.keys(vars),
    required: requiredVars
  };
}

/**
 * Sanitizes template variables to prevent XSS
 * Handles nested objects and arrays
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

  function sanitizeValue(value) {
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

      return sanitizedValue;
    } else if (Array.isArray(value)) {
      // Recursively sanitize array items
      return value.map(item => {
        if (typeof item === 'object' && item !== null) {
          return sanitizeObject(item);
        }
        return sanitizeValue(item);
      });
    } else if (typeof value === 'object' && value !== null) {
      return sanitizeObject(value);
    }
    return value;
  }

  function sanitizeObject(obj) {
    const sanitized = {};
    Object.entries(obj).forEach(([key, value]) => {
      sanitized[key] = sanitizeValue(value);
    });
    return sanitized;
  }

  return sanitizeObject(variables);
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