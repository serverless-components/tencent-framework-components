import { Component } from '@serverless/core';
import { Scf, Apigw, Metrics, Cos, Cdn } from 'tencent-component-toolkit';
import { ApiTypeError } from 'tencent-component-toolkit/lib/utils/error';
import { sleep, deepClone, getCodeZipPath, getDefaultProtocol, getInjection } from './utils';
import { formatInputs, formatStaticCosInputs, formatStaticCdnInputs } from './formatter';

import {
  State,
  Inputs,
  ScfInputs,
  ApigwInputs,
  StaticInputs,
  Outputs,
  ScfOutputs,
  ApigwOutputs,
  StaticOutput,
  StaticCosOutput,
  MetricsInputs,
} from './interface';

import { getConfig } from './config';
const CONFIGS = getConfig();

export class ServerlessComponent extends Component<State> {
  getCredentials() {
    const { tmpSecrets } = this.credentials.tencent;

    if (!tmpSecrets || !tmpSecrets.TmpSecretId) {
      throw new ApiTypeError(
        'CREDENTIAL',
        'Cannot get secretId/Key, your account could be sub-account and does not have the access to use SLS_QcsRole, please make sure the role exists first, then visit https://cloud.tencent.com/document/product/1154/43006, follow the instructions to bind the role to your account.',
      );
    }

    return {
      SecretId: tmpSecrets.TmpSecretId,
      SecretKey: tmpSecrets.TmpSecretKey,
      Token: tmpSecrets.Token,
    };
  }

  getAppId() {
    return this.credentials.tencent.tmpSecrets.appId;
  }

  async uploadCodeToCos(appId: string, inputs: ScfInputs, region: string) {
    const credentials = this.getCredentials();
    const bucketName = inputs.code?.bucket || `sls-cloudfunction-${region}-code`;
    const objectName = inputs.code?.object || `${inputs.name}-${Math.floor(Date.now() / 1000)}.zip`;
    // if set bucket and object not pack code
    if (!inputs.code?.bucket || !inputs.code?.object) {
      const zipPath = await getCodeZipPath(inputs);
      console.log(`Code zip path ${zipPath}`);

      // save the zip path to state for lambda to use it
      this.state.zipPath = zipPath;

      const cos = new Cos(credentials, region);

      if (!inputs.code?.bucket) {
        // create default bucket
        await cos.deploy({
          bucket: bucketName + '-' + appId,
          force: true,
          lifecycle: [
            {
              status: 'Enabled',
              id: 'deleteObject',
              expiration: { days: '10' },
              abortIncompleteMultipartUpload: { daysAfterInitiation: '10' },
            },
          ],
        });
      }

      // upload code to cos
      if (!inputs.code?.object) {
        console.log(`Getting cos upload url for bucket ${bucketName}`);
        const uploadUrl = await cos.getObjectUrl({
          bucket: bucketName + '-' + appId,
          object: objectName,
          method: 'PUT',
        });

        // if shims and sls sdk entries had been injected to zipPath, no need to injected again
        console.log(`Uploading code to bucket ${bucketName}`);

        const { injectFiles, injectDirs } = getInjection(this, inputs);

        await this.uploadSourceZipToCOS(zipPath, uploadUrl as string, injectFiles, injectDirs);
        console.log(`Upload ${objectName} to bucket ${bucketName} success`);
      }
    }

    // save bucket state
    this.state.bucket = bucketName;
    this.state.object = objectName;

    return {
      bucket: bucketName,
      object: objectName,
    };
  }

  async deployFunction(credentials: {}, inputs: ScfInputs = {}, region: string) {
    const appId = this.getAppId();

    const code = await this.uploadCodeToCos(appId, inputs, region);
    const scf = new Scf(credentials, region);
    const tempInputs = {
      ...inputs,
      code,
    };
    const scfOutput = await scf.deploy(deepClone(tempInputs));
    const outputs: ScfOutputs = {
      functionName: scfOutput.FunctionName,
      runtime: scfOutput.Runtime,
      namespace: scfOutput.Namespace,
    };

    this.state = {
      ...this.state,
      ...outputs,
    };

    // default version is $LATEST
    outputs.lastVersion = scfOutput.LastVersion ?? this.state.lastVersion ?? '$LATEST';

    // default traffic is 1.0, it can also be 0, so we should compare to undefined
    outputs.traffic = scfOutput.Traffic ?? this.state.traffic ?? 1;

    if (outputs.traffic !== 1 && scfOutput.ConfigTrafficVersion) {
      outputs.configTrafficVersion = scfOutput.ConfigTrafficVersion;
      this.state.configTrafficVersion = scfOutput.ConfigTrafficVersion;
    }

    this.state.lastVersion = outputs.lastVersion;
    this.state.traffic = outputs.traffic;

    return outputs;
  }

  async deployApigw(credentials: {}, inputs: ApigwInputs, region: string) {
    const { state } = this;
    const serviceId = inputs.serviceId ?? (state && state.serviceId);

    const apigw = new Apigw(credentials, region);

    const oldState = this.state ?? {};
    const apigwInputs = {
      ...inputs,
      oldState: {
        apiList: oldState.apiList || [],
        customDomains: oldState.customDomains || [],
      },
    };
    // different region deployment has different service id
    apigwInputs.serviceId = serviceId;
    const apigwOutput = await apigw.deploy(deepClone(apigwInputs));

    const outputs: ApigwOutputs = {
      serviceId: apigwOutput.serviceId,
      subDomain: apigwOutput.subDomain,
      environment: apigwOutput.environment,
      url: `${getDefaultProtocol(inputs.protocols)}://${apigwOutput.subDomain}/${
        apigwOutput.environment
      }${apigwInputs.endpoints[0].path}`,
    };

    if (apigwOutput.customDomains) {
      outputs.customDomains = apigwOutput.customDomains;
    }

    this.state = {
      ...this.state,
      ...outputs,
      apiList: apigwOutput.apiList,
      created: true,
    };

    return outputs;
  }

  // deploy static to cos, and setup cdn
  async deployStatic(inputs: StaticInputs, region: string) {
    const credentials = this.getCredentials();
    const { zipPath } = this.state;
    const appId = this.getAppId();
    const deployStaticOutputs: StaticOutput = {
      cos: {
        region: '',
        cosOrigin: '',
      },
    };

    if (zipPath) {
      console.log(`Deploying static files`);
      // 1. deploy to cos
      const { staticCosInputs, bucket, policy } = await formatStaticCosInputs(
        inputs.cosConf,
        appId,
        zipPath,
        region,
      );

      const cos = new Cos(credentials, region);

      const cosOutput: StaticCosOutput = {
        region,
        bucket,
        cosOrigin: `${bucket}.cos.${region}.myqcloud.com`,
        url: `https://${bucket}.cos.${region}.myqcloud.com`,
      };
      // try to create bucket
      await cos.createBucket({
        bucket,
        force: true,
      });
      // set public access policy
      await cos.setPolicy({
        bucket,
        policy,
      });
      // 创建 COS 桶后等待1s，防止偶发出现桶不存在错误
      await sleep(1000);

      // flush bucket
      if (inputs.cosConf.replace) {
        await cos.flushBucketFiles(bucket);
        try {
        } catch (e) {}
      }
      for (let i = 0; i < staticCosInputs.length; i++) {
        const curInputs = staticCosInputs[i];
        console.log(`Starting upload directory ${curInputs.src} to cos bucket ${curInputs.bucket}`);

        await cos.upload({
          bucket,
          dir: curInputs.src,
          keyPrefix: curInputs.keyPrefix,
        });

        console.log(`Upload directory ${curInputs.src} to cos bucket ${curInputs.bucket} success`);
      }

      deployStaticOutputs.cos = cosOutput;

      // 2. deploy cdn
      if (inputs.cdnConf) {
        const cdn = new Cdn(credentials);
        const cdnInputs = await formatStaticCdnInputs(inputs.cdnConf, cosOutput.cosOrigin);
        console.log(`Starting deploy cdn ${cdnInputs.domain}`);
        const cdnDeployRes = await cdn.deploy(cdnInputs);
        const protocol = cdnInputs.https ? 'https' : 'http';
        const cdnOutput = {
          domain: cdnDeployRes.domain,
          url: `${protocol}://${cdnDeployRes.domain}`,
          cname: cdnDeployRes.cname,
        };
        deployStaticOutputs.cdn = cdnOutput;

        console.log(`Deploy cdn ${cdnInputs.domain} success`);
      }

      console.log(`Deployed static files success`);

      return deployStaticOutputs;
    }

    return null;
  }

  async deploy(inputs: Inputs) {
    console.log(`Deploying ${CONFIGS.framework} application`);

    const credentials = this.getCredentials();

    // 对Inputs内容进行标准化
    const { region, functionConf, apigatewayConf } = await formatInputs(this.state, inputs);

    // 部署函数 + API网关
    const outputs: Outputs = {};

    if (!functionConf.code?.src) {
      outputs.templateUrl = CONFIGS.templateUrl;
    }

    let apigwOutputs;
    const functionOutputs = await this.deployFunction(credentials, functionConf, region);
    // support apigatewayConf.isDisabled
    if (apigatewayConf.isDisabled !== true) {
      apigwOutputs = await this.deployApigw(credentials, apigatewayConf, region);
    } else {
      this.state.apigwDisabled = true;
    }

    // optimize outputs for one region
    outputs.region = region;
    outputs.scf = functionOutputs;
    if (apigwOutputs) {
      outputs.apigw = apigwOutputs;
    }

    // start deploy static cdn
    if (inputs.staticConf) {
      const { staticConf } = inputs;
      const res = await this.deployStatic(staticConf, region);
      if (res) {
        this.state.staticConf = res;
        outputs.staticConf = res;
      }
    }

    this.state.region = region;

    this.state.lambdaArn = functionConf.name;

    return outputs;
  }

  async removeStatic() {
    // remove static
    const { region, staticConf } = this.state;
    if (staticConf) {
      console.log(`Removing static files`);
      const credentials = this.getCredentials();
      // 1. remove cos
      if (staticConf.cos) {
        const { cos: cosState } = staticConf as StaticOutput;
        if (cosState.bucket) {
          const { bucket } = cosState;
          const cos = new Cos(credentials, region);
          await cos.remove({ bucket });
        }
      }
      // 2. remove cdn
      if (staticConf.cdn) {
        const cdn = new Cdn(credentials);
        try {
          await cdn.remove(staticConf.cdn);
        } catch (e) {
          // no op
        }
      }
      console.log(`Remove static config success`);
    }
  }

  async remove() {
    console.log(`Removing application`);

    const { state } = this;
    const { region } = state;
    const {
      namespace,
      functionName,
      created,
      serviceId,
      apigwDisabled,
      customDomains,
      apiList,
      environment,
    } = state;

    const credentials = this.getCredentials();

    // if disable apigw, no need to remove
    if (apigwDisabled !== true && serviceId) {
      const apigw = new Apigw(credentials, region);
      await apigw.remove({
        created,
        environment,
        serviceId,
        apiList,
        customDomains,
      });
    }

    if (functionName) {
      const scf = new Scf(credentials, region);
      await scf.remove({
        functionName,
        namespace,
      });
    }

    // remove static
    await this.removeStatic();

    this.state = {} as State;
  }

  async metrics(inputs: MetricsInputs = {}) {
    console.log(`Getting metrics data`);
    if (!inputs.rangeStart || !inputs.rangeEnd) {
      throw new ApiTypeError(
        `PARAMETER_${CONFIGS.framework.toUpperCase()}_METRICS`,
        'rangeStart and rangeEnd are require inputs',
      );
    }
    const { state } = this;
    const { region } = state;
    if (!region) {
      throw new ApiTypeError(
        `PARAMETER_${CONFIGS.framework.toUpperCase()}_METRICS`,
        'No region property in state',
      );
    }
    const { functionName, namespace } = state;
    if (functionName) {
      const options: { [prop: string]: any } = {
        funcName: functionName,
        namespace: namespace,
        region,
        timezone: inputs.tz,
      };
      if (state.serviceId) {
        options.apigwServiceId = state.serviceId;
        options.apigwEnvironment = state.environment || 'release';
      }
      const credentials = this.getCredentials();
      const mertics = new Metrics(credentials, options);
      const metricResults = await mertics.getDatas(
        inputs.rangeStart,
        inputs.rangeEnd,
        Metrics.Type.All,
      );
      return metricResults;
    }
    throw new ApiTypeError(
      `PARAMETER_${CONFIGS.framework.toUpperCase()}_METRICS`,
      'Function name not define',
    );
  }
}
