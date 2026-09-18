import { APIGatewayProxyHandler } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { db } from './db';
import { success, error } from './responses';
import { getUserId } from './auth';

const INVOICES_TABLE = process.env.INVOICES_TABLE!;
const PAYMENTS_TABLE = process.env.PAYMENTS_TABLE!;

export const handler: APIGatewayProxyHandler = async (event) => {
  const clientId = event.pathParameters?.clientId;
  if (!clientId) return error(400, 'Missing clientId');
  const userId = getUserId(event);

  try {
    const { Items: invoices } = await db.send(new QueryCommand({
      TableName: INVOICES_TABLE,
      KeyConditionExpression: 'userId = :u',
      FilterExpression: 'clientId = :c',
      ExpressionAttributeValues: { ':u': userId, ':c': clientId }
    }));

    const { Items: allPayments } = await db.send(new QueryCommand({
      TableName: PAYMENTS_TABLE,
      KeyConditionExpression: 'userId = :u',
      ExpressionAttributeValues: { ':u': userId }
    }));

    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;
    let totalOverdue = 0;
    const now = new Date().toISOString();

    for (const inv of invoices || []) {
      if (inv.status === 'cancelled') continue;

      const invAmount = inv.amountMinor || 0;
      const invPayments = (allPayments || []).filter(p => p.invoiceId === inv.invoiceId);
      const paidForInv = invPayments.reduce((sum, p) => sum + (p.amountMinor || 0), 0);
      const balance = invAmount - paidForInv;

      totalInvoiced += invAmount;
      totalPaid += paidForInv;

      if (inv.status !== 'draft') {
        totalOutstanding += balance;
        if (balance > 0 && inv.dueDate && inv.dueDate < now) {
          totalOverdue += balance;
        }
      }
    }

    return success({
      clientId,
      totalInvoiced,
      totalPaid,
      totalOutstanding,
      totalOverdue
    });
  } catch (err: any) {
    return error(500, err.message);
  }
};