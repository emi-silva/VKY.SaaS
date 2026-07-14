'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MedicalRecordCard } from '@/components/medical-records/medical-record-card';
import { PrescriptionView } from '@/components/medical-records/prescription-view';
import { medicalRecordsApi, MedicalRecord } from '@/lib/medical-records';
import { useAuthStore } from '@/stores/auth.store';

export default function MedicalRecordsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [showPrescription, setShowPrescription] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => { loadRecords(); }, [page]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const { data } = await medicalRecordsApi.list({ page, limit: 10 });
      setRecords(data.data);
      setTotalPages(data.pagination.totalPages);
    } catch (error) { console.error('Error al cargar historiales:', error); } finally { setLoading(false); }
  };

  const handleView = (id: string) => { setSelectedRecord(records.find((r) => r.id === id) || null); };
  const handleViewPrescription = (id: string) => { setSelectedRecord(records.find((r) => r.id === id) || null); setShowPrescription(true); };

  const withPrescription = records.filter((r) => r.prescription).length;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Historiales Médicos</h1>
          <p className="text-gray-500 mt-1">Consulta y gestiona registros clínicos</p>
        </div>
        {user?.role === 'DOCTOR' && (
          <button onClick={() => router.push('/dashboard/medical-records/new')} className="px-5 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition text-sm">
            + Nuevo Historial
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lista de historiales */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100">Cargando historiales...</div>
          ) : records.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">Sin historiales</h3>
              <p className="text-gray-500 text-sm mt-1">No hay historiales médicos registrados aún</p>
            </div>
          ) : (
            <div className="space-y-4">
              {records.map((record) => (
                <div key={record.id}>
                  <MedicalRecordCard record={record} showPatient={user?.role !== 'PATIENT'} onView={handleView} />
                  {record.prescription && (
                    <button onClick={() => handleViewPrescription(record.id)} className="mt-2 text-sm text-blue-600 hover:underline">
                      Ver receta
                    </button>
                  )}
                </div>
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

        {/* Barra lateral */}
        <div className="lg:col-span-1">
          {showPrescription && selectedRecord ? (
            <PrescriptionView record={selectedRecord} onClose={() => { setShowPrescription(false); setSelectedRecord(null); }} onPrint={() => window.print()} />
          ) : selectedRecord ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalle del Historial</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Diagnóstico</h4>
                  <p className="mt-1 text-gray-900">{selectedRecord.diagnosis}</p>
                </div>
                {selectedRecord.symptoms && <div><h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Síntomas</h4><p className="mt-1 text-sm text-gray-700">{selectedRecord.symptoms}</p></div>}
                {selectedRecord.treatment && <div><h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tratamiento</h4><p className="mt-1 text-sm text-gray-700">{selectedRecord.treatment}</p></div>}
                {selectedRecord.prescription && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Receta</h4>
                    <pre className="mt-1 text-sm text-gray-700 whitespace-pre-wrap font-sans">{selectedRecord.prescription}</pre>
                    <button onClick={() => setShowPrescription(true)} className="mt-2 text-sm text-blue-600 hover:underline">Ver receta completa</button>
                  </div>
                )}
                {selectedRecord.notes && <div><h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Notas</h4><p className="mt-1 text-sm text-gray-600 italic">{selectedRecord.notes}</p></div>}
              </div>
              <button onClick={() => setSelectedRecord(null)} className="mt-6 w-full px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition text-sm">
                Cerrar
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-600">Total historiales</span>
                  <span className="text-sm font-semibold text-gray-900">{records.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl">
                  <span className="text-sm text-blue-700">Con receta</span>
                  <span className="text-sm font-semibold text-blue-700">{withPrescription}</span>
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-400 text-center">Selecciona un historial para ver el detalle</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
