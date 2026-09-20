import { APIGatewayProxyHandler } from 'aws-lambda';
import { GetCommand, PutCommand, DeleteCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';
import { db } from './db';
import { success, error } from './responses';
import { getUserId } from './auth';
import { openSearchClient, INDEX_NAME, ensureIndexExists } from './opensearch';

const TABLE_NAME = process.env.INVOICES_TABLE!;

export const handler: APIGatewayProxyHandler = async (event) => {
  const method = event.httpMethod;
  const invoiceId = event.pathParameters?.invoiceId;
  const clientId = event.pathParameters?.clientId;
  const userId = getUserId(event);

  try {
    if (method === 'GET' && clientId && !invoiceId) {
      const { Items } = await db.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'userId = :u',
        FilterExpression: 'clientId = :c',
        ExpressionAttributeValues: { ':u': userId, ':c': clientId }
      }));
      return success(Items || []);
    }

    if (method === 'POST' && clientId) {
      const body = JSON.parse(event.body || '{}');
      const newInvoice = {
        userId,
        invoiceId: randomUUID(),
        clientId,
        amountMinor: body.amountMinor || 0,
        status: 'draft',
        dueDate: body.dueDate,
        description: body.description || '',
        createdAt: new Date().toISOString()
      };

      // 1. Save to DynamoDB (Source of Truth)
      await db.send(new PutCommand({ TableName: TABLE_NAME, Item: newInvoice }));

      // 2. Sync to OpenSearch Index
      try {
        await ensureIndexExists();
        await openSearchClient.index({
          index: INDEX_NAME,
          id: newInvoice.invoiceId,
          body: newInvoice,
          refresh: true
        });
      } catch (osErr) {
        console.error('Failed to index invoice in OpenSearch:', osErr);
      }

      return success(newInvoice, 201);
    }

    if (method === 'GET' && invoiceId) {
      const { Item } = await db.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { userId, invoiceId }
      }));
      return Item ? success(Item) : error(404, 'Invoice not found');
    }

    if (method === 'PUT' && invoiceId) {
      const body = JSON.parse(event.body || '{}');
      const { Attributes } = await db.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { userId, invoiceId },
        UpdateExpression: 'set #s = :s, amountMinor = :a',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: { ':s': body.status, ':a': body.amountMinor },
        ReturnValues: 'ALL_NEW'
      }));
      return success(Attributes);
    }

    if (method === 'DELETE' && invoiceId) {
      await db.send(new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { userId, invoiceId }
      }));
      return success({ deleted: true });
    }

    return error(400, 'Unsupported route');
  } catch (err: any) {
    return error(500, err.message);
  }
};