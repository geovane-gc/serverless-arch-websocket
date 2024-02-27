import { APIGatewayProxyEvent } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

const dynamoDb = new DynamoDB.DocumentClient({
  region: process.env.DEFAULT_REGION,
});
const TABLE_NAME = process.env.DATABASE_NAME || 'SamTestWebSocketTableName';

export const handler = async (event: APIGatewayProxyEvent) => {
  try {
    const authorizer = event?.requestContext?.authorizer;
    if (!authorizer || !authorizer?.accountId)
      throw new Error('AccountId not found');

    const connectionId = event?.requestContext?.connectionId;
    if (!connectionId) throw new Error('ConnectionId not found');

    await addData(connectionId, authorizer?.accountId);

    return {
      statusCode: 200,
      body: 'Data successfully saved.',
    };
  } catch (err: any) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: err.message,
      }),
    };
  }
};

function addData(connectionId: string, accountId: string) {
  return dynamoDb
    .put({
      TableName: TABLE_NAME,
      Item: {
        account: `ACCOUNT#${accountId}`,
        id: connectionId,
      },
    })
    .promise();
}
