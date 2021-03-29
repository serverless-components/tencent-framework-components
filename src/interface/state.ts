import {
  ApiEndpoint,
  ApigwBindCustomDomainOutputs,
} from 'tencent-component-toolkit/lib/modules/apigw/interface';
import { StaticOutput } from './outputs';

export type State = {
  zipPath?: string;
  region?: string;
  regionList?: string[];
  lambdaArn?: string;

  configTrafficVersion?: string;
  lastVersion?: string;
  traffic?: number;
  apigwDisabled?: boolean;
  bucket?: string;
  object?: string;
  staticConf?: StaticOutput;
  static?: StaticOutput;

  functionName?: string;
  runtime?: string;
  namespace?: string;
  environment: 'prepub' | 'test' | 'release';

  created: boolean;
  serviceId: string;

  apiList: ApiEndpoint[];
  customDomains: ApigwBindCustomDomainOutputs[];
} & Record<string, any>;
