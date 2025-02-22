
import React, { useState } from 'react';
import { Send, Github, List, X } from 'lucide-react';
import { toast } from 'sonner';
import TemplateSearch from './TemplateSearch';
import GitHubAuth from './GitHubAuth';
import EnvironmentForm from './EnvironmentForm';
import EnvironmentSection from './EnvironmentSection';
import EnvironmentInfo from './EnvironmentInfo';
import { Environment, Template, GitHubUser, APIResponse } from '../types/environment';
import { generateTemplateStructure, generateCurrentStructure } from '../utils/environmentUtils';
import { sendDataToGitHub, fetchEnvironmentInfo } from '../utils/githubUtils';

const EnvironmentManager = () => {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [newEnvName, setNewEnvName] = useState('');
  const [showSecrets, setShowSecrets] = useState<{ [key: string]: boolean }>({});
  const [pat, setPat] = useState('');
  const [repository, setRepository] = useState('');
  const [githubUser, setGithubUser] = useState<GitHubUser | null>(null);
  const [hasRepoAccess, setHasRepoAccess] = useState<boolean | null>(null);
  const [apiResponse, setApiResponse] = useState<APIResponse | null>(null);
  const [environmentInfo, setEnvironmentInfo] = useState<any>(null);
  const [showEnvironmentInfo, setShowEnvironmentInfo] = useState(false);

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

  const fetchEnvironmentInfoHandler = async () => {
    if (!pat || !repository) {
      toast.error('Please enter your Personal Access Token and GitHub repository');
      return;
    }

    try {
      const repoInfo = await fetchEnvironmentInfo(pat, repository);
      if (repoInfo) {
        setEnvironmentInfo(repoInfo);
        setShowEnvironmentInfo(true);
        toast.success("Environment information fetched successfully");
      }
    } catch (error) {
      toast.error('Failed to fetch environment information');
      console.error('Error:', error);
    }
  };

  const isGitHubActionsEnabled = pat && repository && hasRepoAccess === true;

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
          
          <GitHubAuth
            pat={pat}
            setPat={setPat}
            repository={repository}
            setRepository={setRepository}
            githubUser={githubUser}
            setGithubUser={setGithubUser}
            hasRepoAccess={hasRepoAccess}
            setHasRepoAccess={setHasRepoAccess}
          />
          
          <div className="w-full max-w-md space-y-2">
            <button
              onClick={handleSendData}
              disabled={!isGitHubActionsEnabled}
              className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} /> Send
            </button>
            
            {isGitHubActionsEnabled && (
              <button
                onClick={fetchEnvironmentInfoHandler}
                className="w-full px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors inline-flex items-center justify-center gap-2"
              >
                <List size={20} /> Ver Informações dos Ambientes
              </button>
            )}
          </div>
        </div>

        <EnvironmentForm
          newEnvName={newEnvName}
          setNewEnvName={setNewEnvName}
          onAddEnvironment={addEnvironment}
          onDownloadTemplate={downloadTemplate}
          hasEnvironments={environments.length > 0}
        />

        {showEnvironmentInfo && environmentInfo && (
          <EnvironmentInfo
            environmentInfo={environmentInfo}
            onClose={() => setShowEnvironmentInfo(false)}
          />
        )}

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
                <EnvironmentSection
                  title="Variables"
                  items={env.vars}
                  envIndex={envIndex}
                  type="vars"
                  onAdd={() => addKeyValue(envIndex, 'vars')}
                  onUpdate={(kvIndex, field, value) => updateKeyValue(envIndex, 'vars', kvIndex, field, value)}
                  onRemove={(kvIndex) => removeKeyValue(envIndex, 'vars', kvIndex)}
                />

                <EnvironmentSection
                  title="Secrets"
                  items={env.secrets}
                  envIndex={envIndex}
                  type="secrets"
                  showSecrets={showSecrets[env.name]}
                  onAdd={() => addKeyValue(envIndex, 'secrets')}
                  onUpdate={(kvIndex, field, value) => updateKeyValue(envIndex, 'secrets', kvIndex, field, value)}
                  onRemove={(kvIndex) => removeKeyValue(envIndex, 'secrets', kvIndex)}
                  onToggleVisibility={() => toggleSecretVisibility(env.name)}
                />
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
    </div>
  );
};

export default EnvironmentManager;

