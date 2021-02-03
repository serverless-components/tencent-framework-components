declare module '@serverless/core' {
  declare class Component<S> {
    state: S;
    credentials: {
      tencent: {
        tmpSecrets: {
          TmpSecretId: string;
          TmpSecretKey: string;
          Token: string;
          appId: string;
        };
      };
    };

    save();

    codeInjected: boolean;

    uploadSourceZipToCOS(zipPath: string, uploadUrl: string, optionsA: {}, optionsB: {});
    getSDKEntries(entry: string): {};
  }
}
