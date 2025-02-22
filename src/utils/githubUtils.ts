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
    
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/dispatches`, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `Bearer ${pat}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_type: 'update_environment',
        ref: 'main',
        inputs: {
          pat: pat,
          repository: repository,
          structure: structure
        }
      })
    });

    if (!response.ok) throw new Error('Failed to trigger GitHub Action');
    
    setApiResponse({
      statusCode: response.status,
      body: { message: 'GitHub Action triggered successfully' }
    });

    toast.success('GitHub Action triggered successfully');
  } catch (error) {
    toast.error('Failed to trigger GitHub Action');
    console.error('Error triggering GitHub Action:', error);
  }
};

export const fetchEnvironmentInfo = async (pat: string, repository: string) => {
  try {
    const [owner, repo] = repository.split('/');
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/.github/environment`, {
      headers: {
        'Authorization': `Bearer ${pat}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch environment information');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    toast.error('Failed to fetch environment information');
    console.error('Error fetching environment information:', error);
    return null;
  }
};
