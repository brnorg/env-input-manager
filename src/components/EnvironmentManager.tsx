
import React, { useState } from 'react';
import { Plus, X, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface KeyValue {
  key: string;
  value: string;
}

interface Environment {
  name: string;
  vars: KeyValue[];
  secrets: KeyValue[];
}

const EnvironmentManager = () => {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [newEnvName, setNewEnvName] = useState('');
  const [showSecrets, setShowSecrets] = useState<{ [key: string]: boolean }>({});

  const addEnvironment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEnvName.trim()) {
      toast.error('Please enter an environment name');
      return;
    }
    if (environments.some(env => env.name === newEnvName)) {
      toast.error('Environment already exists');
      return;
    }
    setEnvironments([...environments, { name: newEnvName, vars: [], secrets: [] }]);
    setNewEnvName('');
    toast.success('Environment added successfully');
  };

  const removeEnvironment = (name: string) => {
    setEnvironments(environments.filter(env => env.name !== name));
    toast.success('Environment removed');
  };

  const addKeyValue = (envIndex: number, type: 'vars' | 'secrets') => {
    const newEnvironments = [...environments];
    newEnvironments[envIndex][type].push({ key: '', value: '' });
    setEnvironments(newEnvironments);
  };

  const updateKeyValue = (
    envIndex: number,
    type: 'vars' | 'secrets',
    kvIndex: number,
    field: 'key' | 'value',
    value: string
  ) => {
    const newEnvironments = [...environments];
    newEnvironments[envIndex][type][kvIndex][field] = value;
    setEnvironments(newEnvironments);
  };

  const removeKeyValue = (envIndex: number, type: 'vars' | 'secrets', kvIndex: number) => {
    const newEnvironments = [...environments];
    newEnvironments[envIndex][type].splice(kvIndex, 1);
    setEnvironments(newEnvironments);
  };

  const toggleSecretVisibility = (envName: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [envName]: !prev[envName]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-light text-gray-900 mb-8 text-center">Environment Manager</h1>
        
        {/* Add Environment Form */}
        <form onSubmit={addEnvironment} className="mb-12 flex justify-center gap-4">
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
        </form>

        {/* Environments List */}
        <div className="grid gap-8 animate-fade-in">
          {environments.map((env, envIndex) => (
            <div
              key={env.name}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md"
            >
              <div className="flex justify-between items-center p-6 border-b border-gray-100">
                <h2 className="text-2xl font-medium text-gray-900">{env.name}</h2>
                <button
                  onClick={() => removeEnvironment(env.name)}
                  className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 grid gap-8">
                {/* Variables Section */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-700">Variables</h3>
                    <button
                      onClick={() => addKeyValue(envIndex, 'vars')}
                      className="text-sm px-3 py-1 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors inline-flex items-center gap-1"
                    >
                      <Plus size={16} /> Add Variable
                    </button>
                  </div>
                  <div className="grid gap-3">
                    {env.vars.map((kv, kvIndex) => (
                      <div key={kvIndex} className="flex gap-4 items-start animate-fade-in">
                        <input
                          type="text"
                          value={kv.key}
                          onChange={(e) => updateKeyValue(envIndex, 'vars', kvIndex, 'key', e.target.value)}
                          placeholder="Key"
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                        />
                        <input
                          type="text"
                          value={kv.value}
                          onChange={(e) => updateKeyValue(envIndex, 'vars', kvIndex, 'value', e.target.value)}
                          placeholder="Value"
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                        />
                        <button
                          onClick={() => removeKeyValue(envIndex, 'vars', kvIndex)}
                          className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 transition-all"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Secrets Section */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-medium text-gray-700">Secrets</h3>
                      <button
                        onClick={() => toggleSecretVisibility(env.name)}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded-full transition-all"
                      >
                        {showSecrets[env.name] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <button
                      onClick={() => addKeyValue(envIndex, 'secrets')}
                      className="text-sm px-3 py-1 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors inline-flex items-center gap-1"
                    >
                      <Plus size={16} /> Add Secret
                    </button>
                  </div>
                  <div className="grid gap-3">
                    {env.secrets.map((kv, kvIndex) => (
                      <div key={kvIndex} className="flex gap-4 items-start animate-fade-in">
                        <input
                          type="text"
                          value={kv.key}
                          onChange={(e) => updateKeyValue(envIndex, 'secrets', kvIndex, 'key', e.target.value)}
                          placeholder="Key"
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                        />
                        <input
                          type={showSecrets[env.name] ? "text" : "password"}
                          value={kv.value}
                          onChange={(e) => updateKeyValue(envIndex, 'secrets', kvIndex, 'value', e.target.value)}
                          placeholder="Value"
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                        />
                        <button
                          onClick={() => removeKeyValue(envIndex, 'secrets', kvIndex)}
                          className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 transition-all"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {environments.length === 0 && (
          <div className="text-center text-gray-500 mt-12 animate-fade-in">
            <p className="text-lg">No environments yet. Add one to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnvironmentManager;
