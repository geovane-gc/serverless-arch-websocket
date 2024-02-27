import { APIGatewayProxyEvent } from 'aws-lambda';

export const handler = async (event: APIGatewayProxyEvent) => {
  console.log('This is your default route from websocket!');

  return {
    statusCode: 200,
    body: 'This is your default route from websocket!',
  };
};
