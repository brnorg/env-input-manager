
import React from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

interface EnvironmentFormProps {
  newEnvName: string;
  setNewEnvName: (name: string) => void;
  onAddEnvironment: (e: React.FormEvent) => void;
  onDownloadTemplate: () => void;
  hasEnvironments: boolean;
}

const EnvironmentForm = ({
  newEnvName,
  setNewEnvName,
  onAddEnvironment,
  onDownloadTemplate,
  hasEnvironments
}: EnvironmentFormProps) => {
  return (
    <form onSubmit={onAddEnvironment} className="mb-12 flex justify-center gap-4">
      <input
        type="text"
        value={newEnvName}
        onChange={(e) => setNewEnvName(e.target.value)}
        placeholder="Enter environment name"
        className="px-4 py-2 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
      />
      <button
        type="submit"
        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
      >
        <Plus size={20} /> Add Environment
      </button>
      {hasEnvironments && (
        <button
          type="button"
          onClick={onDownloadTemplate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Save Template
        </button>
      )}
    </form>
  );
};

export default EnvironmentForm;
