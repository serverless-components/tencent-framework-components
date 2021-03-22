// import { join } from 'path';
import * as ora from 'ora';
import { program } from 'commander';
import { prompt } from 'inquirer';
import { inc as semverInc, ReleaseType } from 'semver';

import { Framework } from '../typings';
import { VERSION_YAML_PATH, FRAMEWORKS } from './config';
import { parseYaml, generateYaml, isSupportFramework } from './utils';

interface Options {
  ver: string;
  dev: string;
  framework: string;
  all: boolean;
  type: ReleaseType;
}

async function start(frameworks: Framework[], options: Options) {
  const spinner = ora().start(`Start changing...\n`);

  const versions = parseYaml(VERSION_YAML_PATH) as Record<Framework, string>;

  let versionType: ReleaseType | undefined = undefined;
  let version = '';
  if (options.dev) {
    version = 'dev';
  } else if (options.ver) {
    version = options.ver;
  } else {
    if (!options.type) {
      spinner.info('No version is specified');
      const { type } = await prompt([
        {
          type: 'list',
          name: 'type',
          message: 'Please select version type ?',
          choices: ['patch', 'minor', 'major'],
        },
      ]);
      versionType = type;
    } else {
      versionType = options.type;
    }
  }

  for (let i = 0; i < frameworks.length; i++) {
    const curFramework = frameworks[i];
    const curVersion = versions[curFramework];
    if (versionType) {
      version = semverInc(curVersion, versionType) as string;
    }
    versions[curFramework] = version;
    await generateYaml(VERSION_YAML_PATH, versions);
  }

  spinner.stop();
}

async function change(options: Options) {
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
    .description('Change component version')
    .option('-f, --framework [framework]', 'specify framework to be deploy')
    .option('-t, --type [type]', 'chagne version type')
    .option('-a, --all [all]', 'specify all frameworks to be deploy')
    .option('-v, --ver [ver]', 'specify version for component')
    .option('-d, --dev [dev]', 'deploy dev version component')
    .action((options) => {
      change(options);
    });

  program.parse(process.argv);
}

run();
