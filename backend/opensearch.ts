import { Client } from '@opensearch-project/opensearch';

export const openSearchClient = new Client({
  node: process.env.OPENSEARCH_ENDPOINT || 'http://host.docker.internal:9200',
  ssl: { rejectUnauthorized: false },
});

export const INDEX_NAME = 'freelancer-ledger-invoices-local';

export const ensureIndexExists = async () => {
  try {
    const exists = await openSearchClient.indices.exists({ index: INDEX_NAME });
    if (!exists.body) {
      await openSearchClient.indices.create({ index: INDEX_NAME });
    }
  } catch (e) {
    console.error('OpenSearch index setup error:', e);
  }
};