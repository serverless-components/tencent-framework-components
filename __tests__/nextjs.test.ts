import { generateId, getServerlessSdk, getExampleConfig, resolveSrcConfig } from '../scripts/utils';
import { spawnSync } from 'child_process';
import axios from 'axios';

const appId = process.env.TENCENT_APP_ID as string;
const credentials = {
  tencent: {
    SecretId: process.env.TENCENT_SECRET_ID,
    SecretKey: process.env.TENCENT_SECRET_KEY,
  },
};

const framework = 'nextjs';
process.env.STATIC_URL = `https://${framework}-demo-1303241281.cos.ap-guangzhou.myqcloud.com`;
const { examplePath, yamlConfig } = getExampleConfig(framework);
yamlConfig.name = `${framework}-integration-test-${generateId()}`;
yamlConfig.org = appId;
yamlConfig.component = `${framework}@dev`;

const srcConfig = resolveSrcConfig(examplePath, yamlConfig.inputs.src!);
if (srcConfig.hook) {
  const commandArr = srcConfig.hook.split(' ');
  spawnSync(commandArr[0], commandArr.slice(1), { cwd: examplePath });
  delete srcConfig.hook;
}

const sdk = getServerlessSdk(yamlConfig.org!, appId);

describe(framework, () => {
  it('deploy use template', async () => {
    delete yamlConfig.inputs.src;

    const instance = await sdk.deploy(yamlConfig, credentials);

    expect(instance).toBeDefined();
    expect(instance.instanceName).toEqual(yamlConfig.name);
    expect(instance.outputs.templateUrl).toBeDefined();
    expect(instance.outputs.region).toEqual('ap-guangzhou');
    expect(instance.outputs.apigw).toBeDefined();
    expect(instance.outputs.apigw.environment).toEqual('release');
    expect(instance.outputs.scf).toBeDefined();
    expect(instance.outputs.scf.runtime).toEqual('Nodejs10.15');

    const response = await axios.get(instance.outputs.apigw.url);
    expect(response.data.includes('Serverless')).toBeTruthy();
  });

  it('update source code', async () => {
    yamlConfig.inputs.src = srcConfig;

    spawnSync('npm', ['install'], { cwd: examplePath });

    const instance = await sdk.deploy(yamlConfig, credentials);
    const response = await axios.get(instance.outputs.apigw.url);

    expect(response.data.includes('Serverless')).toBeTruthy();
    expect(instance.outputs.templateUrl).not.toBeDefined();
  });

  it('remove', async () => {
    await sdk.remove(yamlConfig, credentials);
    const result = await sdk.getInstance(
      yamlConfig.org,
      yamlConfig.stage,
      yamlConfig.app,
      yamlConfig.name,
    );

    expect(result.instance.instanceStatus).toEqual('inactive');
  });
});
