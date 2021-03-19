import * as fs from 'fs';
import * as path from 'path';
import * as YAML from 'js-yaml';
import { Framework } from './interface';
type Policy = {
  Statement: [
    {
      Principal: { qcs: string[] };
      Effect: string;
      Action: string[];
      Resource: string[];
    },
  ];
  version: string;
};

type DefaultCdnConfig = {
  forceRedirect: {
    switch?: 'on' | 'off';
    redirectStatusCode: number;
    redirectType?: 'https';
  };
  https: {
    switch: 'on';
    http2: 'on';
  };
};

type FrameworkConfig = {
  region: string;
  templateUrl: string;
  framework: string;
  defaultEntryFile: string;
  handler: string;
  runtime: string;
  timeout: number;
  memorySize: number;
  namespace: string;
  description: string;
  defaultStatics: { src: string; targetDir: string }[];
  defaultCdnConfig: DefaultCdnConfig;
  acl: {
    permissions: string;
    grantRead: string;
    grantWrite: string;
    grantFullControl: string;
  };
  // eslint-disable-next-line
  getPolicy: (r: string, b: string, a: string) => Policy;
  injectSlsSdk?: boolean;
  pythonFrameworks?: string[];
  supportMetrics?: string[];
  defaultEnvs: {
    key: string;
    value: string;
  }[];
  cos: {
    lifecycle: {
      status: string;
      id: string;
      expiration: { days: string };
      abortIncompleteMultipartUpload: { daysAfterInitiation: string };
    }[];
  };
  cdn: {
    forceRedirect?: {
      switch?: 'on' | 'off' | undefined;
      redirectType?: 'https';
      redirectStatusCode: number;
    };
    https?: { switch?: 'on' | 'off' | undefined; http2?: 'on' | 'off' | undefined };
  };
};

type DefaultConfig = Partial<FrameworkConfig>;

const TEMPLATE_BASE_URL = 'https://serverless-templates-1300862921.cos.ap-beijing.myqcloud.com';

const frameworks: Record<Framework, { [prop: string]: any }> = {
  express: {
    injectSlsSdk: true,
    runtime: 'Nodejs10.15',
    defaultEntryFile: 'sls.js',
    defaultStatics: [{ src: 'public', targetDir: '/' }],
  },
  koa: {
    injectSlsSdk: true,
    runtime: 'Nodejs10.15',
    defaultEntryFile: 'sls.js',
    defaultStatics: [{ src: 'public', targetDir: '/' }],
  },
  egg: {
    injectSlsSdk: true,
    runtime: 'Nodejs10.15',
    defaultEntryFile: 'sls.js',
    defaultStatics: [{ src: 'public', targetDir: '/' }],
    defaultEnvs: [
      {
        key: 'SERVERLESS',
        value: '1',
      },
      {
        key: 'EGG_APP_CONFIG',
        value: '{"rundir":"/tmp","logger":{"dir":"/tmp"}}',
      },
    ],
  },
  nestjs: {
    injectSlsSdk: true,
    runtime: 'Nodejs10.15',
    defaultEntryFile: 'sls.js',
    defaultStatics: [{ src: 'public', targetDir: '/' }],
  },
  nextjs: {
    injectSlsSdk: true,
    runtime: 'Nodejs10.15',
    defaultEntryFile: 'sls.js',
    defaultStatics: [
      { src: '.next/static', targetDir: '/_next/static' },
      { src: 'public', targetDir: '/' },
    ],
  },
  nuxtjs: {
    injectSlsSdk: true,
    runtime: 'Nodejs10.15',
    defaultEntryFile: 'sls.js',
    defaultStatics: [
      { src: '.nuxt/dist/client', targetDir: '/' },
      { src: 'static', targetDir: '/' },
    ],
  },
  laravel: {
    injectSlsSdk: false,
    runtime: 'Php7',
    defaultEnvs: [
      {
        key: 'SERVERLESS',
        value: '1',
      },
      {
        key: 'VIEW_COMPILED_PATH',
        value: '/tmp/storage/framework/views',
      },
      {
        key: 'SESSION_DRIVER',
        value: 'array',
      },
      {
        key: 'LOG_CHANNEL',
        value: 'stderr',
      },
      {
        key: 'APP_STORAGE',
        value: '/tmp/storage',
      },
    ],
  },
  thinkphp: {
    injectSlsSdk: false,
    runtime: 'Php7',
  },
  flask: {
    injectSlsSdk: false,
    runtime: 'Python3.6',
  },
  django: {
    injectSlsSdk: false,
    runtime: 'Python3.6',
  },
};

const CONFIGS: DefaultConfig = {
  // support metrics frameworks
  pythonFrameworks: ['flask', 'django'],
  supportMetrics: ['express', 'next', 'nuxt'],
  region: 'ap-guangzhou',
  description: 'Created by Serverless Component',
  handler: 'sl_handler.handler',
  timeout: 10,
  memorySize: 128,
  namespace: 'default',
  defaultEnvs: [
    {
      key: 'SERVERLESS',
      value: '1',
    },
  ],
  cos: {
    lifecycle: [
      {
        status: 'Enabled',
        id: 'deleteObject',
        expiration: { days: '10' },
        abortIncompleteMultipartUpload: { daysAfterInitiation: '10' },
      },
    ],
  },
  cdn: {
    forceRedirect: {
      switch: 'on',
      redirectType: 'https',
      redirectStatusCode: 301,
    },
    https: {
      switch: 'on',
      http2: 'on',
    },
  },

  defaultCdnConfig: {
    forceRedirect: {
      switch: 'on',
      redirectType: 'https',
      redirectStatusCode: 301,
    },
    https: {
      switch: 'on',
      http2: 'on',
    },
  },
  acl: {
    permissions: 'public-read',
    grantRead: '',
    grantWrite: '',
    grantFullControl: '',
  },
  getPolicy(region: string, bucket: string, appid: string) {
    return {
      Statement: [
        {
          Principal: { qcs: ['qcs::cam::anyone:anyone'] },
          Effect: 'Allow',
          Action: [
            'name/cos:HeadBucket',
            'name/cos:ListMultipartUploads',
            'name/cos:ListParts',
            'name/cos:GetObject',
            'name/cos:HeadObject',
            'name/cos:OptionsObject',
          ],
          Resource: [`qcs::cos:${region}:uid/${appid}:${bucket}/*`],
        },
      ],
      version: '2.0',
    };
  },
};

export const getConfig = (): FrameworkConfig => {
  const { name: framework } = YAML.load(
    // framework.yml 会在组件部署流程中动态生成
    fs.readFileSync(path.join(__dirname, 'framework.yml'), 'utf-8'),
  ) as { name: Framework };
  const templateUrl = `${TEMPLATE_BASE_URL}/${framework}-demo.zip`;
  const frameworkConfigs = frameworks[framework];
  return {
    framework,
    templateUrl,
    ...CONFIGS,
    ...frameworkConfigs,
  } as FrameworkConfig;
};
