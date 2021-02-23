import { join } from 'path';
import * as dotenv from 'dotenv';
import * as ora from 'ora';
import { execSync } from 'child_process';
import { program } from 'commander';

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
  version: string;
  dev: string;
  onlyBuild: boolean;
  framework: string;
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

  const { version } = parseYaml(VERSION_YAML_PATH);
  const compConfig = getComponentConfig(framework, version);

  if (options.version) {
    compConfig.version = options.version;
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

async function deploy(options: DeployOptions) {
  const spinner = ora().start('Start deploying...\n');

  spinner.info(`[BUILD] Building project...`);
  await buildProject();
  spinner.succeed(`[BUILD] Build project success`);

  if (options.framework) {
    const { framework } = options;
    if (!isSupportFramework(framework)) {
      spinner.fail(`[ERROR] Unsupport framework ${framework}`);
    }
    await deployComponent(framework as Framework, options, spinner);
  } else {
    for (let i = 0; i < FRAMEWORKS.length; i++) {
      await deployComponent(FRAMEWORKS[i], options, spinner);
    }
  }
  spinner.stop();
}

async function run() {
  program
    .command('deploy')
    .description('Deploy http components')
    .option('-f, --framework [framework]', 'specify framework to be deploy')
    .option('-d, --dev [dev]', 'deploy dev version component')
    .option('-v, --version [version]', 'component version')
    .option('-ob, --onlyBuild [onlyBuild]', 'only build project', false)
    .action((options) => {
      deploy(options);
    });

  program.parse(process.argv);
}

run();
