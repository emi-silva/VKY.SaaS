'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { StatsCards } from '@/components/billing/stats-cards';
import { InvoiceCard } from '@/components/billing/invoice-card';
import { InvoiceForm } from '@/components/billing/invoice-form';
import { PaymentForm } from '@/components/billing/payment-form';
import { billingApi, Invoice, BillingStats } from '@/lib/billing';
import { useAuthStore } from '@/stores/auth.store';

export default function BillingPage() {
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const paymentSuccess = searchParams.get('success');
  const paymentCancelled = searchParams.get('cancelled');
  const canCreate = user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST';

  useEffect(() => { loadData(); }, [page]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, invoicesRes] = await Promise.all([billingApi.getStats(), billingApi.listInvoices({ page, limit: 10 })]);
      setStats(statsRes.data.data);
      setInvoices(invoicesRes.data.data);
      setTotalPages(invoicesRes.data.pagination.totalPages);
    } catch (error) { console.error('Error al cargar datos de facturación:', error); } finally { setLoading(false); }
  };

  const handleCreateInvoice = async (data: any) => { try { await billingApi.createInvoice(data); setShowCreateForm(false); loadData(); } catch (e: any) { alert(e.response?.data?.error || 'Error al crear factura'); } };
  const handleCreatePayment = async (data: any) => { try { await billingApi.createPayment(data); setShowPaymentForm(false); setSelectedInvoice(null); loadData(); } catch (e: any) { alert(e.response?.data?.error || 'Error al registrar pago'); } };
  const handlePayOnline = async (invoiceId: string) => { try { const { data } = await billingApi.createCheckout(invoiceId); if (data.data.url) window.location.href = data.data.url; } catch (e: any) { alert(e.response?.data?.error || 'Error al crear sesión de pago'); } };
  const handleCancel = async (invoiceId: string) => { if (confirm('¿Estás seguro de cancelar esta factura?')) { try { await billingApi.updateInvoice(invoiceId, { status: 'CANCELLED' }); loadData(); } catch (e) { console.error(e); } } };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Facturación</h1>
          <p className="text-gray-500 mt-1">Gestiona facturas y pagos de la clínica</p>
        </div>
        {canCreate && (
          <button onClick={() => setShowCreateForm(!showCreateForm)} className="px-5 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition text-sm">
            {showCreateForm ? 'Cerrar' : '+ Nueva Factura'}
          </button>
        )}
      </div>

      {/* Alertas */}
      {paymentSuccess && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-6 text-sm">Pago procesado exitosamente</div>}
      {paymentCancelled && <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl mb-6 text-sm">El pago fue cancelado</div>}

      {/* Estadísticas */}
      {stats && <StatsCards stats={stats} />}

      {/* Formularios */}
      {showCreateForm && <div className="mt-6"><InvoiceForm onSubmit={handleCreateInvoice} onCancel={() => setShowCreateForm(false)} /></div>}
      {showPaymentForm && selectedInvoice && (
        <div className="mt-6"><PaymentForm invoiceId={selectedInvoice.id} amount={selectedInvoice.amount} onSubmit={handleCreatePayment} onCancel={() => { setShowPaymentForm(false); setSelectedInvoice(null); }} /></div>
      )}

      {/* Facturas */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Facturas</h2>
        {loading ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100">Cargando facturas...</div>
        ) : invoices.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">Sin facturas</h3>
            <p className="text-gray-500 text-sm mt-1">No hay facturas registradas aún</p>
          </div>
        ) : (
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <InvoiceCard key={invoice.id} invoice={invoice} showPatient={user?.role !== 'PATIENT'} onPay={(id) => { setSelectedInvoice(invoices.find((i) => i.id === id) || null); setShowPaymentForm(true); }} onCancel={canCreate ? handleCancel : undefined} />
            ))}
            {totalPages > 1 && (
              <div className="flex justify-center space-x-2 mt-6">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 border border-gray-200 rounded-xl text-sm disabled:opacity-50 hover:bg-gray-50 transition">Anterior</button>
                <span className="px-3 py-1.5 text-sm text-gray-500">{page} / {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 border border-gray-200 rounded-xl text-sm disabled:opacity-50 hover:bg-gray-50 transition">Siguiente</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
