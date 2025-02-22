
import React from 'react';
import { X } from 'lucide-react';

interface EnvironmentInfoProps {
  environmentInfo: any;
  onClose: () => void;
}

const EnvironmentInfo = ({ environmentInfo, onClose }: EnvironmentInfoProps) => {
  return (
    <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-medium text-gray-900">Repository Environments</h2>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 transition-all"
        >
          <X size={20} />
        </button>
      </div>
      <div className="grid gap-6">
        {environmentInfo?.environments?.map((env: any) => (
          <div key={env.name} className="border border-gray-100 rounded-lg p-4">
            <h3 className="text-xl font-medium text-gray-800 mb-4">{env.name}</h3>
            
            <div className="grid gap-4">
              {env.variables && env.variables.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium text-gray-700 mb-2">Variables</h4>
                  <div className="grid gap-2">
                    {env.variables.map((variable: any) => (
                      <div key={variable.name} className="bg-gray-50 p-3 rounded">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-700">{variable.name}</span>
                          <span className="text-gray-600">{variable.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {env.secrets && env.secrets.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium text-gray-700 mb-2">Secrets</h4>
                  <div className="grid gap-2">
                    {env.secrets.map((secret: any) => (
                      <div key={secret.name} className="bg-gray-50 p-3 rounded">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-700">{secret.name}</span>
                          <span className="text-gray-500 text-sm italic">Protected</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!env.variables || env.variables.length === 0) && 
               (!env.secrets || env.secrets.length === 0) && (
                <p className="text-gray-500">No variables or secrets found for this environment.</p>
              )}
            </div>
          </div>
        ))}

        {(!environmentInfo?.environments || environmentInfo.environments.length === 0) && (
          <p className="text-gray-500">No environments found in this repository.</p>
        )}
      </div>
    </div>
  );
};

export default EnvironmentInfo;
