import { APIGatewayProxyHandler } from 'aws-lambda';
import { openSearchClient, INDEX_NAME } from './opensearch';
import { success, error } from './responses';
import { getUserId } from './auth';

export const handler: APIGatewayProxyHandler = async (event) => {
  const query = event.queryStringParameters?.q;
  const userId = getUserId(event);

  if (!query) {
    return error(400, 'Query parameter "q" is required');
  }

  try {
    const response = await openSearchClient.search({
      index: INDEX_NAME,
      body: {
        query: {
          bool: {
            must: [
              { match: { userId } },
              {
                multi_match: {
                  query,
                  fields: ['description'],
                  fuzziness: 'AUTO'
                }
              }
            ]
          }
        }
      }
    });

    const hits = response.body.hits.hits.map((hit: any) => hit._source);
    return success(hits);
  } catch (err: any) {
    return error(500, err.message);
  }
};