const apiKeysToAccountIds: any = {
  '0x037f902f893b5d6184fd512678a9a843c4f9033e945819232712c3ce767de9e268':
    'itau',
  '0xf672b13c86ebca387a28f6f290cfd09782cafb5c9e05453d8febfd5449bc441a': 'itau1',
  '0x75ace73cc2d27ea0e6afb11968464ae3b2378e65d1419cd7d62f7236b6aeb2a7': 'itau2',
  '0x08ad77bba22d2fa4e0181d556f873d46d2256db6c817f17b2fb064c406c19c3e': 'itau3',
  '0xc875b2f019fcbdee229ff23d0a79c146fbbfe01b27afd1363b98ea41255cea7b': 'itau4',
  '0xebd1f8903e431c3edbe8a53a9934dc4da3bab248de54bf259ff9e41bb7fd9289': 'itau5',
};
export const handler = async (event: any) => {
  const apiKey = event.queryStringParameters.apiKey;

  if (apiKey in apiKeysToAccountIds) {
    const generateAllowVar = generateAllow(
      apiKey,
      event.methodArn,
      apiKeysToAccountIds[apiKey],
    );

    return generateAllowVar;
  } else {
    return generateDeny(apiKey, event.methodArn);
  }
};

async function generatePolicy(
  principalId: string,
  effect: string,
  resource: string,
  accountId: string = '',
) {
  const authResponse: any = {};

  authResponse.principalId = principalId;

  if (effect && resource) {
    const policyDocument: any = {};
    const statementOne: any = {};

    policyDocument.Version = '2012-10-17';
    policyDocument.Statement = [];

    statementOne.Action = 'execute-api:Invoke';
    statementOne.Effect = effect;
    statementOne.Resource = resource;

    policyDocument.Statement[0] = statementOne;

    authResponse.policyDocument = policyDocument;
  }

  authResponse.context = {
    accountId: accountId,
    environment: 'sandbox',
    createdAt: '2019-01-03T12:15:42',
  };

  return authResponse;
}

async function generateAllow(
  principalId: string,
  resource: string,
  accountId: string,
) {
  return generatePolicy(principalId, 'Allow', resource, accountId);
}

async function generateDeny(principalId: string, resource: string) {
  return generatePolicy(principalId, 'Deny', resource);
}
