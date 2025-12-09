import { DataTable, RawDataItem } from "./DataTable";

interface RawDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: RawDataItem[];
}

export function RawDataModal({ isOpen, onClose, data }: RawDataModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-2xl font-bold text-gray-900">
            📊 Raw Data Results
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto flex-1 p-6">
          <DataTable data={data} />
        </div>
      </div>
    </div>
  );
}

