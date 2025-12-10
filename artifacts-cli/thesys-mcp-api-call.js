/**
 * Thesys MCP API Client
 *
 * HTTP client for Thesys MCP (Model Context Protocol) server.
 * Generates and edits slides/reports via JSON-RPC 2.0 over HTTPS.
 *
 * Required: THESYS_API_KEY environment variable
 *
 * Exports: generateSlides, editSlides, generateReport, editReport
 * Returns: { content: [{ text: string }] }
 *   - Create responses: text contains "generationId: <id>"
 *   - Edit responses: text contains "I've updated"
 */

const https = require("https");

const MCP_URL = "https://api.thesys.dev/mcp";
const THESYS_API_KEY = process.env.THESYS_API_KEY;

if (!THESYS_API_KEY) {
  console.error("Error: THESYS_API_KEY environment variable is required");
  process.exit(1);
}

/**
 * Send JSON-RPC 2.0 request to MCP server.
 * @param {string} method - RPC method (e.g., "tools/call")
 * @param {Object} params - Method parameters
 * @returns {Promise<Object>} - Response result field
 * @throws {Error} - On MCP error or parse failure
 */
async function mcpRequest(method, params = {}) {
  const url = new URL(MCP_URL);

  const payload = JSON.stringify({
    jsonrpc: "2.0",
    id: Date.now(),
    method,
    params,
  });

  const options = {
    hostname: url.hostname,
    port: 443,
    path: url.pathname,
    method: "POST",
    headers: {
      Authorization: `Bearer ${THESYS_API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      "Content-Length": Buffer.byteLength(payload),
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const response = JSON.parse(data);
          if (response.error) {
            reject(
              new Error(
                `MCP Error: ${
                  response.error.message || JSON.stringify(response.error)
                }`
              )
            );
          } else {
            resolve(response.result);
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

/**
 * Invoke an MCP tool by name.
 * @param {string} name - Tool name (generateSlides, editSlides, generateReport, editReport)
 * @param {Object} args - Tool-specific arguments
 */
async function callTool(name, args = {}) {
  return mcpRequest("tools/call", { name, arguments: args });
}

/**
 * Create new slides artifact.
 * @param {string} title - Slide deck title
 * @param {string} description - Brief description of the slides
 * @param {string} prompt - Detailed content/structure instructions
 */
async function generateSlides(title, description, prompt) {
  return callTool("generateSlides", { title, description, prompt });
}

/**
 * Modify existing slides artifact.
 * @param {string} generationId - ID from previous generateSlides/editSlides response
 * @param {string} prompt - Edit instructions (e.g., "Change slide 3 to a pie chart")
 */
async function editSlides(generationId, prompt) {
  return callTool("editSlides", { generationId, prompt });
}

/**
 * Create new report artifact.
 * @param {string} title - Report title
 * @param {string} description - Brief description of the report
 * @param {string} prompt - Detailed content/structure instructions
 */
async function generateReport(title, description, prompt) {
  return callTool("generateReport", { title, description, prompt });
}

/**
 * Modify existing report artifact.
 * @param {string} generationId - ID from previous generateReport/editReport response
 * @param {string} prompt - Edit instructions
 */
async function editReport(generationId, prompt) {
  return callTool("editReport", { generationId, prompt });
}

module.exports = {
  generateSlides,
  editSlides,
  generateReport,
  editReport,
};
