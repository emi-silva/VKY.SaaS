'use client';

import { useState, useEffect } from 'react';
import { Calendar } from '@/components/calendar/calendar';
import { AppointmentForm } from '@/components/appointments/appointment-form';
import { AppointmentCard } from '@/components/appointments/appointment-card';
import { appointmentsApi, Appointment } from '@/lib/appointments';
import { useAuthStore } from '@/stores/auth.store';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AppointmentsPage() {
  const { user } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  useEffect(() => {
    loadAppointments();
  }, [selectedDate]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const startDate = selectedDate ? startOfMonth(selectedDate) : startOfMonth(new Date());
      const endDate = selectedDate ? endOfMonth(selectedDate) : endOfMonth(new Date());
      const { data } = await appointmentsApi.list({ startDate: startDate.toISOString(), endDate: endDate.toISOString() });
      setAppointments(data.data);
    } catch (error) {
      console.error('Error al cargar citas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: Date) => { setSelectedDate(date); setSelectedTime(null); };

  const handleCreateAppointment = async (data: any) => {
    try {
      await appointmentsApi.create(data);
      setShowForm(false);
      setSelectedTime(null);
      loadAppointments();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error al crear la cita');
    }
  };

  const handleConfirm = async (id: string) => { try { await appointmentsApi.update(id, { status: 'CONFIRMED' }); loadAppointments(); } catch (e) { console.error(e); } };
  const handleCancel = async (id: string) => { if (confirm('¿Estás seguro de cancelar esta cita?')) { try { await appointmentsApi.cancel(id); loadAppointments(); } catch (e) { console.error(e); } } };
  const handleStart = async (id: string) => { try { await appointmentsApi.update(id, { status: 'IN_PROGRESS' }); loadAppointments(); } catch (e) { console.error(e); } };
  const handleComplete = async (id: string) => { try { await appointmentsApi.update(id, { status: 'COMPLETED' }); loadAppointments(); } catch (e) { console.error(e); } };

  const calendarEvents = appointments.map((apt) => ({
    date: new Date(apt.startTime),
    title: apt.patient ? `${apt.patient.firstName} ${apt.patient.lastName}` : apt.doctor ? `Dr. ${apt.doctor.firstName}` : 'Cita',
    type: apt.status === 'CONFIRMED' ? 'confirmed' as const : apt.status === 'CANCELLED' ? 'cancelled' as const : 'pending' as const,
  }));

  const selectedDateAppointments = appointments.filter((apt) => {
    if (!selectedDate) return false;
    const aptDate = new Date(apt.startTime);
    return aptDate.getFullYear() === selectedDate.getFullYear() && aptDate.getMonth() === selectedDate.getMonth() && aptDate.getDate() === selectedDate.getDate();
  });

  const pendingCount = appointments.filter((a) => a.status === 'SCHEDULED').length;
  const confirmedCount = appointments.filter((a) => a.status === 'CONFIRMED').length;
  const completedCount = appointments.filter((a) => a.status === 'COMPLETED').length;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Encabezado de la página */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
          <p className="text-gray-500 mt-1">Gestiona las citas de tu clínica</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-5 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition text-sm"
        >
          {showForm ? 'Cerrar' : '+ Nueva Cita'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendario + Citas */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <Calendar selectedDate={selectedDate} onDateSelect={handleDateSelect} events={calendarEvents} />
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedDate ? `Citas del ${format(selectedDate, "d 'de' MMMM", { locale: es })}` : 'Selecciona una fecha'}
            </h3>
            {loading ? (
              <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100">Cargando...</div>
            ) : selectedDateAppointments.length > 0 ? (
              <div className="space-y-4">
                {selectedDateAppointments.map((apt) => (
                  <AppointmentCard key={apt.id} appointment={apt} onConfirm={handleConfirm} onCancel={handleCancel} onStart={handleStart} onComplete={handleComplete} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100">
                <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                No hay citas para esta fecha
              </div>
            )}
          </div>
        </div>

        {/* Barra lateral */}
        <div className="lg:col-span-1">
          {showForm ? (
            <AppointmentForm selectedDate={selectedDate} selectedTime={selectedTime} onSubmit={handleCreateAppointment} onCancel={() => { setShowForm(false); setSelectedTime(null); }} />
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-600">Total citas</span>
                  <span className="text-sm font-semibold text-gray-900">{appointments.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-amber-50 rounded-xl">
                  <span className="text-sm text-amber-700">Pendientes</span>
                  <span className="text-sm font-semibold text-amber-700">{pendingCount}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl">
                  <span className="text-sm text-blue-700">Confirmadas</span>
                  <span className="text-sm font-semibold text-blue-700">{confirmedCount}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl">
                  <span className="text-sm text-green-700">Completadas</span>
                  <span className="text-sm font-semibold text-green-700">{completedCount}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
