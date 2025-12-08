"use client";

import "@crayonai/react-ui/styles/index.css";
import { C1Component, ThemeProvider } from "@thesysai/genui-sdk";
import { useState, useRef, useEffect } from "react";

// Data table component
interface DataTableProps {
  data: Array<{
    toolName: string;
    args: Record<string, unknown>;
    data: unknown;
  }>;
}

function DataTable({ data }: DataTableProps) {
  console.log("DataTable received data:", data); // Debug log

  if (!data || data.length === 0) {
    return (
      <div className="mt-8 p-6 bg-gray-100 border border-gray-300 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          📊 Raw Data
        </h3>
        <p className="text-gray-600">
          No data available. Try asking a question about sales, products, or
          customers.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          📊 Raw Data Results
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Below are the actual database query results that were used to generate
          the visualization above.
        </p>
      </div>
      {data.map((item, index) => {
        console.log("Processing item:", item);
        console.log("Item data:", item.data);
        // Handle the data - should now be properly parsed arrays
        let tableData: Record<string, unknown>[] = [];

        if (Array.isArray(item.data)) {
          tableData = item.data as Record<string, unknown>[];
        } else if (item.data && typeof item.data === "object") {
          tableData = [item.data as Record<string, unknown>];
        } else if (typeof item.data === "string") {
          // Fallback: try to parse string data
          try {
            const parsedData = JSON.parse(item.data);
            if (Array.isArray(parsedData)) {
              tableData = parsedData as Record<string, unknown>[];
            } else if (parsedData && typeof parsedData === "object") {
              tableData = [parsedData as Record<string, unknown>];
            }
          } catch (e) {
            console.error("Failed to parse table data:", e);
            return null;
          }
        }

        if (tableData.length === 0) return null;

        // Get column headers from the first row
        const headers = Object.keys(tableData[0] as Record<string, unknown>);

        return (
          <div
            key={index}
            className="bg-white rounded-lg shadow overflow-hidden"
          >
            <div className="px-4 py-3 bg-gray-50 border-b">
              <h4 className="font-medium text-gray-900">
                {item.toolName} Results
              </h4>
              {Object.keys(item.args).length > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  Query: {JSON.stringify(item.args)}
                </p>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {headers.map((header) => (
                      <th
                        key={header}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tableData.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {headers.map((header) => (
                        <td
                          key={header}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                        >
                          {String(
                            (row as Record<string, unknown>)[header] || ""
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [c1Response, setC1Response] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [rawData, setRawData] = useState<
    Array<{
      toolName: string;
      args: Record<string, unknown>;
      data: unknown;
    }>
  >([]);
  const [threadId, setThreadId] = useState<string>("");

  // Initialize thread ID on client side to avoid hydration mismatch
  useEffect(() => {
    setThreadId(crypto.randomUUID());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted with query:", query, "threadId:", threadId);
    if (!query.trim() || isLoading || !threadId) {
      console.log("Form submission blocked:", {
        query: query.trim(),
        isLoading,
        threadId,
      });
      return;
    }

    setIsLoading(true);
    setC1Response("");
    setRawData([]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: {
            role: "user",
            content: query,
            id: crypto.randomUUID(),
          },
          threadId: threadId,
          responseId: crypto.randomUUID(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      if (!reader) return;

      let accumulatedResponse = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        accumulatedResponse += chunk;

        // Check if this chunk contains raw data
        if (chunk.includes("__RAW_DATA__")) {
          const startIndex = accumulatedResponse.indexOf("__RAW_DATA__");
          const endIndex = accumulatedResponse.indexOf("__END_RAW_DATA__");

          if (startIndex !== -1 && endIndex !== -1) {
            const rawDataString = accumulatedResponse.substring(
              startIndex + "__RAW_DATA__".length,
              endIndex
            );

            try {
              const parsedRawData = JSON.parse(rawDataString);
              console.log("Parsed raw data:", parsedRawData); // Debug log
              console.log(
                "Setting raw data state with:",
                parsedRawData.length,
                "items"
              ); // Debug log
              setRawData(parsedRawData);
              // Remove raw data from the response for display
              accumulatedResponse =
                accumulatedResponse.substring(0, startIndex) +
                accumulatedResponse.substring(
                  endIndex + "__END_RAW_DATA__".length
                );
            } catch (error) {
              console.error("Failed to parse raw data:", error);
            }
          }
        }

        setC1Response(accumulatedResponse);
      }
      // Clear the query on successful completion
      setQuery("");
    } catch (error) {
      console.error("Error:", error);
      setC1Response(
        `Sorry, there was an error processing your request: ${error}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about sales data, products, or customers (e.g., 'Show me sales by category')"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!query.trim() || isLoading || !threadId}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Loading..." : "Submit"}
            </button>
          </div>
        </form>

        <ThemeProvider mode="light">
          <C1Component
            c1Response={c1Response}
            isStreaming={isLoading}
            updateMessage={(message) => {
              setC1Response(message);
            }}
            onAction={({ llmFriendlyMessage }) => {
              if (!isLoading && llmFriendlyMessage) {
                setQuery(llmFriendlyMessage);
              }
            }}
          />
        </ThemeProvider>

        {/* Display raw data table */}
        {rawData.length > 0 && (
          <div className="mt-8">
            <DataTable data={rawData} />
          </div>
        )}
      </div>
    </div>
  );
}
