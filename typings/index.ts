export type Framework =
  | 'express'
  | 'koa'
  | 'egg'
  | 'nextjs'
  | 'nuxtjs'
  | 'nestjs'
  | 'flask'
  | 'django'
  | 'laravel'
  | 'thinkphp';

export interface ComponentConfig {
  type: string;
  name: string;
  version: string;
  author: string;
  org: string;
  description: string;
  keywords: string;
  repo: string;
  readme: string;
  license: string;
  webDeployable: boolean;
  src: string;
}

export interface ServerlessConfig {
  app?: string;
  stage?: string;

  component: string;
  name: string;

  inputs: Record<string, string>;
}
