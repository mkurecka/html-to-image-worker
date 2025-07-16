// Example usage of the HTML to Image API

// Basic HTML to PNG conversion
const basicExample = {
  html: `
    <div style="padding: 40px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px;">
      <h1>Hello World!</h1>
      <p>Generated with Cloudflare Workers</p>
    </div>
  `,
  width: 800,
  height: 400,
  format: "png"
};

// Business card example
const businessCardExample = {
  html: `
    <div style="width: 400px; height: 250px; background: linear-gradient(45deg, #1e3c72, #2a5298); padding: 30px; box-sizing: border-box; color: white; border-radius: 15px;">
      <h2 style="margin: 0 0 10px 0;">John Doe</h2>
      <p style="margin: 0 0 20px 0; color: #a8c8ec;">Senior Developer</p>
      <p style="margin: 0; font-size: 14px;">📧 john@example.com<br>📱 +1 (555) 123-4567</p>
    </div>
  `,
  css: `
    body { margin: 0; padding: 20px; background: #f0f0f0; }
  `,
  width: 500,
  height: 300,
  format: "png",
  deviceScaleFactor: 2
};

// Chart example with high quality
const chartExample = {
  html: `
    <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.1);">
      <h2 style="text-align: center; margin-bottom: 30px;">Sales Report</h2>
      <div style="display: flex; align-items: end; justify-content: space-between; height: 200px;">
        <div style="display: flex; flex-direction: column; align-items: center;">
          <div style="width: 60px; height: 120px; background: #3b82f6; margin-bottom: 10px;"></div>
          <span>Jan</span>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center;">
          <div style="width: 60px; height: 160px; background: #10b981; margin-bottom: 10px;"></div>
          <span>Feb</span>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center;">
          <div style="width: 60px; height: 180px; background: #f59e0b; margin-bottom: 10px;"></div>
          <span>Mar</span>
        </div>
      </div>
    </div>
  `,
  width: 600,
  height: 400,
  format: "png",
  quality: 95,
  deviceScaleFactor: 2
};

// Function to call the API
async function generateImage(workerUrl, options) {
  try {
    const response = await fetch(`${workerUrl}/html-to-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error('Error generating image:', error);
    throw error;
  }
}

// Usage examples
const WORKER_URL = 'https://your-worker.your-subdomain.workers.dev';

// Generate basic image
generateImage(WORKER_URL, basicExample)
  .then(blob => {
    // Create download link or display image
    const url = URL.createObjectURL(blob);
    console.log('Image generated:', url);
  })
  .catch(console.error);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateImage,
    examples: {
      basic: basicExample,
      businessCard: businessCardExample,
      chart: chartExample
    }
  };
}
