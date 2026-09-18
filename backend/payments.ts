import { APIGatewayProxyHandler } from 'aws-lambda';
import { GetCommand, PutCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';
import { db } from './db';
import { success, error } from './responses';
import { getUserId } from './auth';

const PAYMENTS_TABLE = process.env.PAYMENTS_TABLE!;
const INVOICES_TABLE = process.env.INVOICES_TABLE!;

export const handler: APIGatewayProxyHandler = async (event) => {
  const method = event.httpMethod;
  const invoiceId = event.pathParameters?.invoiceId;
  const paymentId = event.pathParameters?.paymentId;
  const userId = getUserId(event);

  try {
    if (method === 'GET' && invoiceId) {
      const { Items } = await db.send(new QueryCommand({
        TableName: PAYMENTS_TABLE,
        KeyConditionExpression: 'userId = :u',
        FilterExpression: 'invoiceId = :i',
        ExpressionAttributeValues: { ':u': userId, ':i': invoiceId }
      }));
      return success(Items || []);
    }

    if (method === 'POST' && invoiceId) {
      const body = JSON.parse(event.body || '{}');
      const newPaymentAmount = body.amountMinor || 0;

      const { Item: invoice } = await db.send(new GetCommand({
        TableName: INVOICES_TABLE,
        Key: { userId, invoiceId }
      }));
      if (!invoice) return error(404, 'Invoice not found');

      const { Items: payments } = await db.send(new QueryCommand({
        TableName: PAYMENTS_TABLE,
        KeyConditionExpression: 'userId = :u',
        FilterExpression: 'invoiceId = :i',
        ExpressionAttributeValues: { ':u': userId, ':i': invoiceId }
      }));
      const totalPaidSoFar = (payments || []).reduce((sum, p) => sum + (p.amountMinor || 0), 0);

      if (totalPaidSoFar + newPaymentAmount > invoice.amountMinor) {
        return error(400, 'Payment would exceed invoice total');
      }

      const newPayment = {
        userId,
        paymentId: randomUUID(),
        invoiceId,
        amountMinor: newPaymentAmount,
        createdAt: new Date().toISOString()
      };
      await db.send(new PutCommand({ TableName: PAYMENTS_TABLE, Item: newPayment }));
      return success(newPayment, 201);
    }

    if (method === 'DELETE' && paymentId) {
      await db.send(new DeleteCommand({
        TableName: PAYMENTS_TABLE,
        Key: { userId, paymentId }
      }));
      return success({ deleted: true });
    }

    return error(400, 'Unsupported route');
  } catch (err: any) {
    return error(500, err.message);
  }
};