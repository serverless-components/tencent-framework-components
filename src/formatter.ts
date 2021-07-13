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

    // 删除用户填写时携带的 appid
    const bucketName = removeAppid(bucket, appId);
    const staticPath = `/tmp/${generateId()}`;
    const codeZip = new AdmZip(codeZipPath);
    const entries = codeZip.getEntries();

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
        };

        staticCosInputs.push(cosInputs);
      }
    }
    return {
      bucket: `${bucketName}-${appId}`,
      staticCosInputs,
      // 通过设置 policy 来支持公网访问
      policy: CONFIGS.getPolicy(region, `${bucketName}-${appId}`, appId),
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
    onlyRefresh: cdnConf.onlyRefresh,
  };
  if (cdnConf.https) {
    // 通过提供默认的配置来简化用户配置
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
  // 标准化函数参数
  const tempFunctionConf: ScfInputs = inputs.functionConf ?? ({} as any);
  const region = inputs.region ?? 'ap-guangzhou';

  // 获取状态中的函数名称
  const regionState = state[region];
  const stateFunctionName = state.functionName || (regionState && regionState.funcitonName);

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
    publish: tempFunctionConf.publish || inputs.publish,
    traffic: tempFunctionConf.traffic || inputs.traffic,
    lastVersion: state.lastVersion,
    timeout: tempFunctionConf.timeout ?? CONFIGS.timeout,
    memorySize: tempFunctionConf.memorySize ?? CONFIGS.memorySize,
    tags: tempFunctionConf.tags ?? inputs.tags ?? null,
  });

  if (!functionConf.environment?.variables) {
    functionConf.environment = {
      variables: {},
    };
  }
  // 添加框架需要添加的默认环境变量
  const { defaultEnvs } = CONFIGS;
  defaultEnvs.forEach((item) => {
    functionConf.environment!.variables![item.key] = item.value;
  });

  // 添加入口文件环境变量
  const entryFile = functionConf.entryFile || inputs.entryFile || CONFIGS.defaultEntryFile;
  if (entryFile) {
    functionConf.environment!.variables!['SLS_ENTRY_FILE'] = entryFile;
  }

  // django 项目需要 projectName 参数
  if (CONFIGS.framework === 'django') {
    functionConf.projectName =
      tempFunctionConf.projectName ??
      tempFunctionConf.djangoProjectName ??
      inputs.djangoProjectName ??
      '';
  }

  // TODO: 验证流量配置，将废弃
  if (inputs.traffic !== undefined) {
    validateTraffic(inputs.traffic);
  }
  // TODO: 判断是否需要配置流量，将废弃
  functionConf.needSetTraffic = inputs.traffic !== undefined && functionConf.lastVersion;

  // 初始化 VPC 配置，兼容旧的vpc配置
  const vpc = tempFunctionConf.vpcConfig || tempFunctionConf.vpc || inputs.vpcConfig || inputs.vpc;
  if (vpc) {
    functionConf.vpcConfig = vpc;
  }

  //  标准化网关配置参数
  const tempApigwConf: ApigwInputs = inputs.apigatewayConf ?? ({} as any);
  const apigatewayConf: ApigwInputs = Object.assign(tempApigwConf, {
    serviceId: tempApigwConf.serviceId ?? tempApigwConf.id ?? inputs.serviceId,
    region: region,
    isDisabled: tempApigwConf.isDisabled === true,
    serviceName:
      tempApigwConf.serviceName ??
      tempApigwConf.name ??
      inputs.serviceName ??
      getDefaultServiceName(),
    serviceDesc:
      tempApigwConf.serviceDesc ?? tempApigwConf.description ?? getDefaultServiceDescription(),
    protocols: tempApigwConf.protocols || ['http'],
    environment: tempApigwConf.environment ? tempApigwConf.environment : 'release',
    customDomains: tempApigwConf.customDomains || [],
  });

  // 如果没配置，添加默认的 API 配置，通常 Web 框架组件是不要用户自定义的
  if (!apigatewayConf.endpoints) {
    apigatewayConf.endpoints = [
      {
        path: tempApigwConf.path || '/',
        enableCORS: tempApigwConf.enableCORS ?? tempApigwConf.cors,
        serviceTimeout: tempApigwConf.serviceTimeout ?? tempApigwConf.timeout,
        method: tempApigwConf.method || 'ANY',
        apiName: tempApigwConf.apiName || 'index',
        isBase64Encoded: tempApigwConf.isBase64Encoded,
        function: {
          isIntegratedResponse: true,
          functionName: functionConf.name!,
          functionNamespace: functionConf.namespace,
          functionQualifier:
            (tempApigwConf.function && tempApigwConf.function.functionQualifier) ||
            apigatewayConf.qualifier ||
            '$DEFAULT',
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
