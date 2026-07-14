import { api } from '@/lib/api';

export interface Invoice {
  id: string;
  patientId: string;
  appointmentId?: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'REFUNDED';
  description?: string;
  stripeInvoiceId?: string;
  paidAt?: string;
  dueAt?: string;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    user?: { email: string };
  };
  payments?: Payment[];
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  currency: string;
  method: 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'BANK_TRANSFER' | 'INSURANCE' | 'STRIPE';
  stripePaymentId?: string;
  status: string;
  createdAt: string;
}

export interface BillingStats {
  totalInvoices: number;
  pendingInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
  monthlyRevenue: number;
  pendingAmount: number;
}

export const billingApi = {
  // Facturas
  listInvoices: (params?: { patientId?: string; status?: string; page?: number; limit?: number }) =>
    api.get('/invoices', { params }),

  getInvoice: (id: string) =>
    api.get(`/invoices/${id}`),

  createInvoice: (data: {
    patientId: string;
    appointmentId?: string;
    amount: number;
    currency?: string;
    description?: string;
    dueAt?: string;
  }) => api.post('/invoices', data),

  updateInvoice: (id: string, data: {
    status?: string;
    description?: string;
    dueAt?: string;
  }) => api.patch(`/invoices/${id}`, data),

  // Pagos
  listPayments: (params?: { invoiceId?: string }) =>
    api.get('/payments', { params }),

  createPayment: (data: {
    invoiceId: string;
    amount: number;
    method: string;
  }) => api.post('/payments', data),

  // Estadísticas
  getStats: () =>
    api.get('/billing/stats'),

  // Stripe
  createCheckout: (invoiceId: string) =>
    api.post('/billing/checkout', { invoiceId }),
};
