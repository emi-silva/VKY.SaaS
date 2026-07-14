'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { PrescriptionView } from '@/components/medical-records/prescription-view';
import { medicalRecordsApi, PatientSummary, MedicalRecord } from '@/lib/medical-records';
import { MedicalRecordCard } from '@/components/medical-records/medical-record-card';

export default function PatientHistoryPage() {
  const params = useParams();
  const patientId = params.id as string;

  const [summary, setSummary] = useState<PatientSummary | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [showPrescription, setShowPrescription] = useState(false);

  useEffect(() => {
    if (patientId) loadHistory();
  }, [patientId]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const [summaryRes, historyRes] = await Promise.all([
        medicalRecordsApi.getPatientSummary(patientId),
        medicalRecordsApi.getPatientHistory(patientId),
      ]);
      setSummary(summaryRes.data.data);
      setRecords(historyRes.data.data.records);
    } catch (error) {
      console.error('Error al cargar historial:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Historial del Paciente</h1>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100">Cargando historial...</div>
      ) : !summary ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100">Paciente no encontrado</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Resumen del paciente */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {summary.patient.firstName} {summary.patient.lastName}
              </h3>
              <div className="space-y-3">
                {summary.patient.bloodType && (
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-xl">
                    <span className="text-sm text-red-700">Tipo de sangre</span>
                    <span className="font-semibold text-red-700">{summary.patient.bloodType}</span>
                  </div>
                )}
                {summary.patient.allergies && (
                  <div className="p-3 bg-yellow-50 rounded-xl">
                    <span className="text-sm text-yellow-700 font-medium">Alergias:</span>
                    <p className="text-sm text-yellow-800">{summary.patient.allergies}</p>
                  </div>
                )}
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-600">Total consultas</span>
                  <span className="font-semibold text-sm">{summary.stats.totalRecords}</span>
                </div>
                {summary.stats.lastVisit && (
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm text-gray-600">Última visita</span>
                    <span className="text-sm">{new Date(summary.stats.lastVisit).toLocaleDateString('es-ES')}</span>
                  </div>
                )}
              </div>
            </div>

            {summary.topDiagnoses.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h4 className="font-semibold text-gray-900 mb-3">Diagnósticos frecuentes</h4>
                <div className="space-y-2">
                  {summary.topDiagnoses.map((d, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span className="text-gray-700">{d.diagnosis}</span>
                      <span className="text-gray-500">{d.count}x</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Línea de tiempo */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Línea de tiempo</h3>
            {records.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                </div>
                <p className="text-gray-500 text-sm">Sin registros médicos</p>
              </div>
            ) : (
              <div className="space-y-4">
                {records.map((record) => (
                  <div key={record.id}>
                    <MedicalRecordCard record={record} showPatient={false} onView={(id) => { setSelectedRecord(records.find((r) => r.id === id) || null); }} />
                    {record.prescription && (
                      <button onClick={() => { setSelectedRecord(record); setShowPrescription(true); }} className="mt-2 text-sm text-blue-600 hover:underline">
                        Ver receta
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de receta */}
      {showPrescription && selectedRecord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <PrescriptionView record={selectedRecord} onClose={() => { setShowPrescription(false); setSelectedRecord(null); }} onPrint={() => window.print()} />
          </div>
        </div>
      )}
    </div>
  );
}
