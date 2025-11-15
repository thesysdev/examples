import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { RunnableToolFunctionWithParse } from "openai/lib/RunnableFunction.mjs";

export const createPresentationTool: RunnableToolFunctionWithParse<any> = {
  type: "function",
  function: {
    name: "create_presentation",
    description: "Creates a slide presentation based on user instructions.",
    parse: JSON.parse,
    parameters: zodToJsonSchema(
      z.object({
        instructions: z
          .string()
          .describe("The instructions to generate the presentation."),
      })
    ) as any,
    function: async () => {
      // This is a placeholder - actual implementation happens in the route handler
      return "Tool function placeholder";
    },
  },
};

export const createReportTool: RunnableToolFunctionWithParse<any> = {
  type: "function",
  function: {
    name: "create_report",
    description: "Creates a comprehensive report document based on user instructions.",
    parse: JSON.parse,
    parameters: zodToJsonSchema(
      z.object({
        instructions: z
          .string()
          .describe("The instructions to generate the report."),
      })
    ) as any,
    function: async () => {
      // This is a placeholder - actual implementation happens in the route handler
      return "Tool function placeholder";
    },
  },
};

export const editPresentationTool: RunnableToolFunctionWithParse<any> = {
  type: "function",
  function: {
    name: "edit_presentation",
    description: "Edits an existing slide presentation.",
    parse: JSON.parse,
    parameters: zodToJsonSchema(
      z.object({
        artifactId: z.string().describe("The ID of the artifact to edit."),
        version: z
          .string()
          .describe("The version (messageId) of the artifact to edit."),
        instructions: z
          .string()
          .describe("The user's instructions for what to change."),
      })
    ) as any,
    function: async () => {
      // This is a placeholder - actual implementation happens in the route handler
      return "Tool function placeholder";
    },
  },
};

export const editReportTool: RunnableToolFunctionWithParse<any> = {
  type: "function",
  function: {
    name: "edit_report",
    description: "Edits an existing report document.",
    parse: JSON.parse,
    parameters: zodToJsonSchema(
      z.object({
        artifactId: z.string().describe("The ID of the artifact to edit."),
        version: z
          .string()
          .describe("The version (messageId) of the artifact to edit."),
        instructions: z
          .string()
          .describe("The user's instructions for what to change."),
      })
    ) as any,
    function: async () => {
      // This is a placeholder - actual implementation happens in the route handler
      return "Tool function placeholder";
    },
  },
};

export const tools = [
  createPresentationTool,
  createReportTool,
  editPresentationTool,
  editReportTool,
];

