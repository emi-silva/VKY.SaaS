'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { MedicalRecordForm } from '@/components/medical-records/medical-record-form';
import { medicalRecordsApi } from '@/lib/medical-records';
import { useAuthStore } from '@/stores/auth.store';
import { appointmentsApi } from '@/lib/appointments';

export default function NewMedicalRecordPage() {
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const appointmentId = searchParams.get('appointmentId');
  const patientId = searchParams.get('patientId');

  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (appointmentId) loadAppointment();
  }, [appointmentId]);

  const loadAppointment = async () => {
    try {
      const { data } = await appointmentsApi.getById(appointmentId!);
      setAppointment(data.data);
    } catch (err) {
      console.error('Error al cargar cita:', err);
    }
  };

  const handleSubmit = async (data: any) => {
    setLoading(true);
    setError('');
    try {
      await medicalRecordsApi.create(data);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al crear historial');
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'DOCTOR') {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center max-w-lg mx-auto mt-12">
          <p className="text-gray-500">Solo doctores pueden crear historiales</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Nuevo Historial Médico</h1>
      </div>

      {success ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Historial creado exitosamente</h2>
          <p className="text-gray-500 mb-6">El historial médico ha sido registrado correctamente.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/dashboard/medical-records" className="px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition text-sm font-medium text-center">
              Ver historiales
            </a>
            <a href="/dashboard/appointments" className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition text-sm font-medium text-center">
              Volver a citas
            </a>
          </div>
        </div>
      ) : (
        <>
          {appointment && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <h3 className="font-medium text-blue-900 mb-1">Cita asociada</h3>
              <p className="text-sm text-blue-700">
                {appointment.patient?.firstName} {appointment.patient?.lastName} — {new Date(appointment.startTime).toLocaleDateString('es-ES')}
              </p>
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>
          )}
          <MedicalRecordForm appointmentId={appointmentId || undefined} patientId={patientId || appointment?.patientId} onSubmit={handleSubmit} onCancel={() => window.history.back()} loading={loading} mode="create" />
        </>
      )}
    </div>
  );
}
