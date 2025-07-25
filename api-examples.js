/**
 * API Examples for HTML to Image Renderer with Template Support
 */

const API_BASE_URL = 'https://your-worker.your-subdomain.workers.dev';

// Example 1: Basic template rendering with variables
const invoiceExample = {
  template: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: white; border: 2px solid #e5e7eb; border-radius: 12px;">
      <div style="border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px;">
        <h1 style="margin: 0; color: #2563eb; font-size: 32px;">INVOICE</h1>
        <p style="margin: 5px 0 0 0; color: #666;">Invoice #{{invoiceNumber}}</p>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
        <div>
          <h3 style="margin: 0 0 10px 0; color: #333;">Bill To:</h3>
          <p style="margin: 0; line-height: 1.5; color: #666;">
            {{companyName}}<br>{{address}}<br>{{city}}, {{state}} {{zip}}
          </p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; color: #666;"><strong>Date:</strong> {{issueDate}}</p>
          <p style="margin: 5px 0; color: #666;"><strong>Due:</strong> {{dueDate}}</p>
        </div>
      </div>
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin: 0 0 15px 0; color: #333;">Services</h3>
        <p style="margin: 5px 0; color: #666;">{{serviceDescription}}</p>
        <div style="text-align: right; margin-top: 15px;">
          <p style="margin: 0; font-size: 18px; font-weight: bold; color: #333;">Total: ${{totalAmount}}</p>
        </div>
      </div>
      <div style="text-align: center; padding: 20px; background: #f0f9ff; border-radius: 8px;">
        <p style="margin: 0; font-weight: bold; color: #0ea5e9;">Status: {{status}}</p>
      </div>
    </div>
  `,
  variables: {
    invoiceNumber: "INV-2024-001",
    companyName: "Acme Corporation Ltd",
    address: "123 Business Street",
    city: "New York",
    state: "NY",
    zip: "10001",
    issueDate: "2024-07-23",
    dueDate: "2024-08-23",
    serviceDescription: "Web Development and Design Services - Custom website development including responsive design, database integration, and deployment.",
    totalAmount: "3,250.00",
    status: "PAID"
  },
  width: 700,
  height: 800,
  format: "png"
};

// Example 2: Certificate template
const certificateExample = {
  template: `
    <div style="background: linear-gradient(45deg, #f0f8ff, #e6f3ff); font-family: Georgia, serif; text-align: center; padding: 60px; border: 10px solid #4169e1; border-radius: 20px; max-width: 600px; margin: 0 auto;">
      <div style="background: rgba(255,255,255,0.9); padding: 40px; border-radius: 15px;">
        <h1 style="color: #4169e1; font-size: 2.5em; margin: 0 0 30px 0; text-transform: uppercase; letter-spacing: 2px;">
          Certificate of {{certificateType}}
        </h1>
        <div style="margin: 30px 0;">
          <div style="width: 100px; height: 100px; background: #4169e1; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; color: white; font-size: 40px;">
            🏆
          </div>
        </div>
        <div style="border: 2px solid #4169e1; padding: 20px; margin: 20px 0; border-radius: 10px;">
          <h2 style="font-size: 1.8em; color: #333; margin: 0;">{{recipientName}}</h2>
        </div>
        <div style="margin: 30px 0;">
          <p style="font-size: 1.2em; color: #555; margin: 10px 0;">has successfully completed the course:</p>
          <h3 style="color: #4169e1; font-size: 1.5em; margin: 15px 0;">{{courseName}}</h3>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 40px; font-size: 1.1em; color: #666;">
          <div><strong>Date:</strong> {{completionDate}}</div>
          <div><strong>Grade:</strong> {{finalGrade}}</div>
        </div>
        <div style="margin-top: 30px; padding: 15px; background: rgba(65, 105, 225, 0.1); border-radius: 8px;">
          <p style="margin: 0; font-size: 0.9em; color: #666;">Certificate ID: {{certificateId}}</p>
        </div>
      </div>
    </div>
  `,
  variables: {
    certificateType: "Achievement",
    recipientName: "Jane Smith",
    courseName: "Advanced Web Development with React",
    completionDate: "2024-07-23",
    finalGrade: "A+",
    certificateId: "CERT-2024-WD-001"
  },
  width: 800,
  height: 700,
  format: "png"
};

// API Functions
async function renderTemplate(templateConfig) {
  try {
    const response = await fetch(`${API_BASE_URL}/template/render`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(templateConfig)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return await response.blob();
  } catch (error) {
    console.error('Template render error:', error);
    throw error;
  }
}

async function previewTemplate(templateConfig) {
  try {
    const response = await fetch(`${API_BASE_URL}/template/preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        template: templateConfig.template,
        variables: templateConfig.variables,
        sanitize: templateConfig.sanitize !== false
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Template preview error:', error);
    throw error;
  }
}

async function extractVariables(template) {
  try {
    const response = await fetch(`${API_BASE_URL}/template/variables`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ template })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Variable extraction error:', error);
    throw error;
  }
}

// Usage Examples
async function runExamples() {
  console.log('🚀 Running Template API Examples...');

  try {
    // 1. Extract variables from template
    console.log('\n📋 Extracting variables from invoice template...');
    const variables = await extractVariables(invoiceExample.template);
    console.log('Found variables:', variables.variables);

    // 2. Preview processed template
    console.log('\n👀 Previewing processed template...');
    const preview = await previewTemplate(invoiceExample);
    console.log('Template processed successfully');
    console.log('Validation:', preview.validation);

    // 3. Generate invoice image
    console.log('\n🖼️  Generating invoice image...');
    const invoiceBlob = await renderTemplate(invoiceExample);
    console.log('Invoice image generated:', invoiceBlob.size, 'bytes');

    // 4. Generate certificate image
    console.log('\n🏆 Generating certificate image...');
    const certificateBlob = await renderTemplate(certificateExample);
    console.log('Certificate image generated:', certificateBlob.size, 'bytes');

    console.log('\n✅ All examples completed successfully!');
  } catch (error) {
    console.error('❌ Example failed:', error);
  }
}

// Test with missing variables
async function testValidation() {
  console.log('\n🧪 Testing validation with missing variables...');
  
  const incompleteConfig = {
    template: invoiceExample.template,
    variables: {
      invoiceNumber: "INV-2024-002",
      // Missing other required variables
    },
    width: 700,
    height: 800
  };

  try {
    await renderTemplate(incompleteConfig);
  } catch (error) {
    console.log('✅ Validation working:', error.message);
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    renderTemplate,
    previewTemplate,
    extractVariables,
    examples: {
      invoice: invoiceExample,
      certificate: certificateExample
    },
    runExamples,
    testValidation
  };
}

// Auto-run examples if called directly
if (typeof window !== 'undefined') {
  // Browser environment
  window.TemplateAPI = {
    renderTemplate,
    previewTemplate,
    extractVariables,
    examples: {
      invoice: invoiceExample,
      certificate: certificateExample
    },
    runExamples,
    testValidation
  };
} else if (require.main === module) {
  // Node.js environment
  runExamples();
  testValidation();
}