import { APIGatewayProxyEvent } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

const dynamoDb = new DynamoDB.DocumentClient({ region: process.env.DEFAULT_REGION });
const TABLE_NAME = process.env.DATABASE_NAME || '';

export const handler = async (event: APIGatewayProxyEvent) => {
    try {
        const arrayChannels = ['watchorders', 'watchticker', 'watchtickers',];

        const authorizer = event?.requestContext?.authorizer;
        if (!authorizer || !authorizer?.accountId) throw new Error('AccountId not found.')

        const connectionId = event?.requestContext?.connectionId;
        if (!connectionId) throw new Error('ConnectionId not found');

        const body = (event?.body) ? JSON.parse(event?.body) : undefined;
        if (!body || !body?.channel) throw new Error('Channel is requerid')

        const isChannel = arrayChannels.includes(body?.channel.toLowerCase());
        if (!isChannel) throw new Error('Channel not found');

        const result = await fetchChannels(connectionId, authorizer?.accountId);
        let channels = result;

        let channel = body?.channel.toLowerCase();
        if (channel == 'watchticker' && !!body) channel = `${channel}#${body?.symbol}`;

        if (body?.action == 'subscribe') {
            if (channels.length > 0) {
                channels = await channels.filter((item: any) => item.toLowerCase() != channel);
            }

            channels.push(channel);
        } else if (body?.action == 'unsubscribe') {
            channels = await channels?.filter((item: any) => item?.toLowerCase() != channel);

            const index = channels.indexOf(channel);
            if (index != -1) channels.splice(index, 1);
        }

        await addConnectionId(connectionId, authorizer?.accountId, channels);

        return {
            statusCode: 200,
            body: JSON.stringify(
                'Data successfully saved.'
            )
        };
    } catch (err: any) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: err.message
            }),
        };
    }
};

async function fetchChannels(connectionId: string, accountId: string) {
    const params = {
        TableName: TABLE_NAME,
        Key: {
            "account": `ACCOUNT#${accountId}`,
            "id": connectionId
        }
    };

    try {
        const result = await dynamoDb.get(params).promise();
        return (result?.Item?.channels) ? JSON.parse(result?.Item?.channels) : [];
    } catch (e: any) {
        throw new Error(e.message)
    }
}

async function addConnectionId(connectionId: string, accountId: string, body: string) {
    return dynamoDb.put({
        TableName: TABLE_NAME,
        Item: {
            "account": `ACCOUNT#${accountId}`,
            "id": connectionId,
            channels: JSON.stringify(body)

        },
    }).promise();
}
