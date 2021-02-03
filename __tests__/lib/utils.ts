const { ServerlessSDK } = require('@serverless/platform-client-china');

const generateId = () =>
  Math.random()
    .toString(36)
    .substring(6);

const getServerlessSdk = (orgName: string, orgUid: string) => {
  const sdk = new ServerlessSDK({
    context: {
      orgUid,
      orgName,
    },
  });
  return sdk;
};

export { generateId, getServerlessSdk };
