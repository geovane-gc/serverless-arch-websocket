import { APIGatewayProxyEvent } from 'aws-lambda';

export const handler = async (event: APIGatewayProxyEvent) => {
  console.log('hello from your websocket!');

  return {
    statusCode: 200,
    body: 'Hello from your websocket.',
  };
};
