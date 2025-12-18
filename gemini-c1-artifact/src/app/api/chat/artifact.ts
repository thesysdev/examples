import OpenAI from "openai";
import { nanoid } from "nanoid";

// Type for the artifact writer function
type ArtifactWriter = (content: string) => void;

/**
 * Creates a new artifact (presentation or report) using the C1 Artifacts API
 */
export async function handleCreateArtifact(
  instructions: string,
  artifactType: "slides" | "report",
  artifactsClient: OpenAI,
  writeArtifact: ArtifactWriter,
  messageId: string
): Promise<string> {
  const artifactId = nanoid(10);

  try {
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
        writeArtifact(content);
      }
    }
  } catch (error) {
    console.error("Error streaming artifact:", error);
    writeArtifact("\n\n[Error creating artifact]");
  }

  return `${
    artifactType === "slides" ? "Presentation" : "Report"
  } created successfully with artifact_id: ${artifactId}, version: ${messageId}`;
}

/**
 * Edits an existing artifact using the C1 Artifacts API
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
  // Get the previous artifact content
  const messageContent = await getMessageContent(version);

  if (!messageContent) {
    throw new Error(`Could not find artifact with version: ${version}`);
  }

  // Determine artifact type from the content
  const artifactType = messageContent.includes('type="report"')
    ? "report"
    : "slides";

  try {
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

    // Stream updated artifact content
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
