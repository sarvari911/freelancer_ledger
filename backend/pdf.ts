import { APIGatewayProxyHandler } from 'aws-lambda';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { db } from './db';
import { s3 } from './s3';
import { success, error } from './responses';
import { getUserId } from './auth';

const INVOICES_TABLE = process.env.INVOICES_TABLE!;
const BUCKET_NAME = process.env.PDF_BUCKET || 'freelancer-ledger-pdfs-local';

export const handler: APIGatewayProxyHandler = async (event) => {
  const invoiceId = event.pathParameters?.invoiceId;
  const userId = getUserId(event);

  if (!invoiceId) return error(400, 'Missing invoiceId');

  try {
    // 1. Fetch invoice details from DynamoDB
    const { Item: invoice } = await db.send(new GetCommand({
      TableName: INVOICES_TABLE,
      Key: { userId, invoiceId }
    }));

    if (!invoice) return error(404, 'Invoice not found');

    // 2. Generate statement content
    const statementText = `
========================================
           FREELANCER STATEMENT         
========================================
Invoice ID  : ${invoice.invoiceId}
User ID     : ${invoice.userId}
Description : ${invoice.description}
Amount      : $${((invoice.amountMinor || 0) / 100).toFixed(2)}
Status      : ${invoice.status}
Due Date    : ${invoice.dueDate || 'N/A'}
Created At  : ${invoice.createdAt}
========================================
`;

    const s3Key = `statements/${userId}/${invoiceId}.txt`;

    // 3. Store statement inside LocalStack S3
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: statementText,
      ContentType: 'text/plain',
    }));

    // 4. Generate temporary pre-signed download URL (valid for 1 hour)
    const getCommand = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: s3Key });
    const rawDownloadUrl = await getSignedUrl(s3, getCommand, { expiresIn: 3600 });
    const downloadUrl = rawDownloadUrl.replace('host.docker.internal', '127.0.0.1');
    return success({
      invoiceId,
      s3Key,
      downloadUrl
    });
  } catch (err: any) {
    return error(500, err.message);
  }
};