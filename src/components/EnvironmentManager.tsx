import React, { useState } from 'react';
import { Plus, X, Eye, EyeOff, Save, Send, Github, List } from 'lucide-react';
import { toast } from 'sonner';
import TemplateSearch from './TemplateSearch';
import { Environment, Template, GitHubUser, APIResponse } from '../types/environment';
import { generateTemplateStructure, generateCurrentStructure, extractEnvironmentInfo } from '../utils/environmentUtils';
import { validateGitHubPAT, checkRepositoryAccess, sendDataToGitHub } from '../utils/githubUtils';

const EnvironmentManager = () => {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [newEnvName, setNewEnvName] = useState('');
  const [showSecrets, setShowSecrets] = useState<{ [key: string]: boolean }>({});
  const [pat, setPat] = useState('');
  const [repository, setRepository] = useState('');
  const [githubUser, setGithubUser] = useState<GitHubUser | null>(null);
  const [hasRepoAccess, setHasRepoAccess] = useState<boolean | null>(null);
  const [apiResponse, setApiResponse] = useState<APIResponse | null>(null);

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

  const downloadTemplate = () => {
    const templateStr = JSON.stringify(generateTemplateStructure(environments), null, 2);
    const blob = new Blob([templateStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'environment-template.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Template downloaded successfully');
  };

  const applyTemplate = (template: Template) => {
    const newEnvironments: Environment[] = [];
    
    Object.entries(template.structure).forEach(([envName, envData]) => {
      const vars = Object.entries(envData.vars).map(([key, value]) => ({ 
        key, 
        value: value || '' 
      }));
      
      const secrets = Object.keys(envData.secrets).map(key => ({ 
        key, 
        value: '' 
      }));
      
      newEnvironments.push({
        name: envName,
        vars,
        secrets
      });
    });
    
    setEnvironments(newEnvironments);
    toast.success('Template applied successfully');
  };

  const handleValidateGitHubPAT = async () => {
    await validateGitHubPAT(pat, setGithubUser, repository, handleCheckRepositoryAccess);
  };

  const handleCheckRepositoryAccess = async () => {
    await checkRepositoryAccess(pat, repository, setHasRepoAccess);
  };

  const handleSendData = async () => {
    if (!pat) {
      toast.error('Please enter your Personal Access Token');
      return;
    }

    if (!repository) {
      toast.error('Please enter a GitHub repository');
      return;
    }

    if (hasRepoAccess !== true) {
      toast.error('Please verify repository access first');
      return;
    }

    await sendDataToGitHub(pat, repository, generateCurrentStructure(environments), setApiResponse);
  };

  const showEnvironmentInfo = () => {
    const info = extractEnvironmentInfo(environments);
    toast.info("Informações dos ambientes copiadas para o console");
    console.log("Environment Information:", JSON.stringify(info, null, 2));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Github size={32} />
          <h1 className="text-4xl font-light text-gray-900 text-center">Github Environment Manager</h1>
        </div>
        
        <div className="mb-8 flex flex-col gap-4 items-center">
          <TemplateSearch
            onSelectTemplate={applyTemplate}
            currentStructure={generateTemplateStructure(environments)}
          />
          
          <div className="grid gap-4 w-full max-w-md">
            <div className="flex flex-col gap-2">
              <input
                type="password"
                value={pat}
                onChange={(e) => setPat(e.target.value)}
                onBlur={handleValidateGitHubPAT}
                placeholder="Enter Personal Access Token (PAT)"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
              />
              {githubUser && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <img src={githubUser.avatar_url} alt={githubUser.login} className="w-5 h-5 rounded-full" />
                  <span>{githubUser.name || githubUser.login}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={repository}
                onChange={(e) => setRepository(e.target.value)}
                onBlur={handleCheckRepositoryAccess}
                placeholder="GitHub Repository (owner/repo)"
                className={`w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 transition-all ${
                  hasRepoAccess === true 
                    ? 'border-green-200 focus:ring-green-200' 
                    : hasRepoAccess === false 
                    ? 'border-red-200 focus:ring-red-200'
                    : 'border-gray-200 focus:ring-gray-200'
                }`}
              />
              {hasRepoAccess === true && (
                <span className="text-sm text-green-600">Repository access verified</span>
              )}
              {hasRepoAccess === false && (
                <span className="text-sm text-red-600">No access to this repository</span>
              )}
            </div>

            <button
              onClick={handleSendData}
              disabled={!pat || !repository || hasRepoAccess !== true}
              className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} /> Send
            </button>
          </div>
        </div>

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
          {environments.length > 0 && (
            <button
              type="button"
              onClick={downloadTemplate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Save size={20} /> Download Template
            </button>
          )}
        </form>

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

        {apiResponse && (
          <div className="mt-8 max-w-6xl mx-auto">
            <div className="bg-gray-900 text-white p-6 rounded-xl">
              <h3 className="text-lg font-medium mb-4">API Response</h3>
              <div className="grid gap-2">
                <p>Status Code: {apiResponse.statusCode}</p>
                <pre className="overflow-auto">
                  {JSON.stringify(apiResponse.body, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>

      {environments.length > 0 && (
        <div className="mt-8 max-w-6xl mx-auto">
          <div className="bg-gray-900 text-white p-6 rounded-xl">
            <h3 className="text-lg font-medium mb-4">Generated Template Structure</h3>
            <pre className="overflow-auto">
              {JSON.stringify(generateTemplateStructure(environments), null, 2)}
            </pre>
          </div>
          <div className="bg-gray-900 text-white p-6 rounded-xl mt-4">
            <h3 className="text-lg font-medium mb-4">Current Data Structure</h3>
            <pre className="overflow-auto">
              {JSON.stringify(generateCurrentStructure(environments), null, 2)}
            </pre>
          </div>
        </div>
      )}

      {environments.length > 0 && (
        <div className="mt-8 max-w-6xl mx-auto">
          <button
            onClick={showEnvironmentInfo}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <List size={20} /> Ver Informações dos Ambientes
          </button>
        </div>
      )}
    </div>
  );
};

export default EnvironmentManager;
