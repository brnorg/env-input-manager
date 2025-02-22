
import { Environment, Template } from '../types/environment';

export const generateTemplateStructure = (environments: Environment[]) => {
  const template: { [key: string]: any } = {};
  
  environments.forEach(env => {
    template[env.name] = {
      vars: Object.fromEntries(env.vars.map(v => [v.key, ""])),
      secrets: Object.fromEntries(env.secrets.map(s => [s.key, ""]))
    };
  });
  
  return template;
};

export const generateCurrentStructure = (environments: Environment[]) => {
  const current: { [key: string]: any } = {};
  
  environments.forEach(env => {
    current[env.name] = {
      vars: Object.fromEntries(env.vars.map(v => [v.key, v.value])),
      secrets: Object.fromEntries(env.secrets.map(s => [s.key, s.value]))
    };
  });
  
  return current;
};

export const extractEnvironmentInfo = (environments: Environment[]) => {
  const info: { [key: string]: { vars: { [key: string]: string }, secretKeys: string[] } } = {};
  
  environments.forEach(env => {
    info[env.name] = {
      vars: Object.fromEntries(env.vars.map(v => [v.key, v.value])),
      secretKeys: env.secrets.map(s => s.key)
    };
  });
  
  return info;
};
