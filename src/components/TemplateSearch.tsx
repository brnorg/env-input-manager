
import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

interface Template {
  name: string;
  structure: {
    [key: string]: {
      vars: { [key: string]: string };
      secrets: { [key: string]: string };
    };
  };
}

interface TemplateSearchProps {
  onSelectTemplate: (template: Template) => void;
  currentStructure: any;
}

const TemplateSearch = ({ onSelectTemplate, currentStructure }: TemplateSearchProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    // Em um ambiente real, você precisaria implementar um backend
    // para ler os arquivos do diretório /templates
    // Por enquanto, deixaremos um comentário indicando onde os templates devem estar
    console.log('Templates should be placed in the /templates directory at the root of the project');
    setTemplates([]);
  }, []);

  const filteredTemplates = templates.filter(template => 
    template.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const downloadTemplate = () => {
    const templateStr = JSON.stringify(currentStructure, null, 2);
    const blob = new Blob([templateStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'templates/environment-template.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setShowTemplates(true)}
          placeholder="Search templates in /templates directory..."
          className="w-full px-4 py-2 pl-10 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
        />
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
      </div>

      {showTemplates && (
        <div className="absolute z-10 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-100 max-h-60 overflow-y-auto">
          {filteredTemplates.map((template, index) => (
            <button
              key={index}
              onClick={() => {
                onSelectTemplate(template);
                setShowTemplates(false);
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors"
            >
              {template.name}
            </button>
          ))}
          {filteredTemplates.length === 0 && (
            <div className="px-4 py-2 text-gray-500">No templates found in /templates directory</div>
          )}
        </div>
      )}
    </div>
  );
};

export default TemplateSearch;
