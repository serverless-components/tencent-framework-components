import { join } from 'path';
import * as dotenv from 'dotenv';
import * as ora from 'ora';
import { execSync } from 'child_process';
import { program } from 'commander';
import { prompt } from 'inquirer';

dotenv.config({
  path: join(__dirname, '..', '.env'),
});

import { Framework } from './../typings';
import { VERSION_YAML_PATH, FRAMEWORKS } from './config';
import {
  copySync,
  rmdirSync,
  parseYaml,
  getComponentConfig,
  publishComponent,
  generateYaml,
  isSupportFramework,
} from './utils';

interface DeployOptions {
  env: string; // 需要部署的环境，默认为 prod
  ver: string; // 需要部署的版本
  dev: string; // 是否部署 dev 版本
  onlyBuild: boolean; // 是否仅构建项目
  framework: string; // 指定框架
  all: boolean; // 部署所有框架
}

async function buildProject() {
  const buildPath = join(__dirname, '..', 'build');
  rmdirSync(buildPath);
  execSync(`tsc -p .`, {
    cwd: process.cwd(),
  });
  copySync(join(__dirname, '..', 'src/node_modules'), join(__dirname, '..', 'build/node_modules'));
}

async function copyExtraFiles(framework: Framework) {
  const shimPath = join(__dirname, '..', `src/_shims/${framework}`);
  const targetShimPath = join(__dirname, '..', 'build/_shims');
  const fixturePath = join(__dirname, '..', 'src/_fixtures');
  const targetFixturePath = join(__dirname, '..', 'build/_fixtures');

  // 复制前，需要先删除
  rmdirSync(targetShimPath);
  rmdirSync(targetFixturePath);

  // 复制指定框架的 _shims 文件
  copySync(shimPath, targetShimPath);

  if (['egg', 'flask', 'django'].indexOf(framework) !== -1) {
    // 复制 _fixtures
    copySync(fixturePath, targetFixturePath);
  }
}

async function generateFrameworkYaml(framework: Framework) {
  await generateYaml(join(__dirname, '..', 'build/framework.yml'), {
    name: framework,
  });
}

async function deployComponent(
  framework: Framework,
  options: { [propName: string]: any },
  spinner: ora.Ora,
) {
  spinner.info(`[${framework}] Copying extra files for component ${framework}...`);
  await copyExtraFiles(framework);

  spinner.info(`[${framework}] Generate config file for compooent ${framework}...`);
  await generateFrameworkYaml(framework);

  const versions = parseYaml(VERSION_YAML_PATH);
  const version = versions[framework];
  const compConfig = getComponentConfig(framework, version);

  if (options.ver) {
    compConfig.version = options.ver;
  }
  if (options.dev) {
    compConfig.version = 'dev';
  }

  try {
    spinner.info(`[${framework}] Publishing compooent ${framework}@${compConfig.version}...`);
    await publishComponent(compConfig);
    spinner.succeed(`[${framework}] Publish compooent ${framework}@${compConfig.version} success`);
  } catch (e) {
    spinner.warn(
      `[${framework}] Publish compooent ${framework}@${compConfig.version} error: ${e.message}`,
    );
  }
  return compConfig;
}

async function startDeploy(frameworks: Framework[], options: DeployOptions) {
  const stage = options.env || 'dev';
  process.env.SERVERLESS_PLATFORM_STAGE = stage;

  const spinner = ora().start();

  spinner.info(`Start deploying (${stage})...`);
  spinner.info(`[BUILD] Building project...`);
  await buildProject();
  spinner.succeed(`[BUILD] Build project success`);

  if (options.onlyBuild) {
    spinner.stop();
    return;
  }

  for (let i = 0; i < frameworks.length; i++) {
    await deployComponent(frameworks[i], options, spinner);
  }

  spinner.stop();
}

async function deploy(options: DeployOptions) {
  let frameworks: Framework[];
  if (options.framework) {
    const { framework } = options;
    if (!isSupportFramework(framework)) {
      console.error(`[ERROR] Unsupport framework ${framework}`);
      return;
    }
    frameworks = [framework] as Framework[];
  } else if (options.all) {
    frameworks = FRAMEWORKS;
  } else {
    // ask to select framework
    const anwsers = await prompt([
      {
        type: 'checkbox',
        name: 'frameworks',
        message: 'Please select framework to be deploy?',
        choices: FRAMEWORKS,
      },
    ]);
    frameworks = anwsers.frameworks as Framework[];
  }

  await startDeploy(frameworks, options);
}

async function run() {
  program
    .description('Deploy http components')
    .option('-f, --framework [framework]', 'specify framework to be deploy')
    .option('-a, --all [all]', 'specify all frameworks to be deploy')
    .option('-d, --dev [dev]', 'deploy dev version component')
    .option('-e, --env [env]', 'specify deploy environment: prod,dev', 'dev')
    .option('-v, --ver [ver]', 'component version')
    .option('-ob, --onlyBuild [onlyBuild]', 'only build project', false)
    .action((options) => {
      deploy(options);
    });

  program.parse(process.argv);
}

run();
