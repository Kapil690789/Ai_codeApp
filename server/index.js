import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
app.use(cors());
app.use(express.json());

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';

// Health-check route for quick status verification
app.get('/api/health', async (req, res) => {
  try {
    await axios.get(`${OLLAMA_HOST}/api/tags`);
    res.json({ 
      status: 'Ollama service is healthy',
      version: '1.0.1', // Added version info
      theme: 'light'    // Default theme setting
    });
  } catch (error) {
    res.status(503).json({ 
      error: 'Ollama service unavailable',
      solution: '1. Ensure Ollama is running\n2. Run: ollama pull tinyllama'
    });
  }
});

// Middleware to check Ollama availability for all subsequent routes
app.use(async (req, res, next) => {
  try {
    await axios.get(`${OLLAMA_HOST}/api/tags`);
    next();
  } catch (error) {
    res.status(503).json({ 
      error: 'Ollama service unavailable',
      solution: '1. Ensure Ollama is running\n2. Run: ollama pull tinyllama'
    });
  }
});

// Helper function to extract markdown code blocks for HTML, CSS, and JS
function extractCodeBlocks(code) {
  const htmlMatch = code.match(/```html\s*([\s\S]*?)```/i);
  const cssMatch = code.match(/```css\s*([\s\S]*?)```/i);
  const jsMatch = code.match(/```(?:javascript|js)\s*([\s\S]*?)```/i);
  return {
    html: htmlMatch ? htmlMatch[1].trim() : '',
    css: cssMatch ? cssMatch[1].trim() : '',
    js: jsMatch ? jsMatch[1].trim() : ''
  };
}

// AI Agent function to interface with Ollama
async function aiAgent(model, prompt, system, agentName) {
  console.log(`[${agentName}] Starting processing...`);
  try {
    const response = await axios.post(`${OLLAMA_HOST}/api/generate`, {
      model,
      prompt,
      system,
      stream: false,
      options: { temperature: 0.7 }
    });
    console.log(`[${agentName}] Processing completed`);
    return response.data.response;
  } catch (error) {
    console.error(`[${agentName}] Error: ${error.message}`);
    throw new Error(`${agentName} failed: ${error.message}`);
  }
}

// Process-request endpoint to handle the complete flow
app.post('/api/process-request', async (req, res) => {
  console.log('\n=== New Request Received ===');
  console.log(`Input: ${req.body.requirement.substring(0, 50)}...`);

  try {
    // Step 1: Analysis via Ollama
    const analysis = await aiAgent(
      'tinyllama',
      `Analyze this homepage requirement: ${req.body.requirement}`,
      'Identify needed sections, features, and security considerations',
      'Analysis Agent'
    );

    // Step 2: Code generation based on the analysis
    const codePrompt = `
Generate a complete landing page (or form) code based on the following analysis:
${analysis}

Please return ONLY the code in three separate markdown code blocks with language labels exactly as follows:
- The first block is the HTML code.
- The second block is the CSS code.
- The third block is the JavaScript code (if not needed, leave it empty).

Do not include any extra commentary or text. The output should strictly be three markdown blocks.

For example:
\`\`\`html
<!-- Your HTML code here -->
\`\`\`
\`\`\`css
/* Your CSS code here */
\`\`\`
\`\`\`javascript
// Your JavaScript code here
\`\`\`
`;
    const code = await aiAgent(
      'tinyllama',
      codePrompt,
      `Include:
      - Bootstrap-compatible HTML structure
      - Responsive, mobile-first CSS styling
      - Form validation or interactivity if applicable
      - Semantic HTML for accessibility`,
      'Code Agent'
    );

    // Step 3: Code validation
    const validation = await aiAgent(
      'tinyllama',
      `Review the following code for security, responsiveness, browser compatibility, and accessibility:
${code}`,
      `Provide a brief summary of any issues and improvements`,
      'Validation Agent'
    );

    // Extract individual code blocks for HTML, CSS, and JS
    const codeBlocks = extractCodeBlocks(code);

    console.log('=== Request Completed Successfully ===\n');
    res.json({ 
      analysis: analysis.trim(),
      html: codeBlocks.html,
      css: codeBlocks.css,
      js: codeBlocks.js,
      validation: validation.trim()
    });
  } catch (error) {
    console.error(`Request Failed: ${error.message}`);
    res.status(500).json({ 
      error: error.message,
      troubleshooting: 'Check Ollama service and model availability'
    });
  }
});

// New endpoint to validate custom code
app.post('/api/validate-code', async (req, res) => {
  try {
    const { html, css, js } = req.body;
    
    // Combined code for validation
    const combinedCode = `
\`\`\`html
${html}
\`\`\`

\`\`\`css 
${css}
\`\`\`

\`\`\`javascript
${js}
\`\`\`
`;

    // Validate the custom code
    const validation = await aiAgent(
      'tinyllama',
      `Review the following code for security, responsiveness, browser compatibility, and accessibility:
${combinedCode}`,
      `Provide a brief summary of any issues and improvements`,
      'Validation Agent'
    );

    res.json({ 
      validation: validation.trim()
    });
  } catch (error) {
    console.error(`Validation Failed: ${error.message}`);
    res.status(500).json({ 
      error: error.message,
      troubleshooting: 'Check Ollama service and model availability'
    });
  }
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`🔗 Ollama endpoint: ${OLLAMA_HOST}`);
  console.log(`⚙️  Test health endpoint: curl http://localhost:${PORT}/api/health\n`);
});
