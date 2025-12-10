const {
  generateSlides,
  editSlides,
  generateReport,
  editReport,
} = require("./thesys-mcp-api-call");

// Helper to extract generationId from response
function getGenerationId(result) {
  const text = result?.content?.[0]?.text || "";
  const match = text.match(/generationId:\s*(\S+)/);
  return match?.[1]?.replace(/,\s*$/, "");
}

// Helper to sleep
function sleep(ms) {
  console.log(`Sleeping for ${ms / 1000} seconds...`);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Helper to check if edit was successful
function assertEditSuccess(result, type) {
  const text = result?.content?.[0]?.text || "";
  if (!text.includes("I've updated")) {
    throw new Error(`Edit ${type} failed. Response: ${text}`);
  }
  console.log(`✓ Edit ${type} successful`);
}

// Test cases
async function testSlides() {
  console.log("=== Test: generateSlides ===");
  const createResult = await generateSlides(
    "Node.js Basics",
    "An introduction to Node.js",
    "Create a 1-slide presentation about what Node.js is"
  );
  console.log("Result:", JSON.stringify(createResult, null, 2));

  const generationId = getGenerationId(createResult);
  await sleep(30000);

  console.log("\n=== Test: editSlides ===");
  console.log("Using generationId:", generationId);
  const editResult = await editSlides(
    generationId,
    "Add a second slide about npm package manager"
  );
  console.log("Result:", JSON.stringify(editResult, null, 2));
  assertEditSuccess(editResult, "slides");
}

async function testReport() {
  console.log("=== Test: generateReport ===");
  const createResult = await generateReport(
    "Q4 Sales Report",
    "Quarterly sales analysis",
    "Create a 1-page report with an executive summary"
  );
  console.log("Result:", JSON.stringify(createResult, null, 2));

  const generationId = getGenerationId(createResult);
  await sleep(30000);

  console.log("\n=== Test: editReport ===");
  console.log("Using generationId:", generationId);
  const editResult = await editReport(
    generationId,
    "Add a section about sales by region with a bar chart"
  );
  console.log("Result:", JSON.stringify(editResult, null, 2));
  assertEditSuccess(editResult, "report");
}

async function runAllTests() {
  try {
    await testSlides();
    console.log("\n---\n");
    await testReport();
    console.log("\n=== All tests completed ===");
  } catch (error) {
    console.error("Test failed:", error.message);
  }
}

// CLI: node thesys-mcp-api-call.test.js [test]
const testArg = process.argv[2];

switch (testArg) {
  case "slides":
    testSlides();
    break;
  case "report":
    testReport();
    break;
  default:
    runAllTests();
}
