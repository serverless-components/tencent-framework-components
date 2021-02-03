import { ApigwBindCustomDomainOutputs } from 'tencent-component-toolkit/lib/modules/apigw/interface';

export interface ScfOutputs {
  configTrafficVersion?: string;
  lastVersion?: string;
  functionName: string;
  runtime: string;
  namespace: string;
  traffic?: number;
}
export type ApigwOutputs = {
  serviceId: string;
  subDomain: string | string[];
  environment: 'prepub' | 'test' | 'release';
  url: string;
  customDomains?: ApigwBindCustomDomainOutputs[];
};

export interface StaticCosOutput {
  region: string;
  cosOrigin: string;
  bucket?: string;
  url?: string;
}

export interface StaticOutput {
  cos: StaticCosOutput;
  cdn?: any;
}

export interface Outputs {
  templateUrl?: string;
  region?: string;
  scf?: ScfOutputs;
  apigw?: ApigwOutputs;
  staticConf?: StaticOutput;
}
