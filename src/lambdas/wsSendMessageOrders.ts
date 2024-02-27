import { SQSEvent } from 'aws-lambda';
import AWS, { DynamoDB } from 'aws-sdk';

const dynamoDb = new DynamoDB.DocumentClient({ region: process.env.DEFAULT_REGION });
const TABLE_NAME = process.env.DATABASE_NAME || 'caas-websocket';

const apiGatewayManagementApi = new AWS.ApiGatewayManagementApi({
  apiVersion: process.env.API_VERSION || '2018-11-29',
  endpoint: process.env.API_ENDPOINT || '',
});

export const handler = async (event: SQSEvent) => {
  try {

    for (const record of event.Records) {

      const body = JSON.parse(record?.body);

      const { MessageAccount, MessageBody } = body;
      if (!MessageAccount || !MessageBody) throw new Error('All data is requerid');
      console.log('WSOcket MessageAccount: ', MessageAccount)
      console.log('WSOcket MessageBody: ', MessageBody)

      const accountData = await fetchChannels(MessageAccount?.account);
      await sendMessageToClients(accountData, MessageBody)

    }

    return {
      statusCode: 200,
      body: 'Data successfully sended'
    };
  } catch (err: any) {
    console.error('ERROR: ', err?.message);

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

  // // Realizar a busca na tabela
  try {
    const result = await dynamoDb.scan(params).promise();
    return result?.Items;

  } catch (e: any) {
    console.log('Catch: ', e)
    throw new Error(e.message)
  }
}



async function sendMessageToClients(data: any, body: any) {
  //body: { message: string, channel: string, data: { symbol?: string } }
  // Enviar a mensagem para cada ConnectionID

  const dataBody = body;
  for (const item of data) {

    console.log('Item: ', item)
    const dataChannels = item?.channels;
    console.log('dataChannels: ', dataChannels)
    if (dataChannels) {

      let channel = dataBody?.channel;

      const index = dataChannels.indexOf(channel);
      if (index !== -1) {

        const connectionId = item.id;

        try {

          await apiGatewayManagementApi.postToConnection({
            ConnectionId: connectionId,
            Data: JSON.stringify({ channel: channel, message: dataBody?.message })
          }).promise();

        } catch (error: any) {

          console.error('Falha ao enviar mensagem:', error);

          // Se a conexão não existe mais, remover o ConnectionID do DynamoDB
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