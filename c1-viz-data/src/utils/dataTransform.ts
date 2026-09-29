/**
 * Data Transformation Utilities
 * Functions to normalize and enrich data for display
 */

/**
 * Normalizes various data formats into a consistent array of records
 */
export function normalizeTableData(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) {
    return data as Record<string, unknown>[];
  } else if (data && typeof data === "object") {
    return [data as Record<string, unknown>];
  } else if (typeof data === "string") {
    try {
      const parsedData = JSON.parse(data);
      if (Array.isArray(parsedData)) {
        return parsedData as Record<string, unknown>[];
      } else if (parsedData && typeof parsedData === "object") {
        return [parsedData as Record<string, unknown>];
      }
    } catch (e) {
      console.error("Failed to parse table data:", e);
    }
  }
  return [];
}

/**
 * Enriches data rows with source information (tool name and query args)
 */
export function enrichDataWithSource(
  data: Record<string, unknown>[],
  toolName: string,
  args: Record<string, unknown>
): Record<string, unknown>[] {
  return data.map((row) => ({
    ...row,
    _source: toolName,
    _query: JSON.stringify(args),
  }));
}

