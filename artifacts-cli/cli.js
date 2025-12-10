#!/usr/bin/env node

const readline = require("readline");
const { generateSlides, generateReport } = require("./thesys-mcp-api-call");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

function printHeader() {
  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║     Thesys Artifact Generator CLI        ║");
  console.log("╚══════════════════════════════════════════╝\n");
}

async function main() {
  printHeader();

  try {
    // Ask for artifact type
    console.log("What would you like to create?");
    console.log("  1) Report");
    console.log("  2) Slides\n");

    let type;
    while (!type) {
      const choice = await prompt("Enter your choice (1 or 2): ");
      if (choice === "1") {
        type = "report";
      } else if (choice === "2") {
        type = "slides";
      } else {
        console.log("Invalid choice. Please enter 1 or 2.");
      }
    }

    // Ask for number of pages/slides
    const countLabel = type === "report" ? "pages" : "slides";
    let count;
    while (!count) {
      const input = await prompt(`Number of ${countLabel}: `);
      const num = parseInt(input, 10);
      if (num > 0 && num <= 50) {
        count = num;
      } else {
        console.log("Please enter a valid number between 1 and 50.");
      }
    }

    // Ask for title
    let title;
    while (!title) {
      title = await prompt("Title: ");
      if (!title) {
        console.log("Title cannot be empty.");
      }
    }

    // Ask for description
    let description;
    while (!description) {
      description = await prompt("Short description: ");
      if (!description) {
        console.log("Description cannot be empty.");
      }
    }

    rl.close();

    // Build the prompt with count information
    const fullPrompt = `Create a ${count}-${
      countLabel === "pages" ? "page" : "slide"
    } ${type} about: ${description}`;

    console.log("\n⏳ Generating your " + type + "...\n");

    let result;
    if (type === "report") {
      result = await generateReport(title, description, fullPrompt);
    } else {
      result = await generateSlides(title, description, fullPrompt);
    }

    console.log("✅ Success!\n");

    // Parse and display the result
    if (result && result.content) {
      for (const item of result.content) {
        if (item.type === "text") {
          console.log(item.text);
        }
      }
    } else {
      console.log("Result:", JSON.stringify(result, null, 2));
    }

    console.log("");
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    rl.close();
    process.exit(1);
  }
}

main();
