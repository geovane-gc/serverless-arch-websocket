import AWS, { DynamoDB } from 'aws-sdk';

const dynamoDb = new DynamoDB.DocumentClient({ region: process.env.DEFAULT_REGION });
const TABLE_NAME = process.env.DATABASE_NAME || 'caas-websocket';

const apiGatewayManagementApi = new AWS.ApiGatewayManagementApi({
  apiVersion: process.env.API_VERSION || '2018-11-29',
  endpoint: process.env.API_ENDPOINT || '',
});

export const handler = async (event: any) => {
  try {
    const { MessageBody, MessageAttributes } = event?.detail || event;
    if (!MessageBody || !MessageAttributes) throw new Error('Data is requerid');

    const authorizer = MessageAttributes;
    if (!authorizer || !authorizer?.accountId) throw new Error('AccountId not found')

    const accountDataId = await fetchChannels(authorizer?.accountId);
    await sendMessageToClients(accountDataId, MessageBody)

    return {
      statusCode: 200,
      body: 'Data successfully sended'
    };
  } catch (err: any) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: err.message
      }),
    };
  }
};

async function fetchChannels(accountId?: string) {
  const params = {
    TableName: TABLE_NAME,
    FilterExpression: 'begins_with(account, :pk)',
    ExpressionAttributeValues: {
      ':pk': `ACCOUNT#${accountId}`,
    }
  };

  try {
    const result = await dynamoDb.scan(params).promise();
    return result?.Items;
  } catch (e: any) {
    throw new Error(e.message)
  }
}

async function sendMessageToClients(data: any, body: any) {
  const dataBody = body;

  for (const item of data) {
    const dataChannels = item?.channels;

    if (dataChannels) {
      let channel = dataBody?.channel;
      if (channel == 'watchticker') channel = `${channel}#${dataBody?.data?.symbol}`;

      const index = dataChannels.indexOf(channel);
      if (index !== -1) {
        const connectionId = item.id;

        try {
          await apiGatewayManagementApi.postToConnection({
            ConnectionId: connectionId,
            Data: JSON.stringify({ channel: channel, message: dataBody?.message })
          }).promise();
        } catch (error: any) {
          if (error.statusCode === 410) {
            await dynamoDb.delete({
              TableName: TABLE_NAME,
              Key: { connectionId }
            }).promise();
          }

          throw new Error(error);
        }
      }
    }
  }
}