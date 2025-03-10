import { toast } from 'sonner';
import { GitHubUser } from '../types/environment';

export const validateGitHubPAT = async (
  pat: string,
  setGithubUser: (user: GitHubUser | null) => void,
  repository: string,
  checkRepositoryAccess: () => Promise<void>
) => {
  if (!pat) return;

  try {
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${pat}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!userResponse.ok) {
      toast.error('Invalid Personal Access Token');
      setGithubUser(null);
      return;
    }

    const userData = await userResponse.json();
    setGithubUser({
      login: userData.login,
      name: userData.name,
      avatar_url: userData.avatar_url
    });

    if (repository) {
      await checkRepositoryAccess();
    }
  } catch (error) {
    toast.error('Failed to validate GitHub token');
    console.error('Error validating GitHub token:', error);
  }
};

export const checkRepositoryAccess = async (
  pat: string,
  repository: string,
  setHasRepoAccess: (hasAccess: boolean | null) => void
) => {
  if (!pat || !repository) return;

  try {
    const [owner, repo] = repository.split('/');
    const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        'Authorization': `Bearer ${pat}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    const hasAccess = repoResponse.ok;
    setHasRepoAccess(hasAccess);
    
    if (!hasAccess) {
      toast.error('No access to this repository');
    } else {
      toast.success('Repository access verified');
    }
  } catch (error) {
    setHasRepoAccess(false);
    toast.error('Failed to verify repository access');
    console.error('Error checking repository access:', error);
  }
};

export const sendDataToGitHub = async (
  pat: string,
  repository: string,
  structure: any,
  setApiResponse: (response: { statusCode: number; body: any; } | null) => void
) => {
  try {
    const [owner, repo] = repository.split('/');
    
    const workflowResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/workflows`, 
      {
        headers: {
          'Authorization': `Bearer ${pat}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    if (!workflowResponse.ok) {
      throw new Error('Failed to fetch workflows');
    }

    const workflows = await workflowResponse.json();
    const updateEnvironmentWorkflow = workflows.workflows.find(
      (workflow: any) => workflow.name === 'Update Environment' || workflow.path === '.github/workflows/update-environment.yml'
    );

    if (!updateEnvironmentWorkflow) {
      toast.error('update-environment.yml workflow not found');
      return;
    }

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/workflows/${updateEnvironmentWorkflow.id}/dispatches`, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `Bearer ${pat}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ref: 'main',
        inputs: {
          pat: pat,
          repository: repository,
          structure: JSON.stringify(structure)
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to trigger GitHub Action');
    }
    
    setApiResponse({
      statusCode: response.status,
      body: { message: 'GitHub Action triggered successfully' }
    });

    toast.success('GitHub Action triggered successfully');
  } catch (error) {
    console.error('Error triggering GitHub Action:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to trigger GitHub Action');
  }
};

const createOrUpdateEnvironmentVariable = async (
  pat: string,
  owner: string,
  repo: string,
  envName: string,
  varName: string,
  varValue: string
) => {
  try {
    // Primeiro tenta criar a variável com POST
    let response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/environments/${envName}/variables`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${pat}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: varName,
          value: varValue
        })
      }
    );

    // Se receber erro 409 (conflito), tenta atualizar com PATCH
    if (response.status === 409) {
      console.log(`Variable ${varName} already exists, updating with PATCH...`);
      response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/environments/${envName}/variables/${varName}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${pat}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: varName,
            value: varValue
          })
        }
      );
    }

    if (!response.ok) {
      throw new Error(`Failed to ${response.status === 409 ? 'update' : 'create'} variable ${varName}`);
    }

    console.log(`Successfully ${response.status === 200 ? 'updated' : 'created'} variable ${varName}`);
    return true;
  } catch (error) {
    console.error(`Error handling variable ${varName}:`, error);
    throw error;
  }
};

export const fetchEnvironmentInfo = async (pat: string, repository: string) => {
  try {
    const [owner, repo] = repository.split('/');
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/environments`, {
      headers: {
        'Authorization': `Bearer ${pat}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch environment information');
    }

    const data = await response.json();
    console.log('Environments response:', data);
    
    const environments = await Promise.all(data.environments.map(async (env: any) => {
      console.log(`Fetching details for environment: ${env.name}`);
      
      const variables = await fetchEnvironmentVariables(pat, owner, repo, env.name);
      const secrets = await fetchEnvironmentSecrets(pat, owner, repo, env.name);
      
      console.log(`Environment ${env.name} details:`, {
        variablesCount: variables.length,
        secretsCount: secrets.length
      });

      return {
        ...env,
        variables,
        secrets
      };
    }));

    return { ...data, environments };
  } catch (error) {
    toast.error('Failed to fetch environment information');
    console.error('Error fetching environment information:', error);
    return null;
  }
};

const fetchEnvironmentVariables = async (pat: string, owner: string, repo: string, envName: string) => {
  try {
    console.log(`Fetching variables for environment: ${envName}`);
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/environments/${envName}/variables`,
      {
        headers: {
          'Authorization': `Bearer ${pat}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    if (!response.ok) {
      console.error(`Failed to fetch variables for ${envName}:`, response.status);
      if (response.status === 404) {
        return [];
      }
      throw new Error('Failed to fetch environment variables');
    }

    const data = await response.json();
    console.log(`Variables response for ${envName}:`, data);
    return Array.isArray(data.variables) ? data.variables : [];
  } catch (error) {
    console.error(`Error fetching variables for ${envName}:`, error);
    return [];
  }
};

const fetchEnvironmentSecrets = async (pat: string, owner: string, repo: string, envName: string) => {
  try {
    console.log(`Fetching secrets for environment: ${envName}`);
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/environments/${envName}/secrets`,
      {
        headers: {
          'Authorization': `Bearer ${pat}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    if (!response.ok) {
      console.error(`Failed to fetch secrets for ${envName}:`, response.status);
      if (response.status === 404) {
        return [];
      }
      throw new Error('Failed to fetch environment secrets');
    }

    const data = await response.json();
    console.log(`Secrets response for ${envName}:`, data);
    return Array.isArray(data.secrets) ? data.secrets : [];
  } catch (error) {
    console.error(`Error fetching secrets for ${envName}:`, error);
    return [];
  }
};
