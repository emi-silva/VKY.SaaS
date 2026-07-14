'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Appointment } from '@/lib/appointments';

interface AppointmentCardProps {
  appointment: Appointment;
  onConfirm?: (id: string) => void;
  onCancel?: (id: string) => void;
  onStart?: (id: string) => void;
  onComplete?: (id: string) => void;
  showActions?: boolean;
}

const STATUS_CONFIG = {
  SCHEDULED: { label: 'Programada', color: 'bg-yellow-100 text-yellow-800', icon: '📅' },
  CONFIRMED: { label: 'Confirmada', color: 'bg-blue-100 text-blue-800', icon: '✓' },
  IN_PROGRESS: { label: 'En progreso', color: 'bg-purple-100 text-purple-800', icon: '▶' },
  COMPLETED: { label: 'Completada', color: 'bg-green-100 text-green-800', icon: '✓✓' },
  CANCELLED: { label: 'Cancelada', color: 'bg-red-100 text-red-800', icon: '✕' },
  NO_SHOW: { label: 'No asistió', color: 'bg-gray-100 text-gray-800', icon: '—' },
};

export function AppointmentCard({
  appointment,
  onConfirm,
  onCancel,
  onStart,
  onComplete,
  showActions = true,
}: AppointmentCardProps) {
  const statusConfig = STATUS_CONFIG[appointment.status];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Hora */}
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <span className="mr-2">🕐</span>
            <span>
              {format(new Date(appointment.startTime), 'HH:mm', { locale: es })} -{' '}
              {format(new Date(appointment.endTime), 'HH:mm', { locale: es })}
            </span>
            <span className="mx-2">•</span>
            <span>{format(new Date(appointment.startTime), 'EEEE d', { locale: es })}</span>
          </div>

          {/* Información del paciente/doctor */}
          <div className="mb-2">
            {appointment.patient && (
              <p className="font-medium text-gray-900">
                👤 {appointment.patient.firstName} {appointment.patient.lastName}
              </p>
            )}
            {appointment.doctor && (
              <p className="text-sm text-gray-600">
                🩺 Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}
              </p>
            )}
          </div>

          {/* Tipo y estado */}
          <div className="flex items-center space-x-2">
            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
              {appointment.type === 'TELEMEDICINE' ? '📹 Telemedicina' : '🏥 Presencial'}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${statusConfig.color}`}>
              {statusConfig.icon} {statusConfig.label}
            </span>
          </div>

          {/* Motivo */}
          {appointment.reason && (
            <p className="mt-2 text-sm text-gray-500 truncate">
              📝 {appointment.reason}
            </p>
          )}
        </div>
      </div>

      {/* Acciones */}
      {showActions && (
        <div className="mt-4 flex flex-wrap gap-2">
          {appointment.status === 'SCHEDULED' && onConfirm && (
            <button
              onClick={() => onConfirm(appointment.id)}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Confirmar
            </button>
          )}
          {appointment.status === 'CONFIRMED' && onStart && (
            <button
              onClick={() => onStart(appointment.id)}
              className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Iniciar
            </button>
          )}
          {appointment.status === 'IN_PROGRESS' && onComplete && (
            <button
              onClick={() => onComplete(appointment.id)}
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Completar
            </button>
          )}
          {['SCHEDULED', 'CONFIRMED'].includes(appointment.status) && onCancel && (
            <button
              onClick={() => onCancel(appointment.id)}
              className="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
            >
              Cancelar
            </button>
          )}
          {appointment.type === 'TELEMEDICINE' && appointment.roomUrl && (
            <a
              href={appointment.roomUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              📹 Unirse a videollamada
            </a>
          )}
        </div>
      )}
    </div>
  );
}
