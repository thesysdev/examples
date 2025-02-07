import { parse } from "best-effort-json-parser";

// Define the types for the data flowing through the stream
type InputType = string; // Change this to match your input type
type OutputType = string; // Change this to match your output type

function escapeString(s: string) {
  return s.replaceAll('"', '\\"').replaceAll("\n", "\\n");
}

function encodeTextPartForSSE(text: string) {
  return `0:${escapeString(text)}\n`;
}

function encodeResponseTemplateForSSE(template: object) {
  return `1:${escapeString(JSON.stringify(template))}\n`;
}

export class CrayonDataStreamTransformer
  implements TransformStream<InputType, OutputType>
{
  readonly readable: ReadableStream<OutputType>;
  readonly writable: WritableStream<InputType>;

  constructor(opts?: {
    onFinish: (
      controller: TransformStreamDefaultController<OutputType>
    ) => Promise<void>;
  }) {
    let streamedContent = "";
    const transform = new TransformStream({
      transform: async (
        content: InputType,
        controller: TransformStreamDefaultController<OutputType>
      ) => {
        try {
          const previousParsed = parse(streamedContent);
          streamedContent += content;
          const parsed = parse(streamedContent);

          if (previousParsed.response && parsed.response) {
            if (previousParsed.response.length === parsed.response.length) {
              const newContent = parsed.response.pop();
              const lastContent = previousParsed.response.pop();
              if (typeof newContent === "string") {
                const textPart = newContent.substring(lastContent.length);
                if (textPart.length > 0) {
                  controller.enqueue(encodeTextPartForSSE(textPart));
                }
              }
            } else {
              const lastTemplate = previousParsed.response.pop();
              if (typeof lastTemplate === "object") {
                controller.enqueue(encodeResponseTemplateForSSE(lastTemplate));
              }

              const newContent = parsed.response.pop();

              if (typeof newContent === "string") {
                controller.enqueue(encodeTextPartForSSE(newContent));
              }
            }
          }
        } catch (error) {
          controller.error(error);
        }
      },

      flush: async (
        controller: TransformStreamDefaultController<OutputType>
      ) => {
        const parsed = parse(streamedContent);
        if (
          parsed.response &&
          typeof parsed.response[parsed.response.length - 1] === "object"
        ) {
          const lastTemplate = parsed.response.pop();
          controller.enqueue(encodeResponseTemplateForSSE(lastTemplate));
        }
        await opts?.onFinish(controller);
      },
    });

    this.readable = transform.readable;
    this.writable = transform.writable;
  }
}
