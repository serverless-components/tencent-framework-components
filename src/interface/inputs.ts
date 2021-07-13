export interface ScfInputs {
  // 入口文件
  entryFile?: string;

  code?: { bucket?: string; object?: string; src?: string };
  // 函数名称
  name?: string;
  // 项目名称，仅支持 django 框架
  projectName?: string;
  // 项目名称，仅支持 django 框架，兼容旧的配置参数，同 projectName
  djangoProjectName?: string;
  // 函数运行角色
  role?: string;
  // 网关服务 ID
  serviceId?: string;
  // 执行方法
  handler?: string;
  // 运行环境
  runtime?: string;
  // 命名空间
  namespace?: string;
  // 函数描述
  description?: string;

  // 环境变量
  environment?: {
    variables?: Record<string, string>;
  };

  // 最新版本
  lastVersion?: string;

  // 层
  layers?: [];
  // 文件存储
  cfs?: [];
  // 超时时间
  timeout?: number;
  // $LATEST 流量占比
  traffic?: number;

  // 是否发布新版本
  publish?: boolean;

  // 是否启动异步执行
  asyncRunEnable?: boolean;
  // 是否启动状态追踪
  traceEnable?: boolean;

  // 内存大小
  memorySize?: number;
  // 标签
  tags?: {}[];
  // vpc 配置
  vpc?: { vpcId: string; subnetId: string };
  // vpc 配置，兼容老的配置
  vpcConfig?: { vpcId: string; subnetId: string };
  // 日志配置
  cls?: { logsetId: string; topicId: string };

  needSetTraffic?: boolean | string;
}

export interface ApigwInputs {
  oldState?: any;

  // 是否禁用 api网关部署
  isDisabled?: boolean;

  // 网关 ID
  id?: string;
  // 服务名称
  name?: string;
  // 描述
  description?: string;

  // 网关 ID，兼容老的配置
  serviceId?: string;
  // 服务名称，兼容老的配置
  serviceName?: string;
  // 描述，兼容老的配置
  serviceDesc?: string;

  // 关联函数别名
  qualifier?: string;

  // 发布环境
  environment?: 'prepub' | 'release' | 'test';
  // 自定义域名
  customDomains?: {
    // 域名
    domain: string;
    // 支持协议
    protocols: ('http' | 'https')[];
    // 证书 ID
    certificateId: string;
    // 是否是默认路径映射
    isDefaultMapping?: boolean;
    // 自定义路径映射配置
    pathMappingSet: [];
    // 网络类型
    netType: string;
    // 是否强制 HTTPS
    isForcedHttps: boolean;
  }[];

  // api 路径
  path?: string;
  // api 请求方法
  method?: string;
  // 开启 CORS
  cors?: boolean;
  // 开启 CORS，兼容老的配置
  enableCORS?: boolean;

  // 接口超时时间，兼容老的配置
  serviceTimeout?: number;
  // 接口超时时间
  timeout?: number;

  // API 名称
  apiName?: string;

  // 是否启用 Base64 编码
  isBase64Encoded?: boolean;

  // 支持协议
  protocols: ('http' | 'https')[];
  // API 列表
  endpoints: {
    // 路径
    path?: string;
    // 开启 CORS
    cors?: boolean;
    // 开启 CORS，兼容老的配置
    enableCORS?: boolean;
    // 接口超时时间，兼容老的配置
    serviceTimeout?: number;
    // 接口超时时间
    timeout?: number;
    // 请求犯法
    method?: string;
    // API 名称，兼容老的配置
    apiName?: string;
    // API 名称
    name?: string;
    // 是否启用 Base64 编码
    isBase64Encoded?: boolean;
    // 是否开启 Base64 编码的 header 触发
    isBase64Trigger?: { [propName: string]: any };

    // API 关联 SCF 后端配置
    function?: {
      // 函数名称
      functionName: string;
      // 命名空间
      functionNamespace?: string;
      // 函数别名，默认为 $DEFAULT
      functionQualifier?: string;
      // 是否开启集成响应
      isIntegratedResponse?: boolean;
    };

    // 使用计划
    usagePlan?: {
      // 用户自定义使用计划 ID
      usagePlanId: string;
      // 用户自定义的使用计划名称
      usagePlanName: string;
      // 用户自定义的使用计划描述
      usagePlanDesc: string;
      // 请求配额总数，如果为空，将使用-1 作为默认值，表示不开启
      maxRequestNum: number;
    };

    // 密钥鉴权
    auth?: {
      // 密钥名称
      secretName: string;
      // 密钥 ID
      secretIds?: string;
    };
  }[];

  // API 关联 SCF 后端配置
  function?: {
    // 命名空间
    functionQualifier: string;
  };

  // 使用计划
  usagePlan?: {
    usagePlanId: string;
    usagePlanName: string;
    usagePlanDesc: string;
    maxRequestNum: number;
  };

  // 密钥鉴权
  auth?: {
    secretName: string;
    secretIds?: string;
  };
}

export interface CosInputs {
  // 是否替换式部署
  replace?: boolean;
  // 桶名称
  bucket: string;
  // 需要上传的目录列表
  sources?: {
    // 目录路径
    src: string;
    // 上传到 COS 的目标路径
    targetDir: string;
  }[];
}

export interface CdnInputs {
  // CDN 域名
  domain: string;
  // 加速地域
  area?: string;
  // 自动刷新 CDN
  autoRefresh?: boolean;
  // 只刷新 CDN
  onlyRefresh?: boolean;
  // 刷新类型 delete | flush
  refreshType?: string;
  forceRedirect?: {
    switch?: 'on' | 'off' | undefined;
    redirectType?: 'https';
    redirectStatusCode: number;
  };
  https?: { switch?: 'on' | 'off' | undefined; http2?: 'on' | 'off' | undefined; certId: string };
}

export interface StaticInputs {
  cosConf: CosInputs;
  cdnConf?: CdnInputs;
}

export interface SrcObject {
  src?: string;
  dist?: string;
  hook?: string;
  exclude?: string[];
  targetDir?: string;
  bucket?: string;
  object?: string;
}

export interface Inputs {
  entryFile?: string;
  projectName?: string;
  djangoProjectName?: string;
  serviceId?: string;
  functionConf?: ScfInputs;
  apigatewayConf?: ApigwInputs;
  vpc?: { vpcId: string; subnetId: string };
  vpcConfig?: { vpcId: string; subnetId: string };
  serviceName?: string;

  region?: string;
  src?: string | SrcObject;
  role?: string;
  handler?: string;
  runtime?: string;
  namespace?: string;
  srcOriginal?: {
    bucket: string;
    object: string;
  };
  functionName?: string;
  description?: string;
  publish?: string;
  traffic?: number;
  tags?: number;
  layers?: string[];
  staticConf?: StaticInputs;
}

export interface MetricsInputs {
  tz?: string;
  rangeStart?: string;
  rangeEnd?: string;
}
