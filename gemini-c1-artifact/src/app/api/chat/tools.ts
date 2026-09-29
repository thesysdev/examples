import { Type, FunctionDeclaration } from "@google/genai";

export const createArtifactDeclaration: FunctionDeclaration = {
  name: "create_artifact",
  description:
    "Creates a new artifact (presentation slides or report document) based on user instructions. Use this when the user asks you to create, generate, or make a presentation, slides, deck, report, or document.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      instructions: {
        type: Type.STRING,
        description:
          "Detailed instructions for generating the artifact content. Include all relevant information the user provided.",
      },
      artifactType: {
        type: Type.STRING,
        description:
          "The type of artifact to create: 'slides' for presentations/decks, 'report' for documents/reports.",
        enum: ["slides", "report"],
      },
    },
    required: ["instructions", "artifactType"],
  },
};

export const editArtifactDeclaration: FunctionDeclaration = {
  name: "edit_artifact",
  description:
    "Edits an existing artifact based on user instructions. Use this when the user wants to modify, update, change, or edit an artifact that was previously created.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      artifactId: {
        type: Type.STRING,
        description: "The ID of the artifact to edit.",
      },
      version: {
        type: Type.STRING,
        description: "The version (message ID) of the artifact to edit.",
      },
      instructions: {
        type: Type.STRING,
        description:
          "Instructions for how to modify the artifact. Be specific about what changes to make.",
      },
    },
    required: ["artifactId", "version", "instructions"],
  },
};

export const toolDeclarations = [
  createArtifactDeclaration,
  editArtifactDeclaration,
];
