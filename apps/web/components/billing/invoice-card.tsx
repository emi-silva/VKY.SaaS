'use client';

import { Invoice } from '@/lib/billing';
import { formatCurrency, formatDateTime, getStatusColor } from '@/lib/utils';

interface InvoiceCardProps {
  invoice: Invoice;
  onView?: (id: string) => void;
  onPay?: (id: string) => void;
  onCancel?: (id: string) => void;
  showPatient?: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  PAID: 'Pagada',
  OVERDUE: 'Vencida',
  CANCELLED: 'Cancelada',
  REFUNDED: 'Reembolsada',
};

const METHOD_LABELS: Record<string, string> = {
  CASH: 'Efectivo',
  CREDIT_CARD: 'Tarjeta Crédito',
  DEBIT_CARD: 'Tarjeta Débito',
  BANK_TRANSFER: 'Transferencia',
  INSURANCE: 'Seguro',
  STRIPE: 'Online',
};

export function InvoiceCard({
  invoice,
  onView,
  onPay,
  onCancel,
  showPatient = true,
}: InvoiceCardProps) {
  const statusColor = getStatusColor(invoice.status);
  const totalPaid = invoice.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const remaining = invoice.amount - totalPaid;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* ID y fecha de factura */}
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <span className="mr-2">📄</span>
            <span className="font-mono">{invoice.id.slice(0, 8).toUpperCase()}</span>
            <span className="mx-2">•</span>
            <span>{formatDateTime(invoice.createdAt)}</span>
          </div>

          {/* Paciente */}
          {showPatient && invoice.patient && (
            <p className="text-sm text-gray-600 mb-1">
              👤 {invoice.patient.firstName} {invoice.patient.lastName}
            </p>
          )}

          {/* Descripción */}
          {invoice.description && (
            <p className="text-sm text-gray-600 mb-2">{invoice.description}</p>
          )}

          {/* Monto y estado */}
          <div className="flex items-center space-x-4">
            <span className="text-lg font-semibold text-gray-900">
              {formatCurrency(invoice.amount, invoice.currency)}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${statusColor}`}>
              {STATUS_LABELS[invoice.status]}
            </span>
          </div>

          {/* Información de pago */}
          {invoice.status !== 'PAID' && totalPaid > 0 && (
            <div className="mt-2 text-sm">
              <span className="text-green-600">Pagado: {formatCurrency(totalPaid)}</span>
              <span className="mx-2">•</span>
              <span className="text-red-600">Restante: {formatCurrency(remaining)}</span>
            </div>
          )}

          {/* Fecha de vencimiento */}
          {invoice.dueAt && invoice.status === 'PENDING' && (
            <p className="mt-2 text-sm text-gray-500">
              📅 Vence: {new Date(invoice.dueAt).toLocaleDateString('es-ES')}
            </p>
          )}

          {/* Lista de pagos */}
          {invoice.payments && invoice.payments.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs font-medium text-gray-500 mb-1">Pagos:</p>
              {invoice.payments.map((payment) => (
                <div key={payment.id} className="flex items-center text-xs text-gray-600">
                  <span className="mr-2">✓</span>
                  <span>{formatCurrency(payment.amount)}</span>
                  <span className="mx-1">•</span>
                  <span>{METHOD_LABELS[payment.method]}</span>
                  <span className="mx-1">•</span>
                  <span>{new Date(payment.createdAt).toLocaleDateString('es-ES')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="mt-4 flex flex-wrap gap-2">
        {onView && (
          <button
            onClick={() => onView(invoice.id)}
            className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Ver detalle
          </button>
        )}
        {onPay && invoice.status !== 'PAID' && (
          <button
            onClick={() => onPay(invoice.id)}
            className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Registrar pago
          </button>
        )}
        {onCancel && invoice.status === 'PENDING' && (
          <button
            onClick={() => onCancel(invoice.id)}
            className="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  );
}
