/**
 * Raw Data Parser Utility
 * Extracts raw data from streaming responses
 */

export interface RawDataItem {
  toolName: string;
  args: Record<string, unknown>;
  data: unknown;
}

export interface ParsedRawData {
  rawData: RawDataItem[];
  cleanedResponse: string;
}

/**
 * Extracts raw data from accumulated response stream
 * Looks for __RAW_DATA__ markers and parses JSON data
 */
export function extractRawDataFromStream(
  chunk: string,
  accumulatedResponse: string
): ParsedRawData | null {
  // Check if this chunk contains raw data markers
  if (!chunk.includes("__RAW_DATA__")) {
    return null;
  }

  const startIndex = accumulatedResponse.indexOf("__RAW_DATA__");
  const endIndex = accumulatedResponse.indexOf("__END_RAW_DATA__");

  if (startIndex === -1 || endIndex === -1) {
    return null;
  }

  const rawDataString = accumulatedResponse.substring(
    startIndex + "__RAW_DATA__".length,
    endIndex
  );

  try {
    const parsedRawData = JSON.parse(rawDataString) as RawDataItem[];
    console.log("Parsed raw data:", parsedRawData);
    console.log(
      "Setting raw data state with:",
      parsedRawData.length,
      "items"
    );

    // Remove raw data from the response for display
    const cleanedResponse =
      accumulatedResponse.substring(0, startIndex) +
      accumulatedResponse.substring(endIndex + "__END_RAW_DATA__".length);

    return {
      rawData: parsedRawData,
      cleanedResponse,
    };
  } catch (error) {
    console.error("Failed to parse raw data:", error);
    return null;
  }
}

