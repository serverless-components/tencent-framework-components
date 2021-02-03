import { join } from 'path';
import { Framework } from '../typings';

export const FRAMEWORKS: Framework[] = [
  'express',
  'koa',
  'egg',
  'nextjs',
  'nuxtjs',
  'nestjs',
  'flask',
  'django',
  'laravel',
  'thinkphp',
];

export const VERSION_YAML_PATH = join(__dirname, '..', 'version.yml');

export const COMPONENT_CODE_PATH = join(__dirname, '..', 'build');
