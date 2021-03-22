import { join } from 'path';
import * as YAML from 'js-yaml';
import { readFileSync, writeFileSync, rmSync } from 'fs';
import * as fse from 'fs-extra';
import { Framework, ComponentConfig, ServerlessConfig, InputsSrc, SrcObject } from '../typings';
import { COMPONENT_CODE_PATH } from './config';

const { ServerlessSDK } = require('@serverless/platform-client-china');

export const typeOf = (obj: any) => {
  return Object.prototype.toString.call(obj).slice(8, -1);
};

export const AppNameMap: { [propName: string]: string } = {
  express: 'Express.js',
  koa: 'Koa.js',
  egg: 'Egg.js',
  nextjs: 'Next.js',
  nuxtjs: 'Nuxt.js',
  nestjs: 'Nest.js',
  flask: 'Flask',
  django: 'Django',
  laravel: 'Laravel',
  thinkphp: 'ThinkPHP',
};

export function isSupportFramework(framework: string) {
  if (AppNameMap[framework]) {
    return true;
  }
  return false;
}

export function getComponentConfig(framework: Framework, version: string): ComponentConfig {
  const appName = AppNameMap[framework];
  return {
    type: 'component',
    name: framework,
    version,
    author: 'Tencent Cloud, Inc.',
    org: 'Tencent Cloud, Inc.',
    description: `Deploy a serverless ${appName} application onto Tencent SCF and API Gateway.`,
    keywords: `tencent, serverless, ${appName.toLowerCase()}`,
    repo: `https://github.com/serverless-components/tencent-${framework}`,
    readme: `https://github.com/serverless-components/tencent-${framework}/tree/master/README.md`,
    license: 'MIT',
    webDeployable: true,
    src: COMPONENT_CODE_PATH,
  };
}

export function parseYaml(filename: string): Record<string, any> {
  const content = readFileSync(filename, 'utf-8');
  return YAML.load(content) as Record<string, any>;
}

export function generateYaml(filename: string, obj: { [propName: string]: any } | string) {
  let yamlContent: string;
  if (typeOf(obj) === 'String') {
    yamlContent = obj as string;
  } else {
    yamlContent = YAML.dump(obj);
  }
  return writeFileSync(filename, yamlContent);
}

export async function publishComponent(componentConfig: { [propName: string]: any }) {
  const sdk = new ServerlessSDK();

  let registryPackage;
  try {
    registryPackage = await sdk.publishPackage(componentConfig);
  } catch (error) {
    if (error.message.includes('409')) {
      error.message = error.message.replace('409 - ', '');
      console.error(error.message, true);
    } else {
      throw error;
    }
  }

  if (registryPackage && registryPackage.version === '0.0.0-dev') {
    registryPackage.version = 'dev';
  }
  return registryPackage;
}

export function copySync(source: string, dest: string) {
  fse.copySync(source, dest, {
    // overwrite: true,
    errorOnExist: false,
    // recursive: true,
  });
}

export async function rmdirSync(source: string) {
  rmSync(source, {
    recursive: true,
    force: true,
  });
}

export function getExampleConfig(framework: string) {
  const examplePath = join(__dirname, '..', 'examples', framework);
  const exampleYaml = join(examplePath, 'serverless.yml');
  const yamlConfig = parseYaml(exampleYaml) as ServerlessConfig;

  return {
    examplePath,
    yamlConfig,
  };
}

export function generateId(len: number = 6) {
  return Math.random()
    .toString(36)
    .substring(len);
}

export function getServerlessSdk(orgName: string, orgUid: string) {
  const sdk = new ServerlessSDK({
    context: {
      orgUid,
      orgName,
    },
  });
  return sdk;
}

export function resolveSrcConfig(baseDir: string, srcConfig: InputsSrc): SrcObject {
  if (typeof srcConfig === 'string') {
    const src = {
      src: join(baseDir, srcConfig),
    };
    return src;
  }
  if (srcConfig.src) {
    srcConfig.src = join(baseDir, srcConfig.src!);
  } else if (srcConfig.dist) {
    srcConfig.dist = join(baseDir, srcConfig.dist!);
    srcConfig.src = srcConfig.dist;
  }
  return srcConfig;
}
