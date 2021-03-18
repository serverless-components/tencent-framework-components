import { join } from 'path';
import * as ora from 'ora';
import { program } from 'commander';
import { prompt } from 'inquirer';
import { inc as semverInc } from 'semver';

import { Framework, ServerlessConfig } from '../typings';
import { VERSION_YAML_PATH, FRAMEWORKS } from './config';
import { parseYaml, generateYaml, isSupportFramework } from './utils';

interface DeployOptions {
  ver: string;
  dev: string;
  framework: string;
  all: boolean;
  example: boolean;
}

async function changeExampleVersion(
  framework: Framework,
  options: { [propName: string]: any },
  spinner: ora.Ora,
) {
  const exampleYamlPath = join(__dirname, '..', 'examples', framework, 'serverless.yml');
  const yamlConfig = parseYaml(exampleYamlPath) as ServerlessConfig;
  if (options.dev) {
    yamlConfig.component = `${framework}@dev`;
  } else {
    yamlConfig.component = framework;
  }

  spinner.info(`[${framework}] Change version for component ${framework}...`);
  await generateYaml(exampleYamlPath, yamlConfig);

  spinner.info(`[${framework}] Change version for component ${framework} success`);
}

async function changeVersion(
  framework: Framework,
  options: { [propName: string]: any },
  spinner: ora.Ora,
) {
  spinner.info(`[${framework}] Change version for component ${framework}...`);
  const versions = parseYaml(VERSION_YAML_PATH);
  const version = versions[framework];

  if (options.dev) {
    versions[framework] = 'dev';
  } else if (options.ver) {
    versions[framework] = options.ver;
  } else {
    const { type } = await prompt([
      {
        type: 'list',
        name: 'type',
        message: 'Please select version type?',
        choices: ['patch', 'minor', 'major'],
      },
    ]);
    const newVersion = semverInc(version, type);
    versions[framework] = newVersion;
  }

  await generateYaml(VERSION_YAML_PATH, versions);
  spinner.info(`[${framework}] Change version for component ${framework} success`);
}

async function start(frameworks: Framework[], options: DeployOptions) {
  const spinner = ora().start(`Start changing...\n`);

  for (let i = 0; i < frameworks.length; i++) {
    if (options.example) {
      await changeExampleVersion(frameworks[i], options, spinner);
    } else {
      await changeVersion(frameworks[i], options, spinner);
    }
  }

  spinner.stop();
}

async function change(options: DeployOptions) {
  let frameworks: Framework[];
  if (options.framework) {
    const { framework } = options;
    if (!isSupportFramework(framework)) {
      console.error(`[ERROR] Unsupport framework ${framework}`);
      return;
    }
    frameworks = [framework] as Framework[];

    // await deployComponent(framework as Framework, options, spinner);
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

  await start(frameworks, options);
}

async function run() {
  program
    .description('Deploy http components')
    .option('-f, --framework [framework]', 'specify framework to be deploy')
    .option('-t, --type [type]', 'chagne version type')
    .option('-e, --example [example]', 'chagne version config for example')
    .option('-a, --all [all]', 'specify all frameworks to be deploy')
    .option('-v, --ver [ver]', 'specify version for component')
    .option('-d, --dev [dev]', 'deploy dev version component')
    .action((options) => {
      change(options);
    });

  program.parse(process.argv);
}

run();
