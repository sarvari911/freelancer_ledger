import { APIGatewayProxyHandler } from 'aws-lambda';
import { QueryCommand, UpdateCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { db } from './db';
import { success, error } from './responses';
import { openSearchClient, INDEX_NAME, ensureIndexExists } from './opensearch';

const INVOICES_TABLE = process.env.INVOICES_TABLE!;
const PAYMENTS_TABLE = process.env.PAYMENTS_TABLE!;

export const handler: APIGatewayProxyHandler = async () => {
  try {
    const now = new Date().toISOString();

    // 1. Scan all invoices across the table
    const { Items: invoices } = await db.send(new ScanCommand({ TableName: INVOICES_TABLE }));
    
    // 2. Fetch all payments to calculate outstanding balances
    const { Items: payments } = await db.send(new ScanCommand({ TableName: PAYMENTS_TABLE }));

    let markedOverdueCount = 0;

    for (const inv of invoices || []) {
      // Only check invoices that aren't already paid, draft, or cancelled
      if (inv.status === 'paid' || inv.status === 'draft' || inv.status === 'cancelled') {
        continue;
      }

      const invPayments = (payments || []).filter(p => p.invoiceId === inv.invoiceId);
      const paidTotal = invPayments.reduce((sum, p) => sum + (p.amountMinor || 0), 0);
      const hasBalance = paidTotal < (inv.amountMinor || 0);

      // Check if due date has passed and balance remains
      if (inv.dueDate && inv.dueDate < now && hasBalance && inv.status !== 'overdue') {
        // Update status in DynamoDB
        await db.send(new UpdateCommand({
          TableName: INVOICES_TABLE,
          Key: { userId: inv.userId, invoiceId: inv.invoiceId },
          UpdateExpression: 'set #s = :s',
          ExpressionAttributeNames: { '#s': 'status' },
          ExpressionAttributeValues: { ':s': 'overdue' }
        }));

        // Sync status update to OpenSearch
        try {
          await ensureIndexExists();
          await openSearchClient.update({
            index: INDEX_NAME,
            id: inv.invoiceId,
            body: { doc: { status: 'overdue' } }
          });
        } catch (osErr) {
          console.error('Failed to update OpenSearch status:', osErr);
        }

        markedOverdueCount++;
      }
    }

    return success({ message: 'Overdue scan completed', markedOverdueCount });
  } catch (err: any) {
    return error(500, err.message);
  }
};