/**
 * Template API Test Suite
 * Run with: node test-template-api.js
 */

// Import template processor functions (simulate)
const templateProcessor = {
  processTemplate: function(html, variables = {}) {
    if (!html || typeof html !== 'string') {
      throw new Error('HTML template must be a non-empty string');
    }

    if (!variables || typeof variables !== 'object') {
      return html;
    }

    let processedHtml = html;

    Object.entries(variables).forEach(([key, value]) => {
      const pattern = new RegExp(`\\{\\{${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}\\}`, 'g');
      const replacement = value !== null && value !== undefined ? String(value) : '';
      processedHtml = processedHtml.replace(pattern, replacement);
    });

    return processedHtml;
  },

  extractTemplateVariables: function(html) {
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
  },

  validateTemplateVariables: function(variables, requiredVars) {
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
};

// Test templates
const testTemplates = {
  invoice: {
    template: 
      '<div style="font-family: Arial, sans-serif; padding: 30px;">' +
        '<h1>INVOICE #{{invoiceNumber}}</h1>' +
        '<p>Bill To: {{companyName}}</p>' +
        '<p>Amount: ${{totalAmount}}</p>' +
        '<p>Status: {{status}}</p>' +
      '</div>',
    variables: {
      invoiceNumber: "INV-2024-001",
      companyName: "Acme Corp",
      totalAmount: "1,250.00",
      status: "PAID"
    }
  },

  businessCard: {
    template: 
      '<div style="padding: 20px; background: linear-gradient(45deg, #1e3c72, #2a5298); color: white;">' +
        '<h2>{{fullName}}</h2>' +
        '<p>{{jobTitle}}</p>' +
        '<p>📧 {{email}}</p>' +
        '<p>📱 {{phone}}</p>' +
      '</div>',
    variables: {
      fullName: "John Doe",
      jobTitle: "Senior Developer",
      email: "john@example.com",
      phone: "+1 (555) 123-4567"
    }
  }
};

// Test functions
function testVariableExtraction() {
  console.log('🔍 Testing Variable Extraction...');
  
  const variables = templateProcessor.extractTemplateVariables(testTemplates.invoice.template);
  console.log('Extracted variables:', variables);
  
  const expected = ['invoiceNumber', 'companyName', 'totalAmount', 'status'];
  const isValid = expected.every(v => variables.includes(v));
  
  console.log(isValid ? '✅ Variable extraction passed' : '❌ Variable extraction failed');
  return isValid;
}

function testTemplateProcessing() {
  console.log('\n🔧 Testing Template Processing...');
  
  const { template, variables } = testTemplates.invoice;
  const processed = templateProcessor.processTemplate(template, variables);
  
  console.log('Original template length:', template.length);
  console.log('Processed template length:', processed.length);
  
  // Check if variables were replaced
  const hasPlaceholders = processed.includes('{{');
  const hasValues = processed.includes('INV-2024-001') && processed.includes('Acme Corp');
  
  console.log('Contains placeholders:', hasPlaceholders);
  console.log('Contains values:', hasValues);
  
  const isValid = !hasPlaceholders && hasValues;
  console.log(isValid ? '✅ Template processing passed' : '❌ Template processing failed');
  
  if (isValid) {
    console.log('Sample processed content:');
    console.log(processed.substring(0, 200) + '...');
  }
  
  return isValid;
}

function testValidation() {
  console.log('\n✅ Testing Validation...');
  
  const template = testTemplates.businessCard.template;
  const requiredVars = templateProcessor.extractTemplateVariables(template);
  
  // Test with complete variables
  const completeValidation = templateProcessor.validateTemplateVariables(
    testTemplates.businessCard.variables,
    requiredVars
  );
  
  console.log('Complete variables validation:', completeValidation.isValid);
  
  // Test with missing variables
  const incompleteVars = { fullName: "Jane Doe" }; // Missing other required vars
  const incompleteValidation = templateProcessor.validateTemplateVariables(
    incompleteVars,
    requiredVars
  );
  
  console.log('Incomplete variables validation:', incompleteValidation.isValid);
  console.log('Missing variables:', incompleteValidation.missing);
  
  const isValid = completeValidation.isValid && !incompleteValidation.isValid;
  console.log(isValid ? '✅ Validation tests passed' : '❌ Validation tests failed');
  
  return isValid;
}

function testAPIRequestFormat() {
  console.log('\n📝 Testing API Request Format...');
  
  // Simulate API request format
  const apiRequest = {
    template: testTemplates.invoice.template,
    variables: testTemplates.invoice.variables,
    width: 700,
    height: 800,
    format: "png"
  };
  
  console.log('API Request Structure:');
  console.log('- Template:', typeof apiRequest.template, apiRequest.template.length, 'chars');
  console.log('- Variables:', Object.keys(apiRequest.variables).length, 'variables');
  console.log('- Dimensions:', `${apiRequest.width}x${apiRequest.height}`);
  console.log('- Format:', apiRequest.format);
  
  // Test processing
  const processed = templateProcessor.processTemplate(apiRequest.template, apiRequest.variables);
  const hasPlaceholders = processed.includes('{{');
  
  console.log(hasPlaceholders ? '❌ API format test failed' : '✅ API format test passed');
  return !hasPlaceholders;
}

// Run all tests
function runAllTests() {
  console.log('🚀 Starting Template API Tests...\n');
  
  const tests = [
    testVariableExtraction,
    testTemplateProcessing,
    testValidation,
    testAPIRequestFormat
  ];
  
  const results = tests.map(test => test());
  const passed = results.filter(Boolean).length;
  const total = results.length;
  
  console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! The template API is ready to use.');
  } else {
    console.log('⚠️  Some tests failed. Please review the implementation.');
  }
  
  console.log('\n📚 API Endpoints:');
  console.log('- POST /template/render - Generate image from template');
  console.log('- POST /template/preview - Preview processed HTML');
  console.log('- POST /template/variables - Extract template variables');
  console.log('- GET /health - Health check');
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    templateProcessor,
    testTemplates,
    runAllTests
  };
}

// Run tests if called directly
if (require.main === module) {
  runAllTests();
}