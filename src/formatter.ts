import * as AdmZip from 'adm-zip';
import { CdnDeployInputs } from 'tencent-component-toolkit/lib/modules/cdn/interface';
import { ApiTypeError } from 'tencent-component-toolkit/lib/utils/error';
import { Inputs, CosInputs, CdnInputs, ScfInputs, ApigwInputs, State } from './interface';
import { getConfig } from './config';
const CONFIGS = getConfig();

import {
  removeAppid,
  generateId,
  getDefaultFunctionName,
  validateTraffic,
  getDefaultServiceName,
  getDefaultServiceDescription,
} from './utils';

export const formatStaticCosInputs = async (
  cosConf: CosInputs,
  appId: string,
  codeZipPath: string,
  region: string,
) => {
  try {
    const staticCosInputs = [];
    const sources = cosConf.sources || CONFIGS.defaultStatics;
    const { bucket } = cosConf;
    // remove user append appid
    const bucketName = removeAppid(bucket, appId);
    const staticPath = `/tmp/${generateId()}`;
    const codeZip = new AdmZip(codeZipPath);
    const entries = codeZip.getEntries();

    // traverse sources, generate static directory and deploy to cos
    for (let i = 0; i < sources.length; i++) {
      const curSource = sources[i];
      const entryName = `${curSource.src}`;
      let exist = false;
      entries.forEach((et) => {
        if (et.entryName.indexOf(entryName) === 0) {
          codeZip.extractEntryTo(et, staticPath, true, true);
          exist = true;
        }
      });
      if (exist) {
        const cosInputs = {
          force: true,
          protocol: 'https',
          bucket: `${bucketName}-${appId}`,
          src: `${staticPath}/${entryName}`,
          keyPrefix: curSource.targetDir || '/',
          // 通过设置 policy 来支持公网访问
          policy: CONFIGS.getPolicy(region, bucket, appId),
        };

        staticCosInputs.push(cosInputs);
      }
    }
    return {
      bucket: `${bucketName}-${appId}`,
      staticCosInputs,
    };
  } catch (e) {
    throw new ApiTypeError(
      `UTILS_${CONFIGS.framework.toUpperCase()}_prepareStaticCosInputs`,
      e.message,
      e.stack,
    );
  }
};

export const formatStaticCdnInputs = async (cdnConf: CdnInputs, origin: string) => {
  const cdnInputs: CdnDeployInputs = {
    async: true,
    area: cdnConf.area || 'mainland',
    domain: cdnConf.domain,
    serviceType: 'web',
    origin: {
      origins: [origin],
      originType: 'cos',
      originPullProtocol: 'https',
    },
  };
  if (cdnConf.https) {
    // using these default configs, for making user's config more simple
    cdnInputs.forceRedirect = cdnConf.forceRedirect || CONFIGS.defaultCdnConfig.forceRedirect;
    if (!cdnConf.https.certId) {
      throw new ApiTypeError(
        `PARAMETER_${CONFIGS.framework.toUpperCase()}_HTTPS`,
        'https.certId is required',
      );
    }
    cdnInputs.https = {
      ...CONFIGS.defaultCdnConfig.https,
      ...{
        http2: cdnConf.https.http2 || 'on',
        certInfo: {
          certId: cdnConf.https.certId,
        },
      },
    };
  }
  if (cdnConf.autoRefresh !== false) {
    cdnInputs.refreshCdn = {
      flushType: cdnConf.refreshType || 'delete',
      urls: [`http://${cdnInputs.domain}`, `https://${cdnInputs.domain}`],
    };
  }

  return cdnInputs;
};

export const formatInputs = (state: State, inputs: Partial<Inputs> = {}) => {
  // 对function inputs进行标准化
  const tempFunctionConf: ScfInputs = inputs.functionConf ?? ({} as any);
  const region = inputs.region ?? 'ap-guangzhou';

  // chenck state function name
  const stateFunctionName = state.functionName;

  const functionConf: ScfInputs = Object.assign(tempFunctionConf, {
    code: {
      src: inputs.src,
      bucket: inputs?.srcOriginal?.bucket,
      object: inputs?.srcOriginal?.object,
    },
    name:
      tempFunctionConf.name ?? inputs.functionName ?? stateFunctionName ?? getDefaultFunctionName(),
    region: region,
    role: tempFunctionConf.role ?? inputs.role ?? '',
    handler: tempFunctionConf.handler ?? inputs.handler ?? CONFIGS.handler,
    runtime: tempFunctionConf.runtime ?? inputs.runtime ?? CONFIGS.runtime,
    namespace: tempFunctionConf.namespace ?? inputs.namespace ?? CONFIGS.namespace,
    description: tempFunctionConf.description ?? inputs.description ?? CONFIGS.description,
    layers: tempFunctionConf.layers ?? inputs.layers ?? [],
    cfs: tempFunctionConf.cfs ?? [],
    publish: inputs.publish,
    traffic: inputs.traffic,
    lastVersion: state.lastVersion,
    timeout: tempFunctionConf.timeout ?? CONFIGS.timeout,
    memorySize: tempFunctionConf.memorySize ?? CONFIGS.memorySize,
    tags: tempFunctionConf.tags ?? inputs.tags ?? null,
  });

  const entryFile = inputs.entryFile || CONFIGS.defaultEntryFile;
  functionConf.environment = {
    variables: entryFile
      ? {
          SLS_ENTRY_FILE: entryFile,
        }
      : {},
  };
  const { defaultEnvs } = CONFIGS;
  defaultEnvs.forEach((item) => {
    if (functionConf.environment?.variables) {
      functionConf.environment.variables[item.key] = item.value;
    }
  });

  // django 项目需要 projectName
  if (CONFIGS.framework === 'django') {
    functionConf.projectName =
      tempFunctionConf.projectName ??
      tempFunctionConf.djangoProjectName ??
      inputs.djangoProjectName ??
      '';
  }

  // validate traffic
  if (inputs.traffic !== undefined) {
    validateTraffic(inputs.traffic);
  }
  functionConf.needSetTraffic = inputs.traffic !== undefined && functionConf.lastVersion;

  if (tempFunctionConf.environment?.variables) {
    functionConf.environment.variables = {
      ...functionConf.environment.variables,
      ...(tempFunctionConf.environment.variables || {}),
    };
  }

  if (tempFunctionConf.vpcConfig) {
    functionConf.vpcConfig = tempFunctionConf.vpcConfig;
  }

  // 对apigw inputs进行标准化
  const tempApigwConf: ApigwInputs = inputs.apigatewayConf ?? ({} as any);
  const apigatewayConf: ApigwInputs = Object.assign(tempApigwConf, {
    serviceId: tempApigwConf.serviceId ?? inputs.serviceId,
    region: region,
    isDisabled: tempApigwConf.isDisabled === true,
    serviceName: tempApigwConf.serviceName ?? inputs.serviceName ?? getDefaultServiceName(),
    serviceDesc: tempApigwConf.serviceDesc || getDefaultServiceDescription(),
    protocols: tempApigwConf.protocols || ['http'],
    environment: tempApigwConf.environment ? tempApigwConf.environment : 'release',
    customDomains: tempApigwConf.customDomains || [],
  });

  if (!apigatewayConf.endpoints) {
    apigatewayConf.endpoints = [
      {
        path: tempApigwConf.path || '/',
        enableCORS: tempApigwConf.enableCORS,
        serviceTimeout: tempApigwConf.serviceTimeout,
        method: 'ANY',
        apiName: tempApigwConf.apiName || 'index',
        function: {
          isIntegratedResponse: true,
          functionName: functionConf.name!,
          functionNamespace: functionConf.namespace!,
          functionQualifier:
            (tempApigwConf.function && tempApigwConf.function.functionQualifier) || '$LATEST',
        },
      },
    ];
  }
  if (tempApigwConf.usagePlan) {
    apigatewayConf.endpoints[0].usagePlan = {
      usagePlanId: tempApigwConf.usagePlan.usagePlanId,
      usagePlanName: tempApigwConf.usagePlan.usagePlanName,
      usagePlanDesc: tempApigwConf.usagePlan.usagePlanDesc,
      maxRequestNum: tempApigwConf.usagePlan.maxRequestNum,
    };
  }
  if (tempApigwConf.auth) {
    apigatewayConf.endpoints[0].auth = {
      secretName: tempApigwConf.auth.secretName,
      secretIds: tempApigwConf.auth.secretIds,
    };
  }

  return {
    region,
    functionConf,
    apigatewayConf,
  };
};
