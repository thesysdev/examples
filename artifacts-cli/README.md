# artifacts-cli

Example of calling Thesys API to generate slides and reports hosted at render.thesys.dev. No MCP infrastructure required - just HTTP requests.

## Setup

```bash
export THESYS_API_KEY=your_api_key
```

## Usage

```javascript
const {
  generateSlides,
  generateReport,
  editSlides,
  editReport,
} = require("./thesys-mcp-api-call");

const result = await generateSlides(
  "Title",
  "Description",
  "Create 5 slides about X"
);
// result.content[0].text contains generationId

await editSlides(generationId, "Add a pie chart to slide 2");
```

## Files

- `thesys-mcp-api-call.js` - API client (the main example)
- `cli.js` - Interactive CLI example
- `thesys-mcp-api-call.test.js` - Integration tests

## Example CLI

```bash
npm start
```

## Tests

```bash
npm test
```
