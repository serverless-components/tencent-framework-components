import { join } from 'path';
import { generateId, getServerlessSdk } from './lib/utils';
import { execSync } from 'child_process';
import axios from 'axios';
import { Inputs } from '../src/interface';

interface YamlConfig {
  org: string;
  app: string;
  component: string;
  name: string;
  stage: string;
  inputs: Inputs;
}

const instanceYaml: YamlConfig = {
  org: 'orgDemo',
  app: 'appDemo',
  component: 'express@dev',
  name: `express-integration-tests-${generateId()}`,
  stage: 'dev',
  inputs: {},
};

const credentials = {
  tencent: {
    SecretId: process.env.TENCENT_SECRET_ID,
    SecretKey: process.env.TENCENT_SECRET_KEY,
  },
};

describe('Express', () => {
  const sdk = getServerlessSdk(instanceYaml.org, process.env.TENCENT_APP_ID as string);

  it('deploy', async () => {
    const instance = await sdk.deploy(instanceYaml, credentials);

    expect(instance).toBeDefined();
    expect(instance.instanceName).toEqual(instanceYaml.name);
    expect(instance.outputs.templateUrl).toBeDefined();
    expect(instance.outputs.region).toEqual('ap-guangzhou');
    expect(instance.outputs.apigw).toBeDefined();
    expect(instance.outputs.apigw.environment).toEqual('release');
    expect(instance.outputs.scf).toBeDefined();
    expect(instance.outputs.scf.runtime).toEqual('Nodejs10.15');
  });

  it('update source code', async () => {
    const srcPath = join(__dirname, '..', 'examples/express');
    execSync('npm install', { cwd: srcPath });

    instanceYaml.inputs.src = srcPath;

    const instance = await sdk.deploy(instanceYaml, credentials);
    const response = await axios.get(instance.outputs.apigw.url);

    expect(response.data.includes('Serverless Framework')).toBeTruthy();
    expect(instance.outputs.templateUrl).not.toBeDefined();
  });

  it('remove', async () => {
    await sdk.remove(instanceYaml, credentials);
    const result = await sdk.getInstance(
      instanceYaml.org,
      instanceYaml.stage,
      instanceYaml.app,
      instanceYaml.name,
    );

    expect(result.instance.instanceStatus).toEqual('inactive');
  });
});
