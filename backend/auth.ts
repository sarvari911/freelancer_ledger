import { APIGatewayProxyEvent } from 'aws-lambda';

export const getUserId = (event: APIGatewayProxyEvent): string => {
  const userIdHeader = 
    event.headers?.['x-user-id'] || 
    event.headers?.['X-User-Id'] || 
    event.headers?.['authorization'] || 
    event.headers?.['Authorization'];

  if (userIdHeader) {
    return userIdHeader.replace('Bearer ', '').trim();
  }

  // Fallback default for local testing if header is omitted
  return 'demo-user-1';
};
