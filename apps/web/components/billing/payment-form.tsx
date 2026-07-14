'use client';

import { useState } from 'react';
import { billingApi } from '@/lib/billing';

interface PaymentFormProps {
  invoiceId: string;
  amount: number;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const PAYMENT_METHODS = [
  { value: 'CASH', label: '💵 Efectivo' },
  { value: 'CREDIT_CARD', label: '💳 Tarjeta de Crédito' },
  { value: 'DEBIT_CARD', label: '💳 Tarjeta de Débito' },
  { value: 'BANK_TRANSFER', label: '🏦 Transferencia Bancaria' },
  { value: 'INSURANCE', label: '🏥 Seguro Médico' },
  { value: 'STRIPE', label: '🌐 Pago Online' },
];

export function PaymentForm({ invoiceId, amount, onSubmit, onCancel, loading }: PaymentFormProps) {
  const [method, setMethod] = useState('CASH');
  const [paymentAmount, setPaymentAmount] = useState(amount.toString());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      invoiceId,
      amount: parseFloat(paymentAmount),
      method,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Registrar Pago</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Método de pago *
          </label>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map((pm) => (
              <button
                key={pm.value}
                type="button"
                onClick={() => setMethod(pm.value)}
                className={`p-3 text-left text-sm rounded-lg border transition ${
                  method === pm.value
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {pm.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Monto a pagar
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              max={amount}
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">Total de la factura: ${amount.toFixed(2)}</p>
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !paymentAmount || parseFloat(paymentAmount) <= 0}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            {loading ? 'Registrando...' : 'Registrar Pago'}
          </button>
        </div>
      </form>
    </div>
  );
}
