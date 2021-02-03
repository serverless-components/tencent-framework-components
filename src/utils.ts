import { ServerlessComponent } from './index';
import { ApiTypeError } from 'tencent-component-toolkit/lib/utils/error';
import * as download from 'download';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as AdmZip from 'adm-zip';
import { ScfInputs } from './interface';

import { getConfig } from './config';
const CONFIGS = getConfig();

export const generateId = () =>
  Math.random()
    .toString(36)
    .substring(6);

export const deepClone = (obj: { [propName: string]: any }) => {
  return JSON.parse(JSON.stringify(obj));
};

export const getType = (obj: any) => {
  return Object.prototype.toString.call(obj).slice(8, -1);
};

export const capitalString = (str: string) => {
  if (str.length < 2) {
    return str.toUpperCase();
  }

  return `${str[0].toUpperCase()}${str.slice(1)}`;
};

export const getDefaultProtocol = (protocols: string[]) => {
  return String(protocols).includes('https') ? 'https' : 'http';
};

export const getDefaultFunctionName = () => {
  return `${CONFIGS.framework}_component_${generateId()}`;
};

export const getDefaultServiceName = () => {
  return 'serverless';
};

export const getDefaultServiceDescription = () => {
  return 'Created by Serverless Component';
};

export const removeAppid = (str: string, appid: string) => {
  const suffix = `-${appid}`;
  if (!str || str.indexOf(suffix) === -1) {
    return str;
  }
  return str.slice(0, -suffix.length);
};

export const validateTraffic = (num: number | any) => {
  if (getType(num) !== 'Number') {
    throw new ApiTypeError(
      `PARAMETER_${CONFIGS.framework.toUpperCase()}_TRAFFIC`,
      'traffic must be a number',
    );
  }
  if (num < 0 || num > 1) {
    throw new ApiTypeError(
      `PARAMETER_${CONFIGS.framework.toUpperCase()}_TRAFFIC`,
      'traffic must be a number between 0 and 1',
    );
  }
  return true;
};

const generatePublicDir = (zipPath: string) => {
  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries();
  const [entry] = entries.filter((e) => e.entryName === 'app/public/' && e.name === '');
  if (!entry) {
    const extraPublicPath = path.join(__dirname, '_fixtures/public');
    zip.addLocalFolder(extraPublicPath, 'app/public');
    zip.writeZip();
  }
};

export const getCodeZipPath = async (inputs: ScfInputs) => {
  const { framework } = CONFIGS;
  console.log(`Packaging ${framework} application`);

  // unzip source zip file
  let zipPath;
  if (!inputs.code?.src) {
    // add default template
    const downloadPath = `/tmp/${generateId()}`;
    const filename = 'template';

    console.log(`Installing Default ${framework} App`);
    try {
      await download(CONFIGS.templateUrl, downloadPath, {
        filename: `${filename}.zip`,
      });
    } catch (e) {
      throw new ApiTypeError(`DOWNLOAD_TEMPLATE`, 'Download default template failed.');
    }
    zipPath = `${downloadPath}/${filename}.zip`;
  } else {
    zipPath = inputs.code.src;
  }

  // 自动注入 public 目录
  if (framework === 'egg') {
    generatePublicDir(zipPath);
  }

  return zipPath;
};

const modifyDjangoEntryFile = (projectName: string, shimPath: string) => {
  console.log(`Modifying django entry file for project ${projectName}`);
  const compShimsPath = `/tmp/_shims`;
  const fixturePath = path.join(__dirname, '_fixtures/python');
  fse.copySync(shimPath, compShimsPath);
  fse.copySync(fixturePath, compShimsPath);

  // replace {{django_project}} in _shims/index.py to djangoProjectName
  const indexPath = path.join(compShimsPath, 'sl_handler.py');
  const indexPyFile = fse.readFileSync(indexPath, 'utf8');
  const replacedFile = indexPyFile.replace(eval('/{{django_project}}/g'), projectName);
  fse.writeFileSync(indexPath, replacedFile);
  return compShimsPath;
};

const getDirFiles = (dirPath: string) => {
  const targetPath = path.resolve(dirPath);
  const files = fse.readdirSync(targetPath);
  const temp: { [propName: string]: any } = {};
  files.forEach((file: string) => {
    temp[file] = path.join(targetPath, file);
  });
  return temp;
};

export const getInjection = (instance: ServerlessComponent, inputs: ScfInputs) => {
  const { framework } = CONFIGS;
  let injectFiles = {};
  let injectDirs = {};
  const shimPath = path.join(__dirname, '_shims');
  if (CONFIGS.injectSlsSdk) {
    injectFiles = instance.getSDKEntries(`_shims/handler.handler`);
    injectDirs = {
      _shims: shimPath,
    };
  } else if (framework === 'django') {
    const djangoShimPath = modifyDjangoEntryFile(inputs.projectName!, shimPath);
    injectDirs = {
      '': djangoShimPath,
    };
  } else if (framework === 'flask') {
    injectDirs = {
      '': path.join(__dirname, '_fixtures/python'),
    };
    injectFiles = getDirFiles(shimPath);
  } else {
    injectFiles = getDirFiles(shimPath);
  }

  return { injectFiles, injectDirs };
};
