const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,x-user-id,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

export const success = (body: any, statusCode = 200) => {
  return {
    statusCode,
    headers,
    body: JSON.stringify(body),
  };
};

export const error = (statusCode: number, message: string) => {
  return {
    statusCode,
    headers,
    body: JSON.stringify({ error: message }),
  };
};