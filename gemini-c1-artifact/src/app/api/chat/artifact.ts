/**
 * Artifact generation handlers for the C1 Artifacts API.
 *
 * This module provides functions to create and edit artifacts (presentations
 * and reports) using the Thesys C1 API via an OpenAI-compatible client.
 */

import OpenAI from "openai";
import { nanoid } from "nanoid";
import { C1_ARTIFACT_MODEL } from "./constants";

/** Callback function for streaming artifact content chunks */
type ArtifactWriter = (content: string) => void;

/**
 * Creates a new artifact (presentation or report) using the C1 Artifacts API.
 *
 * Streams the generated artifact content through the provided writer callback,
 * allowing real-time rendering as the artifact is being generated.
 *
 * @param instructions - Detailed instructions for generating the artifact content
 * @param artifactType - The type of artifact: "slides" for presentations, "report" for documents
 * @param artifactsClient - OpenAI client configured for the C1 Artifacts API
 * @param writeArtifact - Callback to stream artifact content chunks to the client
 * @param messageId - The message ID to associate with this artifact version
 * @returns A message confirming creation with artifact ID and version
 */
export async function handleCreateArtifact(
  instructions: string,
  artifactType: "slides" | "report",
  artifactsClient: OpenAI,
  writeArtifact: ArtifactWriter,
  messageId: string
): Promise<string> {
  const artifactId = nanoid(10);
  const successMessage = `${
    artifactType === "slides" ? "Presentation" : "Report"
  } created successfully with artifact_id: ${artifactId}, version: ${messageId}`;

  try {
    const artifactStream = await artifactsClient.chat.completions.create({
      model: C1_ARTIFACT_MODEL,
      messages: [{ role: "user", content: instructions }],
      metadata: {
        thesys: JSON.stringify({
          c1_artifact_type: artifactType,
          id: artifactId,
        }),
      },
      stream: true,
    });

    // Stream artifact content chunks to the client
    for await (const delta of artifactStream) {
      const content = delta.choices[0]?.delta?.content;
      if (content) {
        writeArtifact(content);
      }
    }
  } catch (error) {
    console.error("Error streaming artifact:", error);
    writeArtifact("\n\n[Error creating artifact]");
  }

  return successMessage;
}

/**
 * Edits an existing artifact using the C1 Artifacts API.
 *
 * Retrieves the previous artifact content by version, then sends it along with
 * edit instructions to generate an updated version. The artifact type is
 * automatically detected from the existing content.
 *
 * @param artifactId - The ID of the artifact to edit
 * @param version - The version (message ID) of the artifact to edit
 * @param instructions - Instructions describing the desired changes
 * @param getMessageContent - Function to retrieve the previous artifact content by version
 * @param artifactsClient - OpenAI client configured for the C1 Artifacts API
 * @param writeArtifact - Callback to stream updated artifact content chunks to the client
 * @param newMessageId - The message ID to associate with this new artifact version
 * @returns A message confirming the edit with artifact ID and new version
 * @throws Error if the previous artifact content cannot be found
 */
export async function handleEditArtifact(
  artifactId: string,
  version: string,
  instructions: string,
  getMessageContent: (version: string) => Promise<string | null>,
  artifactsClient: OpenAI,
  writeArtifact: ArtifactWriter,
  newMessageId: string
): Promise<string> {
  // Retrieve the previous artifact content by version
  const previousContent = await getMessageContent(version);

  if (!previousContent) {
    throw new Error(`Could not find artifact with version: ${version}`);
  }

  // Auto-detect artifact type from the content markup
  const artifactType = previousContent.includes('type="report"')
    ? "report"
    : "slides";

  try {
    const artifactStream = await artifactsClient.chat.completions.create({
      model: C1_ARTIFACT_MODEL,
      messages: [
        { role: "assistant", content: previousContent },
        { role: "user", content: instructions },
      ],
      metadata: {
        thesys: JSON.stringify({
          c1_artifact_type: artifactType,
          id: artifactId,
        }),
      },
      stream: true,
    });

    // Stream updated artifact content chunks to the client
    for await (const delta of artifactStream) {
      const content = delta.choices[0]?.delta?.content;
      if (content) {
        writeArtifact(content);
      }
    }
  } catch (error) {
    console.error("Error streaming artifact:", error);
    writeArtifact("\n\n[Error editing artifact]");
  }

  return `${
    artifactType === "slides" ? "Presentation" : "Report"
  } edited successfully. artifact_id: ${artifactId}, version: ${newMessageId}`;
}
