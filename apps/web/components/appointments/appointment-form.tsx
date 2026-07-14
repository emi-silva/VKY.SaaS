'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { appointmentsApi, TimeSlot } from '@/lib/appointments';
import { usersApi } from '@/lib/api';

interface AppointmentFormProps {
  selectedDate: Date | null;
  selectedTime: string | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  specialty: string;
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  user?: { email: string };
}

export function AppointmentForm({
  selectedDate,
  selectedTime,
  onSubmit,
  onCancel,
  loading = false,
}: AppointmentFormProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>(selectedTime || '');
  const [type, setType] = useState<'IN_PERSON' | 'TELEMEDICINE'>('IN_PERSON');
  const [reason, setReason] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    loadDoctors();
    loadPatients();
  }, []);

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedDoctor, selectedDate]);

  useEffect(() => {
    if (selectedTime) {
      setSelectedSlot(selectedTime);
    }
  }, [selectedTime]);

  const loadDoctors = async () => {
    try {
      const { data } = await usersApi.listDoctors();
      setDoctors(data.data);
    } catch (error) {
      console.error('Error al cargar doctores:', error);
    }
  };

  const loadPatients = async () => {
    try {
      const { data } = await usersApi.list({ role: 'PATIENT', limit: 100 });
      setPatients(data.data);
    } catch (error) {
      console.error('Error al cargar pacientes:', error);
    }
  };

  const loadAvailableSlots = async () => {
    if (!selectedDoctor || !selectedDate) return;

    setLoadingSlots(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const { data } = await appointmentsApi.getAvailableSlots(selectedDoctor, dateStr);
      setAvailableSlots(data.data);
    } catch (error) {
      console.error('Error al cargar horarios:', error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDate || !selectedSlot || !selectedDoctor || !selectedPatient) {
      return;
    }

    const startTime = new Date(selectedDate);
    const [hours, minutes] = selectedSlot.split(':').map(Number);
    startTime.setHours(hours, minutes, 0, 0);

    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + 30);

    await onSubmit({
      patientId: selectedPatient,
      doctorId: selectedDoctor,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      type,
      reason,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Nueva Cita</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Visualización de fecha */}
        {selectedDate && (
          <div className="bg-primary-50 p-3 rounded-lg">
            <p className="text-sm text-primary-700">
              📅 {format(selectedDate, "EEEE d 'de' MMMM, yyyy", { locale: es })}
            </p>
          </div>
        )}

        {/* Selección de doctor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Doctor *
          </label>
          <select
            value={selectedDoctor}
            onChange={(e) => setSelectedDoctor(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Seleccionar doctor</option>
            {doctors.map((doc) => (
              <option key={doc.id} value={doc.id}>
                Dr. {doc.firstName} {doc.lastName} - {doc.specialty}
              </option>
            ))}
          </select>
        </div>

        {/* Selección de paciente */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Paciente *
          </label>
          <select
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Seleccionar paciente</option>
            {patients.map((pat) => (
              <option key={pat.id} value={pat.id}>
                {pat.firstName} {pat.lastName}
              </option>
            ))}
          </select>
        </div>

        {/* Franjas horarias */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hora *
          </label>
          {loadingSlots ? (
            <div className="text-sm text-gray-500">Cargando horarios...</div>
          ) : availableSlots.length > 0 ? (
            <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
              {availableSlots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`
                    px-3 py-2 text-sm rounded-lg border transition
                    ${selectedSlot === slot
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  {slot}
                </button>
              ))}
            </div>
          ) : selectedDoctor ? (
            <p className="text-sm text-gray-500">No hay horarios disponibles</p>
          ) : (
            <p className="text-sm text-gray-500">Selecciona un doctor primero</p>
          )}
        </div>

        {/* Tipo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de consulta *
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="type"
                value="IN_PERSON"
                checked={type === 'IN_PERSON'}
                onChange={() => setType('IN_PERSON')}
                className="mr-2"
              />
              🏥 Presencial
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="type"
                value="TELEMEDICINE"
                checked={type === 'TELEMEDICINE'}
                onChange={() => setType('TELEMEDICINE')}
                className="mr-2"
              />
              📹 Telemedicina
            </label>
          </div>
        </div>

        {/* Motivo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Motivo de la consulta
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Describe brevemente el motivo..."
          />
        </div>

        {/* Acciones */}
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
            disabled={loading || !selectedSlot || !selectedDoctor || !selectedPatient}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
          >
            {loading ? 'Agendando...' : 'Agendar Cita'}
          </button>
        </div>
      </form>
    </div>
  );
}
