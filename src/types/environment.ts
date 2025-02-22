
export interface KeyValue {
  key: string;
  value: string;
}

export interface Environment {
  name: string;
  vars: KeyValue[];
  secrets: KeyValue[];
}

export interface Template {
  name: string;
  description?: string;
  version?: string;
  author?: string;
  structure: {
    [key: string]: {
      vars: { [key: string]: string };
      secrets: { [key: string]: string };
    };
  };
}

export interface GitHubUser {
  login: string;
  name: string;
  avatar_url: string;
}

export interface APIResponse {
  statusCode: number;
  body: any;
}
