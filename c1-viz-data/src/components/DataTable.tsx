import { exportToCSV } from "@/src/utils/csvExport";
import { normalizeTableData, enrichDataWithSource } from "@/src/utils/dataTransform";

export interface RawDataItem {
  toolName: string;
  args: Record<string, unknown>;
  data: unknown;
}

interface DataTableProps {
  data: RawDataItem[];
}

export function DataTable({ data }: DataTableProps) {
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

  const handleExportAll = () => {
    const allData: Record<string, unknown>[] = [];
    data.forEach((item) => {
      const tableData = normalizeTableData(item.data);
      const enrichedData = enrichDataWithSource(
        tableData,
        item.toolName,
        item.args
      );
      allData.push(...enrichedData);
    });

    if (allData.length > 0) {
      exportToCSV(
        allData,
        `all_data_${new Date().toISOString().split("T")[0]}`
      );
    }
  };

  return (
    <div className="mt-8 space-y-6">
      <div className="border-t border-gray-200 pt-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              📊 Raw Data Results
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Below are the actual database query results that were used to
              generate the visualization above.
            </p>
          </div>
          <button
            onClick={handleExportAll}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            title="Export all data to a single CSV file"
          >
            📊 Export All CSV
          </button>
        </div>
      </div>
      {data.map((item, index) => {
        console.log("Processing item:", item);
        console.log("Item data:", item.data);

        const tableData = normalizeTableData(item.data);

        if (tableData.length === 0) return null;

        // Get column headers from the first row
        const headers = Object.keys(tableData[0] as Record<string, unknown>);

        const handleExportSingle = () => {
          exportToCSV(
            tableData,
            `${item.toolName}_data_${
              new Date().toISOString().split("T")[0]
            }`
          );
        };

        return (
          <div
            key={index}
            className="bg-white rounded-lg shadow overflow-hidden"
          >
            <div className="px-4 py-3 bg-gray-50 border-b flex justify-between items-center">
              <div>
                <h4 className="font-medium text-gray-900">
                  {item.toolName} Results
                </h4>
                {Object.keys(item.args).length > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    Query: {JSON.stringify(item.args)}
                  </p>
                )}
              </div>
              <button
                onClick={handleExportSingle}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                title="Export to CSV"
              >
                📊 Export CSV
              </button>
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

