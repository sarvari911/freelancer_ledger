export interface Client {
  userId: string;
  clientId: string;
  name: string;
  email: string;
  createdAt: string;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface Invoice {
  userId: string;
  invoiceId: string;
  clientId: string;
  amountMinor: number;
  status: InvoiceStatus;
  dueDate?: string;
  description?: string;
  createdAt: string;
}

export interface Payment {
  userId: string;
  paymentId: string;
  invoiceId: string;
  amountMinor: number;
  createdAt: string;
}

export interface Ledger {
  clientId: string;
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  totalOverdue: number;
}