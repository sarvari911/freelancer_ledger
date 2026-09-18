import { APIGatewayProxyHandler } from 'aws-lambda';
import { GetCommand, PutCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';
import { db } from './db';
import { success, error } from './responses';
import { getUserId } from './auth';

const TABLE_NAME = process.env.CLIENTS_TABLE!;

export const handler: APIGatewayProxyHandler = async (event) => {
  const method = event.httpMethod;
  const clientId = event.pathParameters?.clientId;
  const userId = getUserId(event);

  try {
    if (method === 'GET' && !clientId) {
      const { Items } = await db.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'userId = :u',
        ExpressionAttributeValues: { ':u': userId }
      }));
      return success(Items || []);
    }

    if (method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const newClient = {
        userId,
        clientId: randomUUID(),
        name: body.name,
        email: body.email,
        createdAt: new Date().toISOString()
      };
      await db.send(new PutCommand({ TableName: TABLE_NAME, Item: newClient }));
      return success(newClient, 201);
    }

    if (method === 'GET' && clientId) {
      const { Item } = await db.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { userId, clientId }
      }));
      return Item ? success(Item) : error(404, 'Client not found');
    }

    if (method === 'DELETE' && clientId) {
      await db.send(new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { userId, clientId }
      }));
      return success({ deleted: true });
    }

    return error(400, 'Unsupported route');
  } catch (err: any) {
    return error(500, err.message);
  }
};