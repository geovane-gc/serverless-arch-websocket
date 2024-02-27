import { APIGatewayProxyEvent } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

const dynamoDb = new DynamoDB.DocumentClient({ region: process.env.DEFAULT_REGION });
const TABLE_NAME = process.env.DATABASE_NAME || '';

export const handler = async (event: APIGatewayProxyEvent) => {
  try {
    const authorizer = event?.requestContext?.authorizer;
    if (!authorizer || !authorizer?.accountId) throw new Error('AccountId not found')

    const connectionId = event?.requestContext?.connectionId;
    if (!connectionId) throw new Error('ConnectionId not found');

    await deleteData(connectionId, authorizer?.accountId);

    return {
      statusCode: 200,
      body: 'Data successfully saved'
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


function deleteData(connectionId: string, accountId: string) {
  const params = {
    TableName: TABLE_NAME,
    Key: {
      "account": `ACCOUNT#${accountId}`,
      "id": connectionId
    }
  };

  return dynamoDb.delete(params).promise()
    .then(data => {
      console.log('DeleteItem succeeded:', JSON.stringify(data, null, 2));
    })
    .catch(err => {
      console.error('Unable to delete item. Error JSON:', JSON.stringify(err, null, 2));
    });
}