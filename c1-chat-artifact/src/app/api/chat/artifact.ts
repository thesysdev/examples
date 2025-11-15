import OpenAI from "openai";
import { makeC1Response } from "@thesysai/genui-sdk/server";
import { nanoid } from "nanoid";

// Artifact handlers

/**
 * Creates a new artifact (presentation or report)
 */
export async function handleCreateArtifact(
    instructions: string,
    artifactType: "slides" | "report",
    artifactsClient: OpenAI,
    c1Response: ReturnType<typeof makeC1Response>,
    messageId: string
  ): Promise<string> {
    const artifactId = nanoid(10);
  
    const artifactStream = await artifactsClient.chat.completions.create({
      model: "c1/artifact/v-20251030",
      messages: [{ role: "user", content: instructions }],
      metadata: {
        thesys: JSON.stringify({
          c1_artifact_type: artifactType,
          id: artifactId,
        }),
      },
      stream: true,
    });
  
    // Stream artifact content
    for await (const delta of artifactStream) {
      const content = delta.choices[0]?.delta?.content;
      if (content) {
        c1Response.writeContent(content);
      }
    }
  
    return `${artifactType === "slides" ? "Presentation" : "Report"} created with artifact_id: ${artifactId}, version: ${messageId}`;
  }
  
  /**
   * Edits an existing artifact
   */
  export async function handleEditArtifact(
    artifactId: string,
    version: string,
    instructions: string,
    getMessageContent: (version: string) => Promise<string>,
    artifactsClient: OpenAI,
    c1Response: ReturnType<typeof makeC1Response>,
    newMessageId: string
  ): Promise<string> {
    // Get old message content
    const messageContent = await getMessageContent(version);
  
    if (!messageContent) {
      throw new Error(`Could not find message with version: ${version}`);
    }
  
    // Determine artifact type
    const artifactType = messageContent.includes('type="report"') ? "report" : "slides";
  
    // Call C1 Artifacts API in edit mode
    const artifactStream = await artifactsClient.chat.completions.create({
      model: "c1/artifact/v-20251030",
      messages: [
        { role: "assistant", content: messageContent },
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
  
    // Stream updated artifact
    for await (const delta of artifactStream) {
      const content = delta.choices[0]?.delta?.content;
      if (content) {
        c1Response.writeContent(content);
      }
    }
  
    return `${artifactType === "slides" ? "Presentation" : "Report"} edited successfully. artifact_id: ${artifactId}, version: ${newMessageId}`;
  }
  