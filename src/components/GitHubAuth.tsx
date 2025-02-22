
import React from 'react';
import { Github } from 'lucide-react';
import { toast } from 'sonner';
import { GitHubUser } from '../types/environment';
import { validateGitHubPAT, checkRepositoryAccess } from '../utils/githubUtils';

interface GitHubAuthProps {
  pat: string;
  setPat: (pat: string) => void;
  repository: string;
  setRepository: (repo: string) => void;
  githubUser: GitHubUser | null;
  setGithubUser: (user: GitHubUser | null) => void;
  hasRepoAccess: boolean | null;
  setHasRepoAccess: (hasAccess: boolean | null) => void;
}

const GitHubAuth = ({
  pat,
  setPat,
  repository,
  setRepository,
  githubUser,
  setGithubUser,
  hasRepoAccess,
  setHasRepoAccess
}: GitHubAuthProps) => {
  const handleValidateGitHubPAT = async () => {
    await validateGitHubPAT(pat, setGithubUser, repository, handleCheckRepositoryAccess);
  };

  const handleCheckRepositoryAccess = async () => {
    await checkRepositoryAccess(pat, repository, setHasRepoAccess);
  };

  return (
    <div className="flex w-full items-center justify-center">
      <div className="w-full max-w-md space-y-4">
        <div className="w-full">
          <input
            type="password"
            value={pat}
            onChange={(e) => setPat(e.target.value)}
            onBlur={handleValidateGitHubPAT}
            placeholder="Enter Personal Access Token (PAT)"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
          />
          {githubUser && (
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
              <img src={githubUser.avatar_url} alt={githubUser.login} className="w-5 h-5 rounded-full" />
              <span>{githubUser.name || githubUser.login}</span>
            </div>
          )}
        </div>

        <div className="w-full">
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
            <span className="mt-2 block text-sm text-green-600">Repository access verified</span>
          )}
          {hasRepoAccess === false && (
            <span className="mt-2 block text-sm text-red-600">No access to this repository</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default GitHubAuth;

