import type { Client, Invoice, Payment, Ledger } from './types';
const API_BASE_URL = 'http://127.0.0.1:3000';

export const apiRequest = async <T>(
  endpoint: string,
  method: string = 'GET',
  body?: any,
  userId: string = 'demo-user-1'
): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': userId,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error status: ${response.status}`);
  }

  return response.json();
};

export const api = {
  // Client Endpoints
  getClients: (userId?: string) => 
    apiRequest<Client[]>('/clients', 'GET', undefined, userId),
  
  createClient: (data: { name: string; email: string }, userId?: string) =>
    apiRequest<Client>('/clients', 'POST', data, userId),

  // Invoice Endpoints
  getInvoices: (clientId: string, userId?: string) =>
    apiRequest<Invoice[]>(`/clients/${clientId}/invoices`, 'GET', undefined, userId),

  createInvoice: (
    clientId: string,
    data: { amountMinor: number; description: string; dueDate?: string },
    userId?: string
  ) => apiRequest<Invoice>(`/clients/${clientId}/invoices`, 'POST', data, userId),

  // Payment & Ledger Endpoints
  createPayment: (invoiceId: string, amountMinor: number, userId?: string) =>
    apiRequest<Payment>(`/invoices/${invoiceId}/payments`, 'POST', { amountMinor }, userId),

  getLedger: (clientId: string, userId?: string) =>
    apiRequest<Ledger>(`/clients/${clientId}/ledger`, 'GET', undefined, userId),

  // Search Endpoint
  searchInvoices: (query: string, userId?: string) =>
    apiRequest<Invoice[]>(`/search/invoices?q=${encodeURIComponent(query)}`, 'GET', undefined, userId),

  // PDF Statement Endpoint
  generatePdfUrl: (invoiceId: string, userId?: string) =>
    apiRequest<{ invoiceId: string; s3Key: string; downloadUrl: string }>(
      `/invoices/${invoiceId}/pdf`,
      'POST',
      undefined,
      userId
    ),
};